// Package auth 应用层：装配 oauth + 各 Store + HTTP handlers。
//
// 用法：
//
//	client := wps365auth.New(cfg)
//	stores := auth.Stores{ ... }
//	svc := auth.New(client, stores, auth.Config{ FrontendURL, RedirectURI })
//	svc.RegisterRoutes(mux)
package auth

import (
	"errors"
	"net/http"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"

	"wps365auth"
	"wps365auth/store"
)

type Stores struct {
	PreAuth  store.PreAuthStore
	Session  store.SessionStore
	Token    store.TokenStore
	UserRepo store.UserRepo
}

type Config struct {
	// FrontendURL 前端基础 URL（同域可填空字符串，仅写路径）。
	FrontendURL string
	// RedirectURI 必须与 WPS 开发者后台一致；为空则用 client.Config.RedirectURI。
	RedirectURI string
}

type Service struct {
	client *wps365auth.Client
	cfg    Config
	stores Stores

	refreshGroup singleflight.Group

	userCacheMu sync.RWMutex
	userCache   map[string]*userCacheEntry
}

type userCacheEntry struct {
	profile  *store.UserProfile
	cachedAt time.Time
}

func New(client *wps365auth.Client, stores Stores, cfg Config) (*Service, error) {
	if client == nil {
		return nil, errors.New("auth: client required")
	}
	if stores.PreAuth == nil || stores.Session == nil || stores.Token == nil || stores.UserRepo == nil {
		return nil, errors.New("auth: all stores required")
	}
	if cfg.RedirectURI == "" {
		cfg.RedirectURI = client.Config.RedirectURI
	}
	if cfg.RedirectURI == "" {
		return nil, errors.New("auth: RedirectURI required")
	}
	return &Service{
		client:    client,
		cfg:       cfg,
		stores:    stores,
		userCache: make(map[string]*userCacheEntry),
	}, nil
}

// RegisterRoutes 注册 /api/auth/* 路由到给定 mux（Go 1.22+ 路由模式）。
func (s *Service) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/auth/login", s.handleLogin)
	mux.HandleFunc("GET /api/auth/callback", s.handleCallback)
	mux.HandleFunc("GET /api/auth/me", s.requireAuth(s.handleMe))
	mux.HandleFunc("GET /api/auth/status", s.handleStatus)
	mux.HandleFunc("POST /api/auth/logout", s.handleLogout)
}
