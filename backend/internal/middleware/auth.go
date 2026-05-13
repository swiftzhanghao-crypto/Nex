package middleware

import (
	"net/http"
	"strings"

	authsvc "nex-backend/internal/service/auth"

	"github.com/gogf/gf/v2/net/ghttp"
)

const (
	CtxKeyUserID         = "userId"
	CtxKeyRole           = "userRole"
	CtxKeyImpersonatedBy = "impersonatedBy"
)

func Auth(r *ghttp.Request) {
	header := r.GetHeader("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		r.Response.Status = http.StatusUnauthorized
		r.Response.WriteJsonExit(map[string]string{"error": "未提供认证令牌"})
		return
	}
	claims, err := authsvc.VerifyToken(r.Context(), header[7:])
	if err != nil {
		r.Response.Status = http.StatusUnauthorized
		r.Response.WriteJsonExit(map[string]string{"error": "令牌无效或已过期"})
		return
	}
	r.SetCtxVar(CtxKeyUserID, claims.UserID)
	r.SetCtxVar(CtxKeyRole, claims.Role)
	r.SetCtxVar(CtxKeyImpersonatedBy, claims.ImpersonatedBy)
	r.Middleware.Next()
}

func GetUserID(r *ghttp.Request) string {
	return r.GetCtxVar(CtxKeyUserID).String()
}

func GetUserRole(r *ghttp.Request) string {
	return r.GetCtxVar(CtxKeyRole).String()
}

func GetImpersonatedBy(r *ghttp.Request) string {
	return r.GetCtxVar(CtxKeyImpersonatedBy).String()
}
