package crmexample

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

const (
	defaultXOQLPageSize = 3000
	maxXOQLPageSize     = 3000
	cacheTTL            = 23 * time.Hour
)

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int64  `json:"expires_in"`
	Error       string `json:"error"`
	ErrorDesc   string `json:"error_description"`
}

type XOQLQueryResponse struct {
	Code string    `json:"code"`
	Msg  string    `json:"msg"`
	Data *XOQLData `json:"data"`
}

type XOQLData struct {
	TotalSize int                      `json:"totalSize"`
	Count     int                      `json:"count"`
	Records   []map[string]interface{} `json:"records"`
}

type xoqlWire struct {
	Code interface{} `json:"code"`
	Msg  string      `json:"msg"`
	Data *XOQLData   `json:"data"`
}

type cfg struct {
	OAuthBaseURL string
	TokenPath    string
	ApiBaseURL   string
	ClientID     string
	ClientSecret string
	Username     string
	Password     string
}

type tokenCache struct {
	token     *TokenResponse
	expiresAt time.Time
}

type XSYService struct {
	cfg          cfg
	tokenFetchMu sync.Mutex
	tokenCache   atomic.Pointer[tokenCache]
}

func NewXSYService(c cfg) *XSYService {
	return &XSYService{cfg: c}
}

func (s *XSYService) GetAccessToken(ctx context.Context) (*TokenResponse, error) {
	if tk := s.getCachedToken(); tk != nil {
		return tk, nil
	}
	s.tokenFetchMu.Lock()
	defer s.tokenFetchMu.Unlock()

	if tk := s.getCachedToken(); tk != nil {
		return tk, nil
	}
	tk, err := s.fetchAccessToken(ctx)
	if err != nil {
		return nil, err
	}
	s.tokenCache.Store(&tokenCache{
		token:     tk,
		expiresAt: time.Now().Add(cacheTTL),
	})
	return tk, nil
}

func (s *XSYService) QueryXOQL(ctx context.Context, xoql string, includeAdminCriteria bool) (*XOQLQueryResponse, error) {
	if strings.TrimSpace(xoql) == "" {
		return nil, gerror.New("xoql 不能为空")
	}
	tk, err := s.GetAccessToken(ctx)
	if err != nil {
		return nil, err
	}

	u := strings.TrimRight(s.cfg.ApiBaseURL, "/") + "/rest/data/v2.0/query/xoql"
	form := url.Values{}
	form.Set("xoql", xoql)

	client := g.Client().
		SetHeader("Content-Type", "application/x-www-form-urlencoded").
		SetHeader("Authorization", normalizeAuthorizationHeader(tk.AccessToken))
	if includeAdminCriteria {
		client = client.SetHeader("xsy-criteria", "10")
	}
	resp, err := client.Post(ctx, u, form.Encode())
	if err != nil {
		return nil, gerror.Wrap(err, "调用 XOQL 失败")
	}
	defer resp.Close()

	var wire xoqlWire
	if err = json.Unmarshal(resp.ReadAll(), &wire); err != nil {
		return nil, gerror.Wrap(err, "解析 XOQL 响应失败")
	}
	out := &XOQLQueryResponse{
		Code: normalizeCode(wire.Code),
		Msg:  wire.Msg,
		Data: wire.Data,
	}
	if out.Code != "200" {
		return nil, gerror.Newf("xoql 返回失败, code=%s, msg=%s", out.Code, out.Msg)
	}
	return out, nil
}

func (s *XSYService) QueryXOQLPaged(ctx context.Context, baseXOQL string, pageSize int, includeAdminCriteria bool) (*XOQLQueryResponse, error) {
	baseXOQL = strings.TrimSpace(baseXOQL)
	if baseXOQL == "" {
		return nil, gerror.New("baseXOQL 不能为空")
	}
	pageSize = normalizePageSize(pageSize)
	var (
		offset  = 0
		merged  []map[string]interface{}
		firstOK *XOQLQueryResponse
	)
	for {
		sql := fmt.Sprintf("%s limit %d,%d", baseXOQL, offset, pageSize)
		page, err := s.QueryXOQL(ctx, sql, includeAdminCriteria)
		if err != nil {
			return nil, err
		}
		if firstOK == nil {
			firstOK = page
			if firstOK.Data == nil {
				firstOK.Data = &XOQLData{}
			}
		}
		var batch []map[string]interface{}
		if page.Data != nil {
			batch = page.Data.Records
		}
		merged = append(merged, batch...)
		if len(batch) < pageSize {
			break
		}
		offset += pageSize
	}
	firstOK.Data.Records = merged
	firstOK.Data.Count = len(merged)
	return firstOK, nil
}

func (s *XSYService) fetchAccessToken(ctx context.Context) (*TokenResponse, error) {
	if strings.TrimSpace(s.cfg.OAuthBaseURL) == "" || strings.TrimSpace(s.cfg.TokenPath) == "" {
		return nil, gerror.New("oauthBaseUrl/tokenPath 不能为空")
	}
	u := strings.TrimRight(s.cfg.OAuthBaseURL, "/") + s.cfg.TokenPath
	form := url.Values{}
	form.Set("grant_type", "password")
	form.Set("client_id", s.cfg.ClientID)
	form.Set("client_secret", s.cfg.ClientSecret)
	form.Set("username", s.cfg.Username)
	form.Set("password", s.cfg.Password)
	resp, err := g.Client().
		SetHeader("Content-Type", "application/x-www-form-urlencoded").
		Post(ctx, u, form.Encode())
	if err != nil {
		return nil, gerror.Wrap(err, "调用 token 接口失败")
	}
	defer resp.Close()

	var tk TokenResponse
	if err = json.Unmarshal(resp.ReadAll(), &tk); err != nil {
		return nil, gerror.Wrap(err, "解析 token 响应失败")
	}
	if tk.Error != "" {
		return nil, gerror.Newf("oauth 错误: %s - %s", tk.Error, tk.ErrorDesc)
	}
	if strings.TrimSpace(tk.AccessToken) == "" {
		return nil, gerror.New("token 响应缺少 access_token")
	}
	return &tk, nil
}

func (s *XSYService) getCachedToken() *TokenResponse {
	cache := s.tokenCache.Load()
	if cache == nil || cache.token == nil {
		return nil
	}
	if time.Now().After(cache.expiresAt) {
		return nil
	}
	if strings.TrimSpace(cache.token.AccessToken) == "" {
		return nil
	}
	return cache.token
}

func normalizeAuthorizationHeader(accessToken string) string {
	tk := strings.TrimSpace(accessToken)
	if strings.HasPrefix(strings.ToLower(tk), "bearer ") {
		return tk
	}
	return "Bearer " + tk
}

func normalizePageSize(pageSize int) int {
	if pageSize <= 0 {
		return defaultXOQLPageSize
	}
	if pageSize > maxXOQLPageSize {
		return maxXOQLPageSize
	}
	return pageSize
}

func normalizeCode(v interface{}) string {
	switch t := v.(type) {
	case string:
		return strings.TrimSpace(t)
	case float64:
		return strconv.FormatInt(int64(t), 10)
	case int:
		return strconv.Itoa(t)
	default:
		return strings.TrimSpace(fmt.Sprint(v))
	}
}
