package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"wps365auth"
	"wps365auth/auth"
	"wps365auth/store/memory"
	"wps365auth/store/sqlite"
)

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("[API] 必填环境变量 %s 未设置", key)
	}
	return v
}

func main() {
	cfg := wps365auth.Config{
		AppID:          mustEnv("WPS_APP_ID"),
		AppSecret:      mustEnv("WPS_APP_SECRET"),
		BaseURL:        envOr("WPS_BASE_URL", "https://openapi.wps.cn"),
		RedirectURI:    envOr("WPS_REDIRECT_URI", "http://localhost:8080/api/auth/callback"),
		EnableSign:     envOr("WPS_ENABLE_SIGN", "false") == "true",
		Scopes:         splitCSV(envOr("WPS_SCOPES", "kso.user_base.read")),
		CookieName:     envOr("COOKIE_NAME", "itab-sid"),
		CookieSameSite: envOr("COOKIE_SAMESITE", "Lax"),
		CookieSecure:   envOr("COOKIE_SECURE", "false") == "true",
		FrontendURL:    envOr("FRONTEND_URL", "http://localhost:8081"),
	}
	if err := cfg.Validate(); err != nil {
		log.Fatalf("[API] 配置错误: %v", err)
	}

	client := wps365auth.New(cfg)

	dbPath := envOr("SESSION_DB", "data/app.db")
	sqlStore, err := sqlite.New(dbPath, 24*time.Hour)
	if err != nil {
		log.Fatalf("[API] SQLite 初始化失败: %v", err)
	}
	defer sqlStore.Close()

	stores := auth.Stores{
		PreAuth:  memory.NewPreAuthStore(),
		Session:  sqlStore,
		Token:    sqlStore,
		UserRepo: sqlStore,
	}

	svc, err := auth.New(client, stores, auth.Config{
		FrontendURL: cfg.FrontendURL,
		RedirectURI: cfg.RedirectURI,
	})
	if err != nil {
		log.Fatalf("[API] auth 初始化失败: %v", err)
	}

	mux := http.NewServeMux()
	svc.RegisterRoutes(mux)

	addr := envOr("SERVER_ADDR", ":8080")
	allowOrigin := os.Getenv("CORS_ORIGIN") // 同域部署可留空

	var handler http.Handler = loggingMiddleware(mux)
	if allowOrigin != "" {
		handler = corsMiddleware(allowOrigin, handler)
	}

	log.Printf("[API] AppID=%s, EnableSign=%v, Addr=%s", cfg.AppID, cfg.EnableSign, addr)
	log.Printf("[API] FrontendURL=%s, RedirectURI=%s", cfg.FrontendURL, cfg.RedirectURI)
	log.Printf("[API] 服务启动: http://localhost%s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("[API] 启动失败: %v", err)
	}
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[HTTP] %s %s %s", r.Method, r.URL.Path, r.RemoteAddr)
		next.ServeHTTP(w, r)
	})
}

func corsMiddleware(allowOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if origin := r.Header.Get("Origin"); origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", allowOrigin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
