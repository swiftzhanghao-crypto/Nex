package auth

import (
	"context"
	"errors"
	"net/http"
	"time"

	"wps365auth/store"
)

type ctxKey int

const ctxAuthKey ctxKey = 1

type AuthContext struct {
	Session *store.Session
	Profile *store.UserProfile
}

// Auth 从 request context 读取已认证身份。
func Auth(ctx context.Context) *AuthContext {
	v, _ := ctx.Value(ctxAuthKey).(*AuthContext)
	return v
}

func (s *Service) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sid := readCookie(r, s.sessionCookieName())
		if sid == "" {
			writeJSON(w, http.StatusUnauthorized, jsonResp{Code: 401, Msg: "未登录"})
			return
		}

		sess, err := s.stores.Session.Get(r.Context(), sid)
		if err != nil {
			s.clearSessionCookie(w)
			writeJSON(w, http.StatusUnauthorized, jsonResp{Code: 401, Msg: "会话已过期"})
			return
		}

		if err := s.refreshIfNeeded(r.Context(), sess.WPSUserID); err != nil {
			if errors.Is(err, store.ErrNotFound) || isInvalidGrant(err) {
				_ = s.stores.Session.Delete(r.Context(), sid)
				_ = s.stores.Token.DeleteUser(r.Context(), sess.WPSUserID)
				s.clearSessionCookie(w)
				writeJSON(w, http.StatusUnauthorized, jsonResp{Code: 401, Msg: "凭证已失效，请重新登录"})
				return
			}
			// 临时错误：放行，让本次请求用旧 token 试试
		}

		_ = s.stores.Session.Touch(r.Context(), sid, time.Now())

		profile, _ := s.stores.UserRepo.GetByWPSID(r.Context(), sess.WPSUserID)

		ctx := context.WithValue(r.Context(), ctxAuthKey, &AuthContext{
			Session: sess,
			Profile: profile,
		})
		next(w, r.WithContext(ctx))
	}
}
