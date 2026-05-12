// Package store 定义所有持久化抽象。提供 SQLite 实现（store/sqlite），
// 一张 users 表同时承载 Session / Token / UserProfile。PreAuth 为纯内存（store/memory）。
package store

import (
	"context"
	"errors"
	"time"

	"wps365auth/oauth"
)

// 哨兵错误
var (
	ErrNotFound = errors.New("store: not found")
	ErrExpired  = errors.New("store: expired")
)

// PreAuthState 仅为 OAuth 跳转 → 回调期间的临时状态，10min 寿命，一次性使用。
type PreAuthState struct {
	ID           string    // 写入 wps_preauth cookie
	State        string    // CSRF
	Nonce        string    // 防重放
	RedirectPath string    // 登录成功后回跳的前端路径
	CreatedAt    time.Time
}

// Session 登录态会话。不持有 token；token 通过 WPSUserID 反查 TokenStore。
type Session struct {
	ID           string
	WPSUserID    string
	CompanyID    string
	LocalUserID  int64 // 业务方用本地主键
	CreatedAt    time.Time
	LastSeenAt   time.Time
	ExpiresAt    time.Time
}

// UserProfile 落库的用户基础资料。
type UserProfile struct {
	LocalID      int64
	WPSUserID    string
	CompanyID    string
	UserName     string
	Avatar       string
	FirstLoginAt time.Time
	LastLoginAt  time.Time
	UpdatedAt    time.Time
}

// PreAuthStore 一次性、短寿、可重启即清。
type PreAuthStore interface {
	Create(ctx context.Context, s *PreAuthState, ttl time.Duration) error
	Get(ctx context.Context, id string) (*PreAuthState, error)
	Delete(ctx context.Context, id string) error
}

// SessionStore 登录态会话存储。
type SessionStore interface {
	Create(ctx context.Context, s *Session) error
	Get(ctx context.Context, sid string) (*Session, error)
	Touch(ctx context.Context, sid string, lastSeen time.Time) error
	Delete(ctx context.Context, sid string) error
	// 预留扩展：未来"踢出该用户全部会话"使用。
	DeleteByUser(ctx context.Context, wpsUserID string) error
}

// TokenStore 用户 token 存储。生产环境强烈建议加密静态存储。
type TokenStore interface {
	GetUser(ctx context.Context, wpsUserID string) (*oauth.UserToken, error)
	SaveUser(ctx context.Context, wpsUserID string, t *oauth.UserToken) error
	DeleteUser(ctx context.Context, wpsUserID string) error

	// 应用授权（自建租户级），本次未启用。
	GetApp(ctx context.Context) (*oauth.AppToken, error)
	SaveApp(ctx context.Context, t *oauth.AppToken) error
}

// UserRepo 落库的用户基础资料仓储。
type UserRepo interface {
	Upsert(ctx context.Context, wpsUserID, companyID, userName, avatar string) (*UserProfile, error)
	GetByWPSID(ctx context.Context, wpsUserID string) (*UserProfile, error)
}
