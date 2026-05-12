package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"wps365auth"
)

// UserToken 用户访问凭证。
type UserToken struct {
	AccessToken      string
	AccessExpiresAt  time.Time
	RefreshToken     string
	RefreshExpiresAt time.Time
	Scope            string
	TokenType        string
}

// AppToken 应用访问凭证（自建租户级）。本次仅模型保留，未启用。
type AppToken struct {
	AccessToken     string
	AccessExpiresAt time.Time
}

// NearExpiry 判断 access_token 是否临到期。
func (t *UserToken) NearExpiry(margin time.Duration) bool {
	if t == nil || t.AccessExpiresAt.IsZero() {
		return true
	}
	return time.Until(t.AccessExpiresAt) < margin
}

type tokenResponse struct {
	AccessToken       string `json:"access_token"`
	RefreshToken      string `json:"refresh_token"`
	ExpiresIn         int64  `json:"expires_in"`
	RefreshExpiresIn  any    `json:"refresh_expires_in"` // WPS 文档标 string，实测可能 int
	TokenType         string `json:"token_type"`
	Scope             string `json:"scope"`
	Error_            string `json:"error,omitempty"`
	ErrorDescription_ string `json:"error_description,omitempty"`
}

func parseRefreshExpires(v any) int64 {
	switch x := v.(type) {
	case float64:
		return int64(x)
	case string:
		if x == "" {
			return 0
		}
		var n int64
		fmt.Sscanf(x, "%d", &n)
		return n
	}
	return 0
}

// ExchangeCode 用授权码换取 user token。
func ExchangeCode(ctx context.Context, c *wps365auth.Client, code, redirectURI string) (*UserToken, error) {
	form := url.Values{
		"grant_type":    {"authorization_code"},
		"client_id":     {c.Config.AppID},
		"client_secret": {c.Config.AppSecret},
		"code":          {code},
		"redirect_uri":  {redirectURI},
	}
	return doTokenRequest(ctx, c, form)
}

// RefreshUserToken 用 refresh_token 刷新。
// 返回的 RefreshExpiresAt 由响应中的剩余秒数现算。
func RefreshUserToken(ctx context.Context, c *wps365auth.Client, refreshToken string) (*UserToken, error) {
	form := url.Values{
		"grant_type":    {"refresh_token"},
		"client_id":     {c.Config.AppID},
		"client_secret": {c.Config.AppSecret},
		"refresh_token": {refreshToken},
	}
	return doTokenRequest(ctx, c, form)
}

// ClientCredentialsToken 自建应用获取租户 access_token。本次未在 handler 中使用，预留。
func ClientCredentialsToken(ctx context.Context, c *wps365auth.Client) (*AppToken, error) {
	form := url.Values{
		"grant_type":    {"client_credentials"},
		"client_id":     {c.Config.AppID},
		"client_secret": {c.Config.AppSecret},
	}
	t, err := doTokenRequest(ctx, c, form)
	if err != nil {
		return nil, err
	}
	return &AppToken{
		AccessToken:     t.AccessToken,
		AccessExpiresAt: t.AccessExpiresAt,
	}, nil
}

func doTokenRequest(ctx context.Context, c *wps365auth.Client, form url.Values) (*UserToken, error) {
	reqURL := fmt.Sprintf("%s/oauth2/token", c.Config.BaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, fmt.Errorf("oauth: create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("oauth: http request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("oauth: read response: %w", err)
	}

	var tr tokenResponse
	_ = json.Unmarshal(body, &tr)

	if resp.StatusCode != http.StatusOK || tr.Error_ != "" || tr.AccessToken == "" {
		apiErr := &wps365auth.APIError{
			HTTPStatus:       resp.StatusCode,
			Error_:           tr.Error_,
			ErrorDescription: tr.ErrorDescription_,
		}
		// 兼容 {code, msg} 风格
		var legacy struct {
			Code int    `json:"code"`
			Msg  string `json:"msg"`
		}
		if json.Unmarshal(body, &legacy) == nil {
			apiErr.Code = legacy.Code
			apiErr.Msg = legacy.Msg
		}
		return nil, apiErr
	}

	now := time.Now()
	tok := &UserToken{
		AccessToken:     tr.AccessToken,
		AccessExpiresAt: now.Add(time.Duration(tr.ExpiresIn) * time.Second),
		RefreshToken:    tr.RefreshToken,
		Scope:           tr.Scope,
		TokenType:       tr.TokenType,
	}
	if rs := parseRefreshExpires(tr.RefreshExpiresIn); rs > 0 {
		tok.RefreshExpiresAt = now.Add(time.Duration(rs) * time.Second)
	}
	return tok, nil
}
