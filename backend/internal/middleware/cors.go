package middleware

import (
	"strings"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

func CORS(r *ghttp.Request) {
	origins := g.Cfg().MustGet(r.Context(), "cors.origins", "http://localhost:5173").String()
	allowedOrigins := strings.Split(origins, ",")
	for i := range allowedOrigins {
		allowedOrigins[i] = strings.TrimSpace(allowedOrigins[i])
	}

	origin := r.GetHeader("Origin")
	allowed := false
	for _, o := range allowedOrigins {
		if o == origin || o == "*" {
			allowed = true
			break
		}
	}

	if allowed {
		r.Response.CORSDefault()
	}
	r.Middleware.Next()
}
