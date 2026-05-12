package auth

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"wps365auth/oauth"
	"wps365auth/store"
	"wps365auth/user"
)

const (
	preAuthCookieName = "wps_preauth"
)

// sessionCookieName 从 client.Config.CookieName 取（defaults 时填 "itab-sid"），
// 接入项目可在 wps365auth.Config 里覆盖成自家前缀。
func (s *Service) sessionCookieName() string {
	return s.client.Config.CookieName
}

var redirectRe = regexp.MustCompile(`^/[a-zA-Z0-9/_\-?=&%.#]*$`)

type jsonResp struct {
	Code int    `json:"code"`
	Msg  string `json:"msg,omitempty"`
	Data any    `json:"data,omitempty"`
}

// --- /api/auth/login ---

func (s *Service) handleLogin(w http.ResponseWriter, r *http.Request) {
	redirect := r.URL.Query().Get("redirect")
	if !redirectRe.MatchString(redirect) {
		redirect = "/"
	}
	scopeParam := r.URL.Query().Get("scope")
	var scopes []string
	if scopeParam != "" {
		for _, p := range strings.Split(scopeParam, ",") {
			if p = strings.TrimSpace(p); p != "" {
				scopes = append(scopes, p)
			}
		}
	}

	ps := &store.PreAuthState{RedirectPath: redirect}
	if err := s.stores.PreAuth.Create(r.Context(), ps, s.client.Config.PreAuthTTL); err != nil {
		writeJSON(w, http.StatusInternalServerError, jsonResp{Code: 500, Msg: "create preauth failed"})
		return
	}

	s.setPreAuthCookie(w, ps.ID)
	authURL := oauth.AuthorizeURL(s.client, s.cfg.RedirectURI, ps.State, scopes)
	http.Redirect(w, r, authURL, http.StatusFound)
}

// --- /api/auth/callback ---

func (s *Service) handleCallback(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	if errParam := q.Get("error"); errParam != "" {
		s.redirectWithError(w, r, errParam, "")
		return
	}

	code := q.Get("code")
	state := q.Get("state")
	if code == "" {
		s.redirectWithError(w, r, "missing_code", "")
		return
	}

	preauthID := readCookie(r, preAuthCookieName)
	if preauthID == "" {
		s.redirectWithError(w, r, "invalid_state", "")
		return
	}
	ps, err := s.stores.PreAuth.Get(r.Context(), preauthID)
	if err != nil || ps.State == "" || ps.State != state {
		s.redirectWithError(w, r, "invalid_state", "")
		return
	}
	// 一次性使用
	_ = s.stores.PreAuth.Delete(r.Context(), preauthID)
	s.clearPreAuthCookie(w)

	tok, err := oauth.ExchangeCode(r.Context(), s.client, code, s.cfg.RedirectURI)
	if err != nil {
		log.Printf("[auth] 换取 token 失败: %v", err)
		s.redirectWithError(w, r, "token_exchange_failed", "")
		return
	}

	info, err := user.GetCurrent(r.Context(), s.client, tok.AccessToken)
	if err != nil {
		log.Printf("[auth] 获取用户信息失败: %v", err)
		s.redirectWithError(w, r, "userinfo_failed", "")
		return
	}

	if err := s.stores.Token.SaveUser(r.Context(), info.ID, tok); err != nil {
		log.Printf("[auth] 持久化 token 失败: %v", err)
		s.redirectWithError(w, r, "internal", "")
		return
	}

	profile, err := s.stores.UserRepo.Upsert(r.Context(), info.ID, info.CompanyID, info.UserName, info.Avatar)
	if err != nil {
		log.Printf("[auth] upsert 用户失败: %v", err)
		s.redirectWithError(w, r, "internal", "")
		return
	}

	// 创建新 sid（rotate）
	sess := &store.Session{
		WPSUserID:   info.ID,
		CompanyID:   info.CompanyID,
		LocalUserID: profile.LocalID,
		ExpiresAt:   time.Now().Add(s.client.Config.SessionTTL),
	}
	if err := s.stores.Session.Create(r.Context(), sess); err != nil {
		log.Printf("[auth] 创建 session 失败: %v", err)
		s.redirectWithError(w, r, "internal", "")
		return
	}
	s.setSessionCookie(w, sess.ID)

	target := s.cfg.FrontendURL + ps.RedirectPath
	log.Printf("[auth] 登录成功 user=%s name=%s redirect=%s", info.ID, info.UserName, target)
	http.Redirect(w, r, target, http.StatusFound)
}

// --- /api/auth/me ---

type meResp struct {
	ID                string `json:"id"`
	UserName          string `json:"user_name"`
	Avatar            string `json:"avatar"`
	CompanyID         string `json:"company_id"`
	LocalID           int64  `json:"local_id"`
	ExpiresIn         int64  `json:"expires_in"`
	MustReauthBefore  string `json:"must_reauth_before,omitempty"`
}

func (s *Service) handleMe(w http.ResponseWriter, r *http.Request) {
	auth := Auth(r.Context())
	forceRefresh := r.URL.Query().Get("refresh") == "1"

	profile := auth.Profile
	needRemote := forceRefresh || profile == nil || s.userCacheStale(auth.Session.WPSUserID)

	if needRemote {
		tok, err := s.stores.Token.GetUser(r.Context(), auth.Session.WPSUserID)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, jsonResp{Code: 401, Msg: "凭证已失效"})
			return
		}
		info, err := user.GetCurrent(r.Context(), s.client, tok.AccessToken)
		if err == nil {
			if p, perr := s.stores.UserRepo.Upsert(r.Context(), info.ID, info.CompanyID, info.UserName, info.Avatar); perr == nil {
				profile = p
				s.markUserCached(auth.Session.WPSUserID)
			}
		}
	}

	if profile == nil {
		// 极端情况：从未 upsert，无法回源
		writeJSON(w, http.StatusInternalServerError, jsonResp{Code: 500, Msg: "user profile unavailable"})
		return
	}

	tok, _ := s.stores.Token.GetUser(r.Context(), auth.Session.WPSUserID)
	resp := meResp{
		ID:        profile.WPSUserID,
		UserName:  profile.UserName,
		Avatar:    profile.Avatar,
		CompanyID: profile.CompanyID,
		LocalID:   profile.LocalID,
	}
	if tok != nil {
		resp.ExpiresIn = int64(time.Until(tok.AccessExpiresAt).Seconds())
		if !tok.RefreshExpiresAt.IsZero() && time.Until(tok.RefreshExpiresAt) < 7*24*time.Hour {
			resp.MustReauthBefore = tok.RefreshExpiresAt.UTC().Format(time.RFC3339)
		}
	}
	writeJSON(w, http.StatusOK, jsonResp{Code: 0, Data: resp})
}

func (s *Service) userCacheStale(wpsUserID string) bool {
	s.userCacheMu.RLock()
	defer s.userCacheMu.RUnlock()
	e, ok := s.userCache[wpsUserID]
	if !ok {
		return true
	}
	return time.Since(e.cachedAt) > s.client.Config.UserCacheTTL
}

func (s *Service) markUserCached(wpsUserID string) {
	s.userCacheMu.Lock()
	s.userCache[wpsUserID] = &userCacheEntry{cachedAt: time.Now()}
	s.userCacheMu.Unlock()
}

// --- /api/auth/status ---

type statusResp struct {
	LoggedIn  bool  `json:"logged_in"`
	ExpiresIn int64 `json:"expires_in,omitempty"`
}

func (s *Service) handleStatus(w http.ResponseWriter, r *http.Request) {
	sid := readCookie(r, s.sessionCookieName())
	if sid == "" {
		writeJSON(w, http.StatusOK, jsonResp{Code: 0, Data: statusResp{LoggedIn: false}})
		return
	}
	sess, err := s.stores.Session.Get(r.Context(), sid)
	if err != nil {
		writeJSON(w, http.StatusOK, jsonResp{Code: 0, Data: statusResp{LoggedIn: false}})
		return
	}
	tok, _ := s.stores.Token.GetUser(r.Context(), sess.WPSUserID)
	resp := statusResp{LoggedIn: true}
	if tok != nil {
		resp.ExpiresIn = int64(time.Until(tok.AccessExpiresAt).Seconds())
	}
	writeJSON(w, http.StatusOK, jsonResp{Code: 0, Data: resp})
}

// --- /api/auth/logout ---

func (s *Service) handleLogout(w http.ResponseWriter, r *http.Request) {
	sid := readCookie(r, s.sessionCookieName())
	if sid != "" {
		_ = s.stores.Session.Delete(r.Context(), sid)
		// 注意：不删 token、不调 WPS。多端共存策略；用户级强制下线见 docs §0.2。
	}
	s.clearSessionCookie(w)
	writeJSON(w, http.StatusOK, jsonResp{Code: 0, Msg: "已退出"})
}

// --- 内部辅助 ---

func (s *Service) redirectWithError(w http.ResponseWriter, r *http.Request, errCode, redirect string) {
	target := s.cfg.FrontendURL + "/?error=" + url.QueryEscape(errCode)
	if redirect != "" {
		target += "&redirect=" + url.QueryEscape(redirect)
	}
	http.Redirect(w, r, target, http.StatusFound)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func readCookie(r *http.Request, name string) string {
	c, err := r.Cookie(name)
	if err != nil || c.Value == "" {
		return ""
	}
	return c.Value
}

// --- Cookie helpers ---

func (s *Service) cookieSameSite() http.SameSite {
	switch strings.ToLower(s.client.Config.CookieSameSite) {
	case "none":
		return http.SameSiteNoneMode
	case "strict":
		return http.SameSiteStrictMode
	default:
		return http.SameSiteLaxMode
	}
}

func (s *Service) setSessionCookie(w http.ResponseWriter, sid string) {
	http.SetCookie(w, &http.Cookie{
		Name:     s.sessionCookieName(),
		Value:    sid,
		Path:     "/",
		Domain:   s.client.Config.CookieDomain,
		HttpOnly: true,
		Secure:   s.client.Config.CookieSecure,
		SameSite: s.cookieSameSite(),
		MaxAge:   int(s.client.Config.SessionTTL.Seconds()),
	})
}

func (s *Service) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     s.sessionCookieName(),
		Value:    "",
		Path:     "/",
		Domain:   s.client.Config.CookieDomain,
		HttpOnly: true,
		Secure:   s.client.Config.CookieSecure,
		SameSite: s.cookieSameSite(),
		MaxAge:   -1,
	})
}

func (s *Service) setPreAuthCookie(w http.ResponseWriter, id string) {
	http.SetCookie(w, &http.Cookie{
		Name:     preAuthCookieName,
		Value:    id,
		Path:     "/api/auth",
		Domain:   s.client.Config.CookieDomain,
		HttpOnly: true,
		Secure:   s.client.Config.CookieSecure,
		SameSite: s.cookieSameSite(),
		MaxAge:   int(s.client.Config.PreAuthTTL.Seconds()),
	})
}

func (s *Service) clearPreAuthCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     preAuthCookieName,
		Value:    "",
		Path:     "/api/auth",
		Domain:   s.client.Config.CookieDomain,
		HttpOnly: true,
		Secure:   s.client.Config.CookieSecure,
		SameSite: s.cookieSameSite(),
		MaxAge:   -1,
	})
}

// 占位：帮编译期发现包未变成无引用
var _ = context.Background
