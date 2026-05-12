package sqlite

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"log"
	"time"

	_ "modernc.org/sqlite"

	"wps365auth/oauth"
	"wps365auth/store"
)

// Store 基于 SQLite 的持久化存储，实现 SessionStore、TokenStore、UserRepo。
// 一张 users 表，wps_user_id 为主键，一个用户一行。
type Store struct {
	db  *sql.DB
	ttl time.Duration
}

func New(dsn string, ttl time.Duration) (*Store, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)

	if _, err := db.Exec(`PRAGMA journal_mode=WAL`); err != nil {
		db.Close()
		return nil, err
	}

	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS users (
		wps_user_id        TEXT PRIMARY KEY,
		sid                TEXT NOT NULL DEFAULT '',
		company_id         TEXT NOT NULL DEFAULT '',
		access_token       TEXT NOT NULL DEFAULT '',
		access_expires_at  INTEGER NOT NULL DEFAULT 0,
		refresh_token      TEXT NOT NULL DEFAULT '',
		refresh_expires_at INTEGER NOT NULL DEFAULT 0,
		scope              TEXT NOT NULL DEFAULT '',
		token_type         TEXT NOT NULL DEFAULT '',
		user_name          TEXT NOT NULL DEFAULT '',
		avatar             TEXT NOT NULL DEFAULT '',
		local_id           INTEGER NOT NULL DEFAULT 0,
		created_at         INTEGER NOT NULL DEFAULT 0,
		last_seen_at       INTEGER NOT NULL DEFAULT 0,
		expires_at         INTEGER NOT NULL DEFAULT 0
	)`); err != nil {
		db.Close()
		return nil, err
	}

	if _, err := db.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_sid ON users(sid) WHERE sid != ''`); err != nil {
		db.Close()
		return nil, err
	}

	s := &Store{db: db, ttl: ttl}
	go s.cleanup()
	return s, nil
}

func (s *Store) Close() error { return s.db.Close() }

// ─── SessionStore ────────────────────────────────────────────────

func (s *Store) Create(_ context.Context, sess *store.Session) error {
	if sess.ID == "" {
		sess.ID = randomHex(32)
	}
	now := time.Now()
	if sess.CreatedAt.IsZero() {
		sess.CreatedAt = now
	}
	sess.LastSeenAt = now
	if sess.ExpiresAt.IsZero() {
		sess.ExpiresAt = now.Add(s.ttl)
	}

	var localID int64
	s.db.QueryRow(`SELECT local_id FROM users WHERE wps_user_id = ?`, sess.WPSUserID).Scan(&localID)
	sess.LocalUserID = localID

	_, err := s.db.Exec(`UPDATE users SET
		sid = ?, company_id = ?, created_at = ?, last_seen_at = ?, expires_at = ?
		WHERE wps_user_id = ?`,
		sess.ID, sess.CompanyID,
		sess.CreatedAt.Unix(), sess.LastSeenAt.Unix(), sess.ExpiresAt.Unix(),
		sess.WPSUserID,
	)
	return err
}

func (s *Store) Get(_ context.Context, sid string) (*store.Session, error) {
	var (
		wpsUserID, companyID    string
		localID                 int64
		createdAt, lastSeen, ex int64
	)
	err := s.db.QueryRow(`SELECT wps_user_id, company_id, local_id,
		created_at, last_seen_at, expires_at
		FROM users WHERE sid = ?`, sid,
	).Scan(&wpsUserID, &companyID, &localID, &createdAt, &lastSeen, &ex)
	if err == sql.ErrNoRows {
		return nil, store.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	expiresAt := time.Unix(ex, 0)
	if time.Now().After(expiresAt) {
		s.db.Exec(`UPDATE users SET sid = '' WHERE sid = ?`, sid)
		return nil, store.ErrExpired
	}

	return &store.Session{
		ID:          sid,
		WPSUserID:   wpsUserID,
		CompanyID:   companyID,
		LocalUserID: localID,
		CreatedAt:   time.Unix(createdAt, 0),
		LastSeenAt:  time.Unix(lastSeen, 0),
		ExpiresAt:   expiresAt,
	}, nil
}

func (s *Store) Touch(_ context.Context, sid string, lastSeen time.Time) error {
	_, err := s.db.Exec(`UPDATE users SET last_seen_at = ? WHERE sid = ?`, lastSeen.Unix(), sid)
	return err
}

func (s *Store) Delete(_ context.Context, sid string) error {
	_, err := s.db.Exec(`UPDATE users SET sid = '', expires_at = 0 WHERE sid = ?`, sid)
	return err
}

func (s *Store) DeleteByUser(_ context.Context, wpsUserID string) error {
	_, err := s.db.Exec(`UPDATE users SET sid = '', expires_at = 0 WHERE wps_user_id = ?`, wpsUserID)
	return err
}

// ─── TokenStore ──────────────────────────────────────────────────

func (s *Store) GetUser(_ context.Context, wpsUserID string) (*oauth.UserToken, error) {
	var (
		accessToken, refreshToken, scope, tokenType string
		accessExp, refreshExp                       int64
	)
	err := s.db.QueryRow(`SELECT access_token, access_expires_at,
		refresh_token, refresh_expires_at, scope, token_type
		FROM users WHERE wps_user_id = ? AND access_token != ''`, wpsUserID,
	).Scan(&accessToken, &accessExp, &refreshToken, &refreshExp, &scope, &tokenType)
	if err == sql.ErrNoRows {
		return nil, store.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	return &oauth.UserToken{
		AccessToken:      accessToken,
		AccessExpiresAt:  time.Unix(accessExp, 0),
		RefreshToken:     refreshToken,
		RefreshExpiresAt: time.Unix(refreshExp, 0),
		Scope:            scope,
		TokenType:        tokenType,
	}, nil
}

// SaveUser 用 UPSERT：行不存在则 INSERT（首次登录），存在则 UPDATE token 字段。
func (s *Store) SaveUser(_ context.Context, wpsUserID string, t *oauth.UserToken) error {
	_, err := s.db.Exec(`INSERT INTO users (wps_user_id, access_token, access_expires_at,
		refresh_token, refresh_expires_at, scope, token_type)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(wps_user_id) DO UPDATE SET
			access_token = excluded.access_token,
			access_expires_at = excluded.access_expires_at,
			refresh_token = excluded.refresh_token,
			refresh_expires_at = excluded.refresh_expires_at,
			scope = excluded.scope,
			token_type = excluded.token_type`,
		wpsUserID,
		t.AccessToken, t.AccessExpiresAt.Unix(),
		t.RefreshToken, t.RefreshExpiresAt.Unix(),
		t.Scope, t.TokenType,
	)
	return err
}

func (s *Store) DeleteUser(_ context.Context, wpsUserID string) error {
	_, err := s.db.Exec(`UPDATE users SET
		access_token = '', refresh_token = '',
		access_expires_at = 0, refresh_expires_at = 0
		WHERE wps_user_id = ?`, wpsUserID)
	return err
}

func (s *Store) GetApp(_ context.Context) (*oauth.AppToken, error) {
	return nil, store.ErrNotFound
}

func (s *Store) SaveApp(_ context.Context, _ *oauth.AppToken) error {
	return nil
}

// ─── UserRepo ────────────────────────────────────────────────────

func (s *Store) Upsert(_ context.Context, wpsUserID, companyID, userName, avatar string) (*store.UserProfile, error) {
	now := time.Now()

	// 分配稳定的 local_id
	var localID int64
	err := s.db.QueryRow(`SELECT local_id FROM users WHERE wps_user_id = ?`, wpsUserID).Scan(&localID)
	if err != nil || localID == 0 {
		var maxID int64
		s.db.QueryRow(`SELECT COALESCE(MAX(local_id), 0) FROM users`).Scan(&maxID)
		localID = maxID + 1
	}

	_, err = s.db.Exec(`UPDATE users SET
		user_name = ?, avatar = ?, company_id = ?, local_id = ?
		WHERE wps_user_id = ?`,
		userName, avatar, companyID, localID, wpsUserID,
	)
	if err != nil {
		return nil, err
	}

	var createdAt int64
	s.db.QueryRow(`SELECT created_at FROM users WHERE wps_user_id = ?`, wpsUserID).Scan(&createdAt)
	if createdAt == 0 {
		createdAt = now.Unix()
	}

	return &store.UserProfile{
		LocalID:      localID,
		WPSUserID:    wpsUserID,
		CompanyID:    companyID,
		UserName:     userName,
		Avatar:       avatar,
		FirstLoginAt: time.Unix(createdAt, 0),
		LastLoginAt:  now,
		UpdatedAt:    now,
	}, nil
}

func (s *Store) GetByWPSID(_ context.Context, wpsUserID string) (*store.UserProfile, error) {
	var (
		companyID, userName, avatar string
		localID                    int64
		createdAt, lastSeen        int64
	)
	err := s.db.QueryRow(`SELECT company_id, user_name, avatar, local_id,
		created_at, last_seen_at
		FROM users WHERE wps_user_id = ?`, wpsUserID,
	).Scan(&companyID, &userName, &avatar, &localID, &createdAt, &lastSeen)
	if err == sql.ErrNoRows {
		return nil, store.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	return &store.UserProfile{
		LocalID:      localID,
		WPSUserID:    wpsUserID,
		CompanyID:    companyID,
		UserName:     userName,
		Avatar:       avatar,
		FirstLoginAt: time.Unix(createdAt, 0),
		LastLoginAt:  time.Unix(lastSeen, 0),
		UpdatedAt:    time.Unix(lastSeen, 0),
	}, nil
}

// ─── helpers ─────────────────────────────────────────────────────

func (s *Store) cleanup() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now().Unix()
		if res, err := s.db.Exec(`UPDATE users SET sid = '' WHERE expires_at > 0 AND expires_at < ?`, now); err == nil {
			if n, _ := res.RowsAffected(); n > 0 {
				log.Printf("[sqlite] 清理过期会话 %d 条", n)
			}
		}
	}
}

func randomHex(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}
