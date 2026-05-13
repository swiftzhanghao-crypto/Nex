package customer

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"

	"nex-backend/internal/pkg/pagination"
	"nex-backend/internal/pkg/response"
)

type Controller struct{}

func New() *Controller { return &Controller{} }

func (c *Controller) List(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	search := r.GetQuery("search").String()
	customerType := r.GetQuery("type").String()
	level := r.GetQuery("level").String()
	status := r.GetQuery("status").String()
	industry := r.GetQuery("industry").String()
	region := r.GetQuery("region").String()

	m := g.DB().Model("customers").Ctx(ctx)
	if search != "" {
		m = m.Where("company_name LIKE ? OR id LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if customerType != "" {
		m = m.Where("customer_type", customerType)
	}
	if level != "" {
		m = m.Where("level", level)
	}
	if status != "" {
		m = m.Where("status", status)
	}
	if industry != "" {
		m = m.Where("industry", industry)
	}
	if region != "" {
		m = m.Where("region", region)
	}

	result, err := pagination.Query(m.OrderDesc("created_at"), pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}

	customers := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		customers = append(customers, customerFromRow(row))
	}

	response.Ok(r, pagination.BuildResponse("customers", customers, result.Total, pg))
}

func (c *Controller) Detail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("customers").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "客户不存在")
		return
	}
	response.Ok(r, customerFromRow(row))
}

func (c *Controller) Create(r *ghttp.Request) {
	ctx := r.Context()

	var req struct {
		CompanyName     string          `json:"company_name"`
		Industry        string          `json:"industry"`
		CustomerType    string          `json:"customer_type"`
		Level           string          `json:"level"`
		Region          string          `json:"region"`
		Address         string          `json:"address"`
		ShippingAddress string          `json:"shipping_address"`
		Status          string          `json:"status"`
		Logo            string          `json:"logo"`
		Contacts        json.RawMessage `json:"contacts"`
		BillingInfo     json.RawMessage `json:"billing_info"`
		OwnerID         string          `json:"owner_id"`
		OwnerName       string          `json:"owner_name"`
		Enterprises     json.RawMessage `json:"enterprises"`
		NextFollowUp    string          `json:"next_follow_up"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}

	if req.CompanyName == "" || req.Industry == "" || req.CustomerType == "" || req.Level == "" || req.Region == "" {
		response.BadRequest(r, "company_name, industry, customer_type, level, region 为必填")
		return
	}

	status := req.Status
	if status == "" {
		status = "Active"
	}

	contacts := "[]"
	if len(req.Contacts) > 0 {
		contacts = string(req.Contacts)
	}

	billing := ""
	if len(req.BillingInfo) > 0 {
		billing = string(req.BillingInfo)
	}

	enterprises := "[]"
	if len(req.Enterprises) > 0 {
		enterprises = string(req.Enterprises)
	}

	id := fmt.Sprintf("CUS-%d", time.Now().UnixMilli())
	ts := time.Now().Format("2006-01-02 15:04:05")

	_, err := g.DB().Model("customers").Ctx(ctx).Data(g.Map{
		"id":               id,
		"company_name":     req.CompanyName,
		"industry":         req.Industry,
		"customer_type":    req.CustomerType,
		"level":            req.Level,
		"region":           req.Region,
		"address":          req.Address,
		"shipping_address": req.ShippingAddress,
		"status":           status,
		"logo":             req.Logo,
		"contacts":         contacts,
		"billing_info":     billing,
		"owner_id":         req.OwnerID,
		"owner_name":       req.OwnerName,
		"enterprises":      enterprises,
		"next_follow_up":   req.NextFollowUp,
		"created_at":       ts,
		"updated_at":       ts,
	}).Insert()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row, _ := g.DB().Model("customers").Ctx(ctx).Where("id", id).One()
	response.Created(r, customerFromRow(row))
}

func (c *Controller) Update(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	exists, _ := g.DB().Model("customers").Ctx(ctx).Where("id", id).Count()
	if exists == 0 {
		response.NotFound(r, "客户不存在")
		return
	}

	var req struct {
		CompanyName     *string          `json:"company_name"`
		Industry        *string          `json:"industry"`
		CustomerType    *string          `json:"customer_type"`
		Level           *string          `json:"level"`
		Region          *string          `json:"region"`
		Address         *string          `json:"address"`
		ShippingAddress *string          `json:"shipping_address"`
		Status          *string          `json:"status"`
		Logo            *string          `json:"logo"`
		Contacts        *json.RawMessage `json:"contacts"`
		BillingInfo     *json.RawMessage `json:"billing_info"`
		OwnerID         *string          `json:"owner_id"`
		OwnerName       *string          `json:"owner_name"`
		Enterprises     *json.RawMessage `json:"enterprises"`
		NextFollowUp    *string          `json:"next_follow_up"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}

	data := g.Map{}
	if req.CompanyName != nil {
		data["company_name"] = *req.CompanyName
	}
	if req.Industry != nil {
		data["industry"] = *req.Industry
	}
	if req.CustomerType != nil {
		data["customer_type"] = *req.CustomerType
	}
	if req.Level != nil {
		data["level"] = *req.Level
	}
	if req.Region != nil {
		data["region"] = *req.Region
	}
	if req.Address != nil {
		data["address"] = *req.Address
	}
	if req.ShippingAddress != nil {
		data["shipping_address"] = *req.ShippingAddress
	}
	if req.Status != nil {
		data["status"] = *req.Status
	}
	if req.Logo != nil {
		data["logo"] = *req.Logo
	}
	if req.Contacts != nil {
		data["contacts"] = string(*req.Contacts)
	}
	if req.BillingInfo != nil {
		data["billing_info"] = string(*req.BillingInfo)
	}
	if req.OwnerID != nil {
		data["owner_id"] = *req.OwnerID
	}
	if req.OwnerName != nil {
		data["owner_name"] = *req.OwnerName
	}
	if req.Enterprises != nil {
		data["enterprises"] = string(*req.Enterprises)
	}
	if req.NextFollowUp != nil {
		data["next_follow_up"] = *req.NextFollowUp
	}

	if len(data) == 0 {
		response.BadRequest(r, "没有要更新的字段")
		return
	}
	data["updated_at"] = time.Now().Format("2006-01-02 15:04:05")

	_, err := g.DB().Model("customers").Ctx(ctx).Where("id", id).Data(data).Update()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row, _ := g.DB().Model("customers").Ctx(ctx).Where("id", id).One()
	response.Ok(r, customerFromRow(row))
}

func (c *Controller) Delete(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	row, _ := g.DB().Model("customers").Ctx(ctx).Where("id", id).One()
	if row.IsEmpty() {
		response.NotFound(r, "客户不存在")
		return
	}

	if _, err := g.DB().Model("customers").Ctx(ctx).Where("id", id).Delete(); err != nil {
		response.InternalError(r, err)
		return
	}
	response.Ok(r, g.Map{"ok": true})
}

func parseJSON(s, fallback string) interface{} {
	if s == "" {
		s = fallback
	}
	var v interface{}
	_ = json.Unmarshal([]byte(s), &v)
	return v
}

func customerFromRow(row gdb.Record) g.Map {
	return g.Map{
		"id":               row["id"].String(),
		"company_name":     row["company_name"].String(),
		"industry":         row["industry"].String(),
		"customer_type":    row["customer_type"].String(),
		"level":            row["level"].String(),
		"region":           row["region"].String(),
		"address":          row["address"].String(),
		"shipping_address": row["shipping_address"].String(),
		"status":           row["status"].String(),
		"logo":             row["logo"].String(),
		"contacts":         parseJSON(row["contacts"].String(), "[]"),
		"billing_info":     parseJSON(row["billing_info"].String(), "{}"),
		"owner_id":         row["owner_id"].String(),
		"owner_name":       row["owner_name"].String(),
		"enterprises":      parseJSON(row["enterprises"].String(), "[]"),
		"next_follow_up":   row["next_follow_up"].String(),
		"created_at":       row["created_at"].String(),
		"updated_at":       row["updated_at"].String(),
	}
}
