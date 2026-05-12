package wps365auth

import (
	"errors"
	"fmt"
	"time"
)

type Config struct {
	AppID     string
	AppSecret string

	BaseURL     string // 默认 https://openapi.wps.cn，业务 API + OAuth 共用
	RedirectURI string // 必填，须与 WPS 开发者后台一致

	EnableSign bool     // 是否启用 KSO-1 签名（与开发者后台-安全设置-接口签名保持一致）
	Scopes     []string // 默认 ["kso.user_base.read"]

	SessionTTL    time.Duration // 默认 24h
	PreAuthTTL    time.Duration // 默认 10min
	UserCacheTTL  time.Duration // 默认 60s
	RefreshMargin time.Duration // 默认 5min；access_token 临到期阈值

	CookieName     string // 登录态 session cookie 名称，默认 "itab-sid"
	CookieSameSite string // "Lax"/"None"/"Strict"，默认 Lax
	CookieSecure   bool   // 生产 true
	CookieDomain   string // 可选

	FrontendURL string // 登录回跳前端基础 URL；同域可为 ""，仅写路径
}

func (c *Config) defaults() {
	if c.BaseURL == "" {
		c.BaseURL = "https://openapi.wps.cn"
	}
	if len(c.Scopes) == 0 {
		c.Scopes = []string{"kso.user_base.read"}
	}
	if c.SessionTTL == 0 {
		c.SessionTTL = 24 * time.Hour
	}
	if c.PreAuthTTL == 0 {
		c.PreAuthTTL = 10 * time.Minute
	}
	if c.UserCacheTTL == 0 {
		c.UserCacheTTL = 60 * time.Second
	}
	if c.RefreshMargin == 0 {
		c.RefreshMargin = 5 * time.Minute
	}
	if c.CookieSameSite == "" {
		c.CookieSameSite = "Lax"
	}
	if c.CookieName == "" {
		c.CookieName = "itab-sid"
	}
}

func (c *Config) Validate() error {
	if c.AppID == "" || c.AppSecret == "" {
		return errors.New("wps365auth: AppID/AppSecret required")
	}
	return nil
}

func (c *Config) url(path string) string {
	return fmt.Sprintf("%s%s", c.BaseURL, path)
}
