package wps365auth

import (
	"errors"
	"fmt"
)

// 哨兵错误，便于上层按类型区分处理（清 token vs 重试）。
var (
	// ErrInvalidGrant 表示 refresh_token 已失效（被撤销/超期/账号删除等），需用户重新授权。
	ErrInvalidGrant = errors.New("wps365auth: invalid_grant")
	// ErrInvalidToken 表示 access_token 失效（不应在自动刷新场景出现）。
	ErrInvalidToken = errors.New("wps365auth: invalid_token")
	// ErrTransient 表示网络抖动或 5xx，调用方可保留原 token，等下次再试。
	ErrTransient = errors.New("wps365auth: transient error")
)

type APIError struct {
	HTTPStatus int
	Code       int    `json:"code"`
	Msg        string `json:"msg"`
	// OAuth2 错误响应字段（/oauth2/token 不一定走 code/msg）
	Error_           string `json:"error,omitempty"`
	ErrorDescription string `json:"error_description,omitempty"`
}

func (e *APIError) Error() string {
	if e.Error_ != "" {
		return fmt.Sprintf("wps365auth: HTTP %d, error=%s, desc=%s", e.HTTPStatus, e.Error_, e.ErrorDescription)
	}
	return fmt.Sprintf("wps365auth: HTTP %d, code=%d, msg=%s", e.HTTPStatus, e.Code, e.Msg)
}

// Classify 根据 APIError 推断哨兵错误类型。
func (e *APIError) Classify() error {
	switch e.Error_ {
	case "invalid_grant":
		return ErrInvalidGrant
	case "invalid_token":
		return ErrInvalidToken
	}
	if e.HTTPStatus >= 500 {
		return ErrTransient
	}
	if e.HTTPStatus == 401 || e.HTTPStatus == 403 {
		return ErrInvalidToken
	}
	return nil
}
