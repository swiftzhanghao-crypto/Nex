package wps

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/util/grand"
)

func cfg(ctx context.Context, key string) string {
	return g.Cfg().MustGet(ctx, key).String()
}

type loginState struct {
	Redirect   string
	ExpiresAt  time.Time
}

var (
	stateStore     sync.Map
	cleanupStarted sync.Once
)

type Controller struct{}

func New() *Controller {
	cleanupStarted.Do(startSessionCleanup)
	return &Controller{}
}

func startSessionCleanup() {
	go func() {
		tick := func() {
			ctx := context.Background()
			_, err := g.DB().Model("sso_sessions").Ctx(ctx).
				WhereLT("expires_at", time.Now()).
				Delete()
			if err != nil {
				g.Log().Warningf(ctx, "wps sso session cleanup: %v", err)
			}
		}
		tick()
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			tick()
		}
	}()
}

func (c *Controller) Status(r *ghttp.Request) {
	ctx := r.Context()
	enabled := strings.TrimSpace(cfg(ctx, "wps.appId")) != "" &&
		strings.TrimSpace(cfg(ctx, "wps.appSecret")) != "" &&
		strings.TrimSpace(cfg(ctx, "wps.redirectUri")) != ""
	r.Response.WriteJsonExit(g.Map{"enabled": enabled})
}

func wpsOptional(ctx context.Context, key, def string) string {
	v, err := g.Cfg().Get(ctx, key)
	if err != nil || v.IsNil() {
		return def
	}
	s := strings.TrimSpace(v.String())
	if s == "" {
		return def
	}
	return s
}

func isWpsConfigured(ctx context.Context) bool {
	return strings.TrimSpace(cfg(ctx, "wps.appId")) != "" &&
		strings.TrimSpace(cfg(ctx, "wps.appSecret")) != "" &&
		strings.TrimSpace(cfg(ctx, "wps.redirectUri")) != ""
}

func validRedirectPath(p string) bool {
	return strings.HasPrefix(p, "/") && !strings.HasPrefix(p, "//")
}

func randomHex(nBytes int) (string, error) {
	b := make([]byte, nBytes)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func redirectFrontendError(r *ghttp.Request, frontendURL, msg string) {
	base := strings.TrimSuffix(frontendURL, "/")
	u := base + "/#/sso-callback?error=" + url.QueryEscape(msg)
	r.Response.RedirectTo(u, http.StatusFound)
}

func (c *Controller) Login(r *ghttp.Request) {
	ctx := r.Context()
	if !isWpsConfigured(ctx) {
		r.Response.Status = http.StatusServiceUnavailable
		r.Response.WriteJsonExit(g.Map{"error": "WPS SSO 未配置"})
		return
	}

	redir := r.GetQuery("redirect", "/").String()
	if redir == "" {
		redir = "/"
	}
	if !validRedirectPath(redir) {
		redir = "/"
	}

	state, err := randomHex(16)
	if err != nil {
		r.Response.Status = http.StatusInternalServerError
		r.Response.WriteJsonExit(g.Map{"error": "生成 state 失败"})
		return
	}

	stateStore.Store(state, &loginState{
		Redirect:   redir,
		ExpiresAt:  time.Now().Add(10 * time.Minute),
	})

	appID := cfg(ctx, "wps.appId")
	redirectURI := cfg(ctx, "wps.redirectUri")
	scopes := wpsOptional(ctx, "wps.scopes", "kso.user_base.read")
	openBase := strings.TrimSuffix(wpsOptional(ctx, "wps.openApiBase", "https://openapi.wps.cn"), "/")

	q := url.Values{}
	q.Set("client_id", appID)
	q.Set("response_type", "code")
	q.Set("redirect_uri", redirectURI)
	q.Set("scope", scopes)
	q.Set("state", state)

	authURL := openBase + "/oauth2/auth?" + q.Encode()
	r.Response.RedirectTo(authURL, http.StatusFound)
}

func (c *Controller) Callback(r *ghttp.Request) {
	ctx := r.Context()
	frontendURL := strings.TrimSuffix(wpsOptional(ctx, "wps.frontendUrl", "http://localhost:5173"), "/")
	cookieName := wpsOptional(ctx, "wps.cookieName", "itab-sid")

	if oerr := strings.TrimSpace(r.GetQuery("error", "").String()); oerr != "" {
		desc := strings.TrimSpace(r.GetQuery("error_description", "").String())
		if desc != "" {
			oerr = desc
		}
		redirectFrontendError(r, frontendURL, oerr)
		return
	}

	state := r.GetQuery("state", "").String()
	code := r.GetQuery("code", "").String()
	if state == "" || code == "" {
		redirectFrontendError(r, frontendURL, "missing code or state")
		return
	}

	raw, ok := stateStore.LoadAndDelete(state)
	if !ok {
		redirectFrontendError(r, frontendURL, "invalid state")
		return
	}
	st := raw.(*loginState)
	if time.Now().After(st.ExpiresAt) {
		redirectFrontendError(r, frontendURL, "state expired")
		return
	}

	if !isWpsConfigured(ctx) {
		redirectFrontendError(r, frontendURL, "WPS SSO 未配置")
		return
	}

	appID := cfg(ctx, "wps.appId")
	appSecret := cfg(ctx, "wps.appSecret")
	redirectURI := cfg(ctx, "wps.redirectUri")
	openBase := strings.TrimSuffix(wpsOptional(ctx, "wps.openApiBase", "https://openapi.wps.cn"), "/")

	tokenURL := openBase + "/oauth2/token"
	form := url.Values{}
	form.Set("grant_type", "authorization_code")
	form.Set("client_id", appID)
	form.Set("client_secret", appSecret)
	form.Set("code", code)
	form.Set("redirect_uri", redirectURI)

	client := g.Client()
	client.SetHeader("Content-Type", "application/x-www-form-urlencoded")
	resp, err := client.Post(ctx, tokenURL, form.Encode())
	if err != nil {
		redirectFrontendError(r, frontendURL, "token request failed")
		return
	}
	defer resp.Close()

	body := resp.ReadAll()
	if len(body) == 0 {
		redirectFrontendError(r, frontendURL, "empty token response")
		return
	}

	tj := gjson.New(body)
	accessToken := tj.Get("access_token").String()
	refreshToken := tj.Get("refresh_token").String()
	expiresIn := tj.Get("expires_in").Int()
	if accessToken == "" {
		msg := tj.Get("error_description").String()
		if msg == "" {
			msg = "token exchange failed"
		}
		redirectFrontendError(r, frontendURL, msg)
		return
	}

	var tokenExpiresAt time.Time
	if expiresIn > 0 {
		tokenExpiresAt = time.Now().Add(time.Duration(expiresIn) * time.Second)
	}

	userURL := openBase + "/v7/users/current"
	uc := g.Client()
	uc.SetHeader("Authorization", "Bearer "+accessToken)
	ures, err := uc.Get(ctx, userURL)
	if err != nil {
		redirectFrontendError(r, frontendURL, "user info request failed")
		return
	}
	defer ures.Close()

	ubody := ures.ReadAll()
	if ures.StatusCode != http.StatusOK {
		redirectFrontendError(r, frontendURL, "user info HTTP error")
		return
	}
	uj := gjson.New(ubody)
	if uj.Get("code").Int() != 0 {
		redirectFrontendError(r, frontendURL, "user info API error")
		return
	}

	wpsID := strings.TrimSpace(uj.Get("data.id").String())
	if wpsID == "" {
		redirectFrontendError(r, frontendURL, "missing WPS user id")
		return
	}

	userName := strings.TrimSpace(uj.Get("data.user_name").String())
	nameField := strings.TrimSpace(uj.Get("data.name").String())
	nickName := strings.TrimSpace(uj.Get("data.nick_name").String())
	avatar := strings.TrimSpace(uj.Get("data.avatar").String())
	phone := strings.TrimSpace(uj.Get("data.phone").String())
	emailFromWps := strings.TrimSpace(uj.Get("data.email").String())

	displayName := userName
	if displayName == "" {
		displayName = nameField
	}
	if displayName == "" {
		displayName = nickName
	}
	if displayName == "" {
		displayName = "WPS User"
	}

	userID, err := findOrCreateLocalUser(ctx, wpsID, displayName, emailFromWps, avatar, phone)
	if err != nil {
		g.Log().Errorf(ctx, "wps findOrCreateLocalUser: %v", err)
		redirectFrontendError(r, frontendURL, "local user error")
		return
	}

	sid, err := randomHex(32)
	if err != nil {
		redirectFrontendError(r, frontendURL, "session error")
		return
	}

	sessionExpires := time.Now().Add(7 * 24 * time.Hour)
	sessionRow := g.Map{
		"sid":               sid,
		"user_id":           userID,
		"wps_user_id":       wpsID,
		"wps_access_token":  accessToken,
		"wps_refresh_token": refreshToken,
		"expires_at":        sessionExpires.UTC().Format(time.RFC3339),
	}
	if !tokenExpiresAt.IsZero() {
		sessionRow["wps_token_expires_at"] = tokenExpiresAt.UTC().Format(time.RFC3339)
	}
	if _, err := g.DB().Model("sso_sessions").Ctx(ctx).Data(sessionRow).Insert(); err != nil {
		g.Log().Errorf(ctx, "wps insert sso_sessions: %v", err)
		redirectFrontendError(r, frontendURL, "session persist error")
		return
	}

	httpCookie := &http.Cookie{
		Name:     cookieName,
		Value:    sid,
		Path:     "/",
		MaxAge:   7 * 86400,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}
	r.Cookie.SetHttpCookie(httpCookie)

	final := frontendURL + "/#" + st.Redirect
	r.Response.RedirectTo(final, http.StatusFound)
}

var emailLocalSanitizer = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

func syntheticEmail(wpsID string) string {
	local := emailLocalSanitizer.ReplaceAllString(wpsID, "")
	if local == "" {
		h := sha256.Sum256([]byte(wpsID))
		local = hex.EncodeToString(h[:12])
	}
	if len(local) > 64 {
		local = local[:64]
	}
	return local + "@sso.wps365.local"
}

func localUserIDFromWps(wpsID string) string {
	h := sha256.Sum256([]byte(wpsID))
	return fmt.Sprintf("u_wps_%x", h[:8])
}

func findOrCreateLocalUser(ctx context.Context, wpsID, displayName, email, avatar, phone string) (string, error) {
	row, err := g.DB().Model("users").Ctx(ctx).Where("wps_user_id", wpsID).One()
	if err != nil {
		return "", err
	}

	emailToUse := email
	if emailToUse == "" {
		emailToUse = syntheticEmail(wpsID)
	}

	if !row.IsEmpty() {
		id := row["id"].String()
		updates := g.Map{}
		if row["name"].String() != displayName {
			updates["name"] = displayName
		}
		if avatar != "" && row["avatar"].String() != avatar {
			updates["avatar"] = avatar
		}
		if phone != "" && row["phone"].String() != phone {
			updates["phone"] = phone
		}
		if email != "" && row["email"].String() != email {
			updates["email"] = email
		}
		if len(updates) > 0 {
			if _, err := g.DB().Model("users").Ctx(ctx).Where("id", id).Data(updates).Update(); err != nil {
				return "", err
			}
		}
		return id, nil
	}

	count, err := g.DB().Model("users").Ctx(ctx).Where("email", emailToUse).Count()
	if err != nil {
		return "", err
	}
	if count > 0 && email == "" {
		emailToUse = syntheticEmail(wpsID + "_" + grand.S(8))
	}

	uid := localUserIDFromWps(wpsID)
	newUser := g.Map{
		"id":            uid,
		"account_id":    grand.S(24),
		"name":          displayName,
		"email":         emailToUse,
		"phone":         phone,
		"password_hash": "",
		"role":          `["Sales"]`,
		"user_type":     "Internal",
		"status":        "Active",
		"wps_user_id":   wpsID,
	}
	if avatar != "" {
		newUser["avatar"] = avatar
	}

	if _, err := g.DB().Model("users").Ctx(ctx).Data(newUser).Insert(); err != nil {
		return "", err
	}
	return uid, nil
}

func (c *Controller) Logout(r *ghttp.Request) {
	ctx := r.Context()
	cookieName := wpsOptional(ctx, "wps.cookieName", "itab-sid")
	sid := r.Cookie.Get(cookieName).String()
	if sid != "" {
		if _, err := g.DB().Model("sso_sessions").Ctx(ctx).Where("sid", sid).Delete(); err != nil {
			g.Log().Warningf(ctx, "wps logout delete session: %v", err)
		}
	}
	clear := &http.Cookie{
		Name:     cookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}
	r.Cookie.SetHttpCookie(clear)
	r.Response.WriteJsonExit(g.Map{"code": 0, "msg": "已退出"})
}
