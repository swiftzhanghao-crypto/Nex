package crm

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"nex-backend/internal/middleware"
	authsvc "nex-backend/internal/service/auth"

	"github.com/gogf/gf/v2/encoding/gjson"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

// crmStateStore holds OAuth state for /login → provider → /callback (10 min TTL).
var crmStateStore sync.Map

type crmOAuthState struct {
	Redirect  string
	UserID    string
	ExpiresAt time.Time
}

type Controller struct{}

func New() *Controller { return &Controller{} }

func xsyClientCfg(ctx context.Context) (clientID, clientSecret, redirectURI, scope, oauthBase, apiBase string) {
	clientID = strings.TrimSpace(g.Cfg().MustGet(ctx, "crm.xiaoshouyi.clientId").String())
	clientSecret = strings.TrimSpace(g.Cfg().MustGet(ctx, "crm.xiaoshouyi.clientSecret").String())
	redirectURI = strings.TrimSpace(g.Cfg().MustGet(ctx, "crm.xiaoshouyi.redirectUri").String())
	scope = strings.TrimSpace(g.Cfg().MustGet(ctx, "crm.xiaoshouyi.scope", "all").String())
	oauthBase = strings.TrimSpace(g.Cfg().MustGet(ctx, "crm.xiaoshouyi.oauthBase", "https://login-sandbox.xiaoshouyi.com").String())
	apiBase = strings.TrimSpace(g.Cfg().MustGet(ctx, "crm.xiaoshouyi.apiBase", "https://api-sandbox.xiaoshouyi.com").String())
	return
}

func xsyEnabled(ctx context.Context) bool {
	cid, sec, ruri, _, _, _ := xsyClientCfg(ctx)
	return cid != "" && sec != "" && ruri != ""
}

func frontendBaseURL(ctx context.Context) string {
	return strings.TrimSpace(g.Cfg().MustGet(ctx, "wps.frontendUrl", "http://localhost:5173").String())
}

func failRedirect(ctx context.Context, errMsg string) string {
	base := strings.TrimRight(frontendBaseURL(ctx), "/")
	return base + "/#/crm-callback?" + url.Values{
		"status": {"fail"},
		"error":  {errMsg},
	}.Encode()
}

func okRedirect(ctx context.Context, redirect string) string {
	base := strings.TrimRight(frontendBaseURL(ctx), "/")
	return base + "/#/crm-callback?" + url.Values{
		"status":   {"ok"},
		"redirect": {redirect},
	}.Encode()
}

func randomState() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func escapeXSYLike(s string) string {
	return strings.ReplaceAll(s, "'", "''")
}

func buildXOQL(search string, limit int) string {
	q := "select id, accountName, phone, industry, address, ownerId, ownerId.name, createdDate from account"
	if strings.TrimSpace(search) != "" {
		q += fmt.Sprintf(" where accountName like '%%%s%%'", escapeXSYLike(search))
	}
	q += fmt.Sprintf(" limit %d", limit)
	return q
}

func parseOwnerName(rec *gjson.Json) string {
	if rec == nil {
		return ""
	}
	if v := rec.Get("ownerId.name"); !v.IsNil() && v.String() != "" {
		return v.String()
	}
	oid := rec.GetJson("ownerId")
	if oid != nil && !oid.IsNil() {
		return oid.Get("name").String()
	}
	return ""
}

func getValidXsyToken(ctx context.Context, userID string) (accessToken string, err error) {
	now := time.Now().Format("2006-01-02 15:04:05")
	row, err := g.DB().Model("crm_xsy_tokens").Ctx(ctx).
		Where("user_id", userID).
		Where("expires_at > ?", now).
		One()
	if err != nil {
		return "", err
	}
	if row.IsEmpty() {
		return "", fmt.Errorf("no token")
	}
	return row["access_token"].String(), nil
}

// Status GET /api/crm/xsy/status
func (c *Controller) Status(r *ghttp.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(r)
	now := time.Now().Format("2006-01-02 15:04:05")
	cnt, err := g.DB().Model("crm_xsy_tokens").Ctx(ctx).
		Where("user_id", userID).
		Where("expires_at > ?", now).
		Count()
	if err != nil {
		r.Response.Status = http.StatusInternalServerError
		r.Response.WriteJsonExit(g.Map{"error": err.Error()})
		return
	}
	r.Response.WriteJsonExit(g.Map{
		"enabled": xsyEnabled(ctx),
		"bound":   cnt > 0,
	})
}

// Login GET /api/crm/xsy/login
func (c *Controller) Login(r *ghttp.Request) {
	ctx := r.Context()
	tokenStr := strings.TrimSpace(r.GetQuery("token").String())
	if tokenStr == "" {
		h := r.GetHeader("Authorization")
		if strings.HasPrefix(h, "Bearer ") {
			tokenStr = strings.TrimSpace(h[7:])
		}
	}
	claims, err := authsvc.VerifyToken(ctx, tokenStr)
	if err != nil || claims == nil {
		r.Response.Status = http.StatusUnauthorized
		r.Response.WriteJsonExit(g.Map{"error": "未授权"})
		return
	}
	if !xsyEnabled(ctx) {
		r.Response.Status = http.StatusServiceUnavailable
		r.Response.WriteJsonExit(g.Map{"error": "CRM 未配置"})
		return
	}

	clientID, _, redirectURI, scope, oauthBase, _ := xsyClientCfg(ctx)
	redir := r.GetQuery("redirect", "/customers").String()
	if redir == "" {
		redir = "/customers"
	}

	state := randomState()
	crmStateStore.Store(state, crmOAuthState{
		Redirect:  redir,
		UserID:    claims.UserID,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	})

	authURL, _ := url.Parse(strings.TrimRight(oauthBase, "/") + "/auc/oauth2/auth")
	q := authURL.Query()
	q.Set("client_id", clientID)
	q.Set("response_type", "code")
	q.Set("redirect_uri", redirectURI)
	q.Set("oauthType", "standard")
	q.Set("scope", scope)
	q.Set("state", state)
	authURL.RawQuery = q.Encode()

	r.Response.RedirectTo(authURL.String(), http.StatusFound)
}

// Callback GET /api/crm/xsy/callback
func (c *Controller) Callback(r *ghttp.Request) {
	ctx := r.Context()
	if ferr := r.GetQuery("error").String(); ferr != "" {
		r.Response.RedirectTo(failRedirect(ctx, ferr), http.StatusFound)
		return
	}
	code := r.GetQuery("code").String()
	stateKey := r.GetQuery("state").String()
	if code == "" || stateKey == "" {
		r.Response.RedirectTo(failRedirect(ctx, "missing code or state"), http.StatusFound)
		return
	}

	raw, ok := crmStateStore.LoadAndDelete(stateKey)
	if !ok {
		r.Response.RedirectTo(failRedirect(ctx, "invalid state"), http.StatusFound)
		return
	}
	st, _ := raw.(crmOAuthState)
	if time.Now().After(st.ExpiresAt) {
		r.Response.RedirectTo(failRedirect(ctx, "state expired"), http.StatusFound)
		return
	}

	if !xsyEnabled(ctx) {
		r.Response.RedirectTo(failRedirect(ctx, "CRM 未配置"), http.StatusFound)
		return
	}

	clientID, clientSecret, redirectURI, _, oauthBase, _ := xsyClientCfg(ctx)
	tokenBase, _ := url.Parse(strings.TrimRight(oauthBase, "/") + "/auc/oauth2/token")
	tq := tokenBase.Query()
	tq.Set("grant_type", "authorization_code")
	tq.Set("client_id", clientID)
	tq.Set("client_secret", clientSecret)
	tq.Set("redirect_uri", redirectURI)
	tq.Set("code", code)
	tokenBase.RawQuery = tq.Encode()

	tc := g.Client()
	tc.SetHeader("Content-Type", "application/x-www-form-urlencoded")
	res, err := tc.Post(ctx, tokenBase.String(), "")
	if err != nil {
		r.Response.RedirectTo(failRedirect(ctx, err.Error()), http.StatusFound)
		return
	}
	defer res.Close()

	body := string(res.ReadAll())
	if res.StatusCode != http.StatusOK {
		r.Response.RedirectTo(failRedirect(ctx, fmt.Sprintf("token http %d: %s", res.StatusCode, body)), http.StatusFound)
		return
	}

	parsed := gjson.New(body)
	if parsed.Get("error").String() != "" {
		r.Response.RedirectTo(failRedirect(ctx, parsed.Get("error").String()), http.StatusFound)
		return
	}

	accessToken := parsed.Get("access_token").String()
	if accessToken == "" {
		r.Response.RedirectTo(failRedirect(ctx, "no access_token"), http.StatusFound)
		return
	}

	tokenType := parsed.Get("token_type").String()
	if tokenType == "" {
		tokenType = "Bearer"
	}
	expiresIn := parsed.Get("expires_in").Int()
	expiresAt := time.Now().Add(time.Duration(expiresIn) * time.Second).Format("2006-01-02 15:04:05")
	tscope := parsed.Get("scope").String()
	tenantID := parsed.Get("tenant_id").String()
	instanceURI := parsed.Get("instance_uri").String()

	cnt, err := g.DB().Model("crm_xsy_tokens").Ctx(ctx).Where("user_id", st.UserID).Count()
	if err != nil {
		r.Response.RedirectTo(failRedirect(ctx, err.Error()), http.StatusFound)
		return
	}

	data := g.Map{
		"access_token": accessToken,
		"token_type":   tokenType,
		"expires_in":   expiresIn,
		"expires_at":   expiresAt,
		"scope":        tscope,
		"tenant_id":    tenantID,
		"instance_uri": instanceURI,
		"client_id":    clientID,
	}
	if cnt > 0 {
		_, err = g.DB().Model("crm_xsy_tokens").Ctx(ctx).Where("user_id", st.UserID).Data(data).Update()
	} else {
		data["user_id"] = st.UserID
		_, err = g.DB().Model("crm_xsy_tokens").Ctx(ctx).Data(data).Insert()
	}
	if err != nil {
		r.Response.RedirectTo(failRedirect(ctx, err.Error()), http.StatusFound)
		return
	}

	r.Response.RedirectTo(okRedirect(ctx, st.Redirect), http.StatusFound)
}

func (c *Controller) runXOQL(ctx context.Context, accessToken, xoql string) (totalSize, count int, records []interface{}, err error) {
	_, _, _, _, _, apiBase := xsyClientCfg(ctx)
	u := strings.TrimRight(apiBase, "/") + "/rest/data/v2.0/query/xoql"

	xc := g.Client()
	xc.SetHeader("Authorization", accessToken)
	xc.SetHeader("Content-Type", "application/x-www-form-urlencoded")
	res, err := xc.Post(ctx, u, "xoql="+url.QueryEscape(xoql))
	if err != nil {
		return 0, 0, nil, err
	}
	defer res.Close()

	body := string(res.ReadAll())
	if res.StatusCode != http.StatusOK {
		return 0, 0, nil, fmt.Errorf("xoql http %d: %s", res.StatusCode, body)
	}

	parsed := gjson.New(body)
	if parsed.Get("code").String() != "200" {
		return 0, 0, nil, fmt.Errorf("xoql code %s: %s", parsed.Get("code").String(), body)
	}

	dataJ := parsed.GetJson("data")
	if dataJ == nil || dataJ.IsNil() {
		return 0, 0, nil, fmt.Errorf("xoql missing data: %s", body)
	}
	totalSize = int(dataJ.Get("totalSize").Int())
	count = int(dataJ.Get("count").Int())
	arr := dataJ.Get("records").Array()
	records = make([]interface{}, len(arr))
	for i, v := range arr {
		records[i] = v
	}
	return totalSize, count, records, nil
}

// Customers GET /api/crm/xsy/customers
func (c *Controller) Customers(r *ghttp.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(r)

	accessToken, err := getValidXsyToken(ctx, userID)
	if err != nil || accessToken == "" {
		r.Response.Status = http.StatusUnauthorized
		r.Response.WriteJsonExit(g.Map{"error": "CRM未授权", "code": "CRM_NO_TOKEN"})
		return
	}

	limit := r.GetQuery("limit", 200).Int()
	if limit < 1 {
		limit = 200
	}
	if limit > 2000 {
		limit = 2000
	}
	search := r.GetQuery("search").String()
	xq := buildXOQL(search, limit)

	totalSize, count, records, err := c.runXOQL(ctx, accessToken, xq)
	if err != nil {
		r.Response.Status = http.StatusBadGateway
		r.Response.WriteJsonExit(g.Map{"error": err.Error()})
		return
	}
	r.Response.WriteJsonExit(g.Map{
		"total":   totalSize,
		"count":   count,
		"records": records,
	})
}

// SyncCustomers POST /api/crm/xsy/sync-customers
func (c *Controller) SyncCustomers(r *ghttp.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(r)

	accessToken, err := getValidXsyToken(ctx, userID)
	if err != nil || accessToken == "" {
		r.Response.Status = http.StatusUnauthorized
		r.Response.WriteJsonExit(g.Map{"error": "CRM未授权", "code": "CRM_NO_TOKEN"})
		return
	}

	xq := buildXOQL("", 2000)
	totalSize, _, records, err := c.runXOQL(ctx, accessToken, xq)
	if err != nil {
		r.Response.Status = http.StatusBadGateway
		r.Response.WriteJsonExit(g.Map{"error": err.Error()})
		return
	}

	ts := time.Now().Format("2006-01-02 15:04:05")
	synced := 0

	for _, raw := range records {
		rec := gjson.New(raw)
		crmID := rec.Get("id").String()
		if crmID == "" {
			continue
		}
		custID := "crm_" + crmID
		company := rec.Get("accountName").String()
		if company == "" {
			company = crmID
		}
		industry := rec.Get("industry").String()
		if industry == "" {
			industry = "未知"
		}
		addr := rec.Get("address").String()
		region := addr
		if region == "" {
			region = "未知"
		}
		ownerName := parseOwnerName(rec)

		row := g.Map{
			"company_name":     company,
			"industry":         industry,
			"customer_type":    "Enterprise",
			"level":            "Normal",
			"region":           region,
			"address":          addr,
			"shipping_address": "",
			"status":           "Active",
			"contacts":         "[]",
			"enterprises":      "[]",
			"owner_name":       ownerName,
			"updated_at":       ts,
		}

		exists, _ := g.DB().Model("customers").Ctx(ctx).Where("id", custID).Count()
		if exists > 0 {
			_, err = g.DB().Model("customers").Ctx(ctx).Where("id", custID).Data(row).Update()
		} else {
			row["id"] = custID
			row["created_at"] = ts
			_, err = g.DB().Model("customers").Ctx(ctx).Data(row).Insert()
		}
		if err != nil {
			r.Response.Status = http.StatusBadGateway
			r.Response.WriteJsonExit(g.Map{"error": err.Error()})
			return
		}
		synced++
	}

	r.Response.WriteJsonExit(g.Map{
		"synced": synced,
		"total":  totalSize,
	})
}

// Unbind POST /api/crm/xsy/unbind
func (c *Controller) Unbind(r *ghttp.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(r)
	if _, err := g.DB().Model("crm_xsy_tokens").Ctx(ctx).Where("user_id", userID).Delete(); err != nil {
		r.Response.Status = http.StatusInternalServerError
		r.Response.WriteJsonExit(g.Map{"error": err.Error()})
		return
	}
	r.Response.WriteJsonExit(g.Map{"ok": true})
}
