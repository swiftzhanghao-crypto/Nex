package auth

import (
	"context"
	"errors"
	"log"

	"wps365auth"
	"wps365auth/oauth"
	"wps365auth/store"
)

// refreshIfNeeded 用 singleflight 合并并发刷新；按错误分类决定是否清凭证。
//   - invalid_grant / 4xx：清 token + session（上层映射 401）
//   - 网络/5xx：保留旧 token，返回错误让上层用旧 token 试一次
func (s *Service) refreshIfNeeded(ctx context.Context, wpsUserID string) error {
	tok, err := s.stores.Token.GetUser(ctx, wpsUserID)
	if err != nil {
		return err
	}
	if !tok.NearExpiry(s.client.Config.RefreshMargin) {
		return nil
	}
	if tok.RefreshToken == "" {
		return store.ErrNotFound
	}

	_, err, _ = s.refreshGroup.Do(wpsUserID, func() (any, error) {
		// double-check 在锁内重新读取，避免重复刷新
		cur, gerr := s.stores.Token.GetUser(ctx, wpsUserID)
		if gerr != nil {
			return nil, gerr
		}
		if !cur.NearExpiry(s.client.Config.RefreshMargin) {
			return nil, nil
		}

		newTok, rerr := oauth.RefreshUserToken(ctx, s.client, cur.RefreshToken)
		if rerr != nil {
			var apiErr *wps365auth.APIError
			if errors.As(rerr, &apiErr) {
				if cls := apiErr.Classify(); cls != nil {
					if errors.Is(cls, wps365auth.ErrTransient) {
						log.Printf("[auth] 刷新临时失败 user=%s: %v", wpsUserID, rerr)
						return nil, cls
					}
					log.Printf("[auth] 刷新凭证失效 user=%s: %v", wpsUserID, rerr)
					_ = s.stores.Token.DeleteUser(ctx, wpsUserID)
					_ = s.stores.Session.DeleteByUser(ctx, wpsUserID)
					return nil, cls
				}
			}
			log.Printf("[auth] 刷新失败（未知错误）user=%s: %v", wpsUserID, rerr)
			return nil, rerr
		}

		// 继承未返回的字段
		if newTok.RefreshExpiresAt.IsZero() && !cur.RefreshExpiresAt.IsZero() {
			newTok.RefreshExpiresAt = cur.RefreshExpiresAt
		}
		if newTok.Scope == "" {
			newTok.Scope = cur.Scope
		}
		if err := s.stores.Token.SaveUser(ctx, wpsUserID, newTok); err != nil {
			return nil, err
		}
		log.Printf("[auth] 已刷新 token user=%s, 新过期=%s", wpsUserID, newTok.AccessExpiresAt.Format("15:04:05"))
		return nil, nil
	})
	return err
}

func isInvalidGrant(err error) bool {
	return errors.Is(err, wps365auth.ErrInvalidGrant) || errors.Is(err, wps365auth.ErrInvalidToken)
}
