package opportunity

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"

	"nex-backend/internal/pkg/pagination"
	"nex-backend/internal/pkg/response"
)

type Controller struct{}

func New() *Controller { return &Controller{} }

var validOpportunityStages = map[string]struct{}{
	"需求判断": {},
	"方案报价": {},
	"商务谈判": {},
	"赢单":   {},
	"输单":   {},
}

func validateStage(stage string) bool {
	_, ok := validOpportunityStages[stage]
	return ok
}

func (c *Controller) List(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	search := r.GetQuery("search").String()
	customerID := r.GetQuery("customerId").String()
	stage := r.GetQuery("stage").String()
	ownerID := r.GetQuery("ownerId").String()

	m := g.DB().Model("opportunities").Ctx(ctx)
	if search != "" {
		p := "%" + search + "%"
		m = m.Where("name LIKE ? OR customer_name LIKE ?", p, p)
	}
	if customerID != "" {
		m = m.Where("customer_id", customerID)
	}
	if stage != "" {
		m = m.Where("stage", stage)
	}
	if ownerID != "" {
		m = m.Where("owner_id", ownerID)
	}

	result, err := pagination.Query(m.OrderDesc("close_date"), pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}

	opportunities := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		opportunities = append(opportunities, opportunityRecordToJSON(row))
	}

	response.Ok(r, pagination.BuildResponse("opportunities", opportunities, result.Total, pg))
}

func (c *Controller) Detail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("opportunities").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "商机不存在")
		return
	}
	response.Ok(r, opportunityRecordToJSON(row))
}

func (c *Controller) Create(r *ghttp.Request) {
	ctx := r.Context()
	var req struct {
		CrmID           *string         `json:"crm_id"`
		Name            string          `json:"name"`
		CustomerID      string          `json:"customer_id"`
		CustomerName    string          `json:"customer_name"`
		ProductType     *string         `json:"product_type"`
		Products        json.RawMessage `json:"products"`
		Stage           *string         `json:"stage"`
		Probability     *float64        `json:"probability"`
		Department      *string         `json:"department"`
		Amount          *float64        `json:"amount"`
		ExpectedRevenue *float64        `json:"expected_revenue"`
		FinalUserRev    *float64        `json:"final_user_rev"`
		CloseDate       string          `json:"close_date"`
		OwnerID         string          `json:"owner_id"`
		OwnerName       string          `json:"owner_name"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.CustomerID) == "" || strings.TrimSpace(req.CustomerName) == "" {
		response.BadRequest(r, "name、customer_id、customer_name 必填")
		return
	}
	if strings.TrimSpace(req.CloseDate) == "" || strings.TrimSpace(req.OwnerID) == "" || strings.TrimSpace(req.OwnerName) == "" {
		response.BadRequest(r, "close_date、owner_id、owner_name 必填")
		return
	}

	stage := "需求判断"
	if req.Stage != nil && strings.TrimSpace(*req.Stage) != "" {
		stage = strings.TrimSpace(*req.Stage)
	}
	if !validateStage(stage) {
		response.BadRequest(r, "无效的 stage")
		return
	}

	probability := 0.0
	if req.Probability != nil {
		probability = *req.Probability
	}
	expectedRevenue := 0.0
	if req.ExpectedRevenue != nil {
		expectedRevenue = *req.ExpectedRevenue
	}

	id := fmt.Sprintf("OPP-%d", time.Now().UnixMilli())

	data := g.Map{
		"id":               id,
		"name":             req.Name,
		"customer_id":      req.CustomerID,
		"customer_name":    req.CustomerName,
		"stage":            stage,
		"probability":      probability,
		"expected_revenue": expectedRevenue,
		"close_date":       req.CloseDate,
		"owner_id":         req.OwnerID,
		"owner_name":       req.OwnerName,
	}
	if req.CrmID != nil {
		data["crm_id"] = *req.CrmID
	}
	if req.ProductType != nil {
		data["product_type"] = *req.ProductType
	}
	if len(req.Products) > 0 {
		data["products"] = string(req.Products)
	}
	if req.Department != nil {
		data["department"] = *req.Department
	}
	if req.Amount != nil {
		data["amount"] = *req.Amount
	}
	if req.FinalUserRev != nil {
		data["final_user_rev"] = *req.FinalUserRev
	}

	_, err := g.DB().Model("opportunities").Ctx(ctx).Data(data).Insert()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row, _ := g.DB().Model("opportunities").Ctx(ctx).Where("id", id).One()
	response.Created(r, opportunityRecordToJSON(row))
}

func (c *Controller) Update(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	var req struct {
		CrmID           *string         `json:"crm_id"`
		Name            *string         `json:"name"`
		CustomerID      *string         `json:"customer_id"`
		CustomerName    *string         `json:"customer_name"`
		ProductType     *string         `json:"product_type"`
		Products        json.RawMessage `json:"products"`
		Stage           *string         `json:"stage"`
		Probability     *float64        `json:"probability"`
		Department      *string         `json:"department"`
		Amount          *float64        `json:"amount"`
		ExpectedRevenue *float64        `json:"expected_revenue"`
		FinalUserRev    *float64        `json:"final_user_rev"`
		CloseDate       *string         `json:"close_date"`
		OwnerID         *string         `json:"owner_id"`
		OwnerName       *string         `json:"owner_name"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}

	if req.Stage != nil {
		s := strings.TrimSpace(*req.Stage)
		if s == "" || !validateStage(s) {
			response.BadRequest(r, "无效的 stage")
			return
		}
	}

	data := g.Map{}
	if req.CrmID != nil {
		data["crm_id"] = *req.CrmID
	}
	if req.Name != nil {
		data["name"] = *req.Name
	}
	if req.CustomerID != nil {
		data["customer_id"] = *req.CustomerID
	}
	if req.CustomerName != nil {
		data["customer_name"] = *req.CustomerName
	}
	if req.ProductType != nil {
		data["product_type"] = *req.ProductType
	}
	if len(req.Products) > 0 {
		data["products"] = string(req.Products)
	}
	if req.Stage != nil {
		data["stage"] = strings.TrimSpace(*req.Stage)
	}
	if req.Probability != nil {
		data["probability"] = *req.Probability
	}
	if req.Department != nil {
		data["department"] = *req.Department
	}
	if req.Amount != nil {
		data["amount"] = *req.Amount
	}
	if req.ExpectedRevenue != nil {
		data["expected_revenue"] = *req.ExpectedRevenue
	}
	if req.FinalUserRev != nil {
		data["final_user_rev"] = *req.FinalUserRev
	}
	if req.CloseDate != nil {
		data["close_date"] = *req.CloseDate
	}
	if req.OwnerID != nil {
		data["owner_id"] = *req.OwnerID
	}
	if req.OwnerName != nil {
		data["owner_name"] = *req.OwnerName
	}

	if len(data) == 0 {
		response.BadRequest(r, "没有要更新的字段")
		return
	}

	res, err := g.DB().Model("opportunities").Ctx(ctx).Where("id", id).Data(data).Update()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		response.NotFound(r, "商机不存在")
		return
	}

	row, _ := g.DB().Model("opportunities").Ctx(ctx).Where("id", id).One()
	response.Ok(r, opportunityRecordToJSON(row))
}

func (c *Controller) Delete(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	row, err := g.DB().Model("opportunities").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "商机不存在")
		return
	}
	if row["stage"].String() == "赢单" {
		response.BadRequest(r, "赢单商机不可删除")
		return
	}

	if _, err := g.DB().Model("opportunities").Ctx(ctx).Where("id", id).Delete(); err != nil {
		response.InternalError(r, err)
		return
	}
	response.Ok(r, g.Map{"ok": true})
}

func opportunityRecordToJSON(row gdb.Record) g.Map {
	out := g.Map{
		"id":                row["id"].String(),
		"name":              row["name"].String(),
		"crmId":             row["crm_id"].String(),
		"customerId":        row["customer_id"].String(),
		"customerName":      row["customer_name"].String(),
		"productType":       row["product_type"].String(),
		"products":          parseProductsJSON(row["products"].String()),
		"stage":             row["stage"].String(),
		"probability":       row["probability"].Float64(),
		"department":        row["department"].String(),
		"amount":            row["amount"].Float64(),
		"expectedRevenue":   row["expected_revenue"].Float64(),
		"finalUserRevenue":  row["final_user_rev"].Float64(),
		"closeDate":         row["close_date"].String(),
		"ownerId":           row["owner_id"].String(),
		"ownerName":         row["owner_name"].String(),
		"createdAt":         row["created_at"].String(),
	}
	return out
}

func parseProductsJSON(s string) interface{} {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	var v interface{}
	if err := json.Unmarshal([]byte(s), &v); err != nil {
		return s
	}
	return v
}
