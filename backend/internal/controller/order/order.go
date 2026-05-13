package order

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"nex-backend/internal/middleware"
	"nex-backend/internal/pkg/pagination"
	"nex-backend/internal/pkg/response"
	"nex-backend/internal/service/rbac"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

type Controller struct{}

func New() *Controller { return &Controller{} }

var statusAliases = map[string]string{
	"APPROVED":         "PENDING_CONFIRM",
	"PROCESSING":       "PROCESSING_PROD",
	"COMPLETED":        "DELIVERED",
	"REFUND_REQUESTED": "REFUND_PENDING",
	"REFUNDING":        "REFUND_PENDING",
	"REJECTED":         "DRAFT",
}

func normalizeOrderStatus(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return "DRAFT"
	}
	if v, ok := statusAliases[s]; ok {
		return v
	}
	return s
}

func defaultApprovalMap() map[string]interface{} {
	return map[string]interface{}{
		"salesApproved":    false,
		"businessApproved": false,
		"financeApproved":  false,
	}
}

func approvalFieldForRoles(roles []string) string {
	fieldMap := map[string]string{
		"Sales":    "salesApproved",
		"Business": "businessApproved",
		"Commerce": "businessApproved",
		"Finance":  "financeApproved",
		"Admin":    "financeApproved",
	}
	for _, r := range roles {
		if f, ok := fieldMap[r]; ok {
			return f
		}
	}
	return ""
}

func parseJSONObject(s string) map[string]interface{} {
	s = strings.TrimSpace(s)
	if s == "" {
		return map[string]interface{}{}
	}
	var m map[string]interface{}
	if err := json.Unmarshal([]byte(s), &m); err != nil || m == nil {
		return map[string]interface{}{}
	}
	return m
}

func parseJSONArray(s string) []interface{} {
	s = strings.TrimSpace(s)
	if s == "" {
		return []interface{}{}
	}
	var arr []interface{}
	if err := json.Unmarshal([]byte(s), &arr); err != nil {
		return []interface{}{}
	}
	return arr
}

func jsonTruthy(v interface{}) bool {
	switch t := v.(type) {
	case bool:
		return t
	case float64:
		return t != 0
	case string:
		return strings.EqualFold(t, "true") || t == "1"
	default:
		return false
	}
}

func mergeExtraIntoOrder(m g.Map, extraStr string) {
	extraStr = strings.TrimSpace(extraStr)
	if extraStr == "" {
		return
	}
	var extra map[string]interface{}
	if err := json.Unmarshal([]byte(extraStr), &extra); err != nil || extra == nil {
		return
	}
	for k, v := range extra {
		m[k] = v
	}
}

// orderToResponse builds a camelCase API object (aligned with Node toOrder).
func orderToResponse(row map[string]*g.Var) g.Map {
	status := normalizeOrderStatus(row["status"].String())

	var items interface{}
	_ = json.Unmarshal([]byte(row["items"].String()), &items)
	if items == nil {
		items = []interface{}{}
	}

	var paymentRecord interface{}
	pr := row["payment_record"].String()
	if pr != "" {
		_ = json.Unmarshal([]byte(pr), &paymentRecord)
	}

	approval := parseJSONObject(row["approval"].String())
	if len(approval) == 0 {
		b, _ := json.Marshal(defaultApprovalMap())
		_ = json.Unmarshal(b, &approval)
	}

	approvalRecords := parseJSONArray(row["approval_records"].String())

	var invoiceInfo, acceptanceInfo, acceptanceConfig interface{}
	if v := row["invoice_info"].String(); v != "" {
		_ = json.Unmarshal([]byte(v), &invoiceInfo)
	}
	if v := row["acceptance_info"].String(); v != "" {
		_ = json.Unmarshal([]byte(v), &acceptanceInfo)
	}
	if v := row["acceptance_config"].String(); v != "" {
		_ = json.Unmarshal([]byte(v), &acceptanceConfig)
	}

	out := g.Map{
		"id":                  row["id"].String(),
		"customerId":        row["customer_id"].String(),
		"customerName":        row["customer_name"].String(),
		"customerType":        row["customer_type"].String(),
		"customerLevel":       row["customer_level"].String(),
		"customerIndustry":    row["customer_industry"].String(),
		"customerRegion":      row["customer_region"].String(),
		"date":                row["date"].String(),
		"status":              status,
		"total":               row["total"].Float64(),
		"items":               items,
		"source":              row["source"].String(),
		"buyerType":           row["buyer_type"].String(),
		"buyerName":           row["buyer_name"].String(),
		"buyerId":             row["buyer_id"].String(),
		"shippingAddress":     row["shipping_address"].String(),
		"deliveryMethod":      row["delivery_method"].String(),
		"isPaid":              row["is_paid"].Int() != 0,
		"paymentDate":         row["payment_date"].String(),
		"paymentMethod":       row["payment_method"].String(),
		"paymentTerms":        row["payment_terms"].String(),
		"approval":            approval,
		"approvalRecords":     approvalRecords,
		"salesRepId":          row["sales_rep_id"].String(),
		"salesRepName":        row["sales_rep_name"].String(),
		"businessManagerId":   row["biz_manager_id"].String(),
		"businessManagerName": row["biz_manager_name"].String(),
		"opportunityId":       row["opportunity_id"].String(),
		"opportunityName":     row["opportunity_name"].String(),
		"originalOrderId":     row["original_order_id"].String(),
		"refundReason":        row["refund_reason"].String(),
		"refundAmount":        row["refund_amount"].Float64(),
		"orderRemark":         row["order_remark"].String(),
	}
	if paymentRecord != nil {
		out["paymentRecord"] = paymentRecord
	}
	if invoiceInfo != nil {
		out["invoiceInfo"] = invoiceInfo
	}
	if acceptanceInfo != nil {
		out["acceptanceInfo"] = acceptanceInfo
	}
	if acceptanceConfig != nil {
		out["acceptanceConfig"] = acceptanceConfig
	}
	mergeExtraIntoOrder(out, row["extra"].String())
	return out
}

func (c *Controller) List(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	status := strings.TrimSpace(r.GetQuery("status").String())
	customerID := strings.TrimSpace(r.GetQuery("customerId").String())
	source := strings.TrimSpace(r.GetQuery("source").String())
	keyword := strings.TrimSpace(r.GetQuery("keyword").String())

	m := g.DB().Model("orders").Ctx(ctx)
	if status != "" {
		m = m.Where("status", normalizeOrderStatus(status))
	}
	if customerID != "" {
		m = m.Where("customer_id", customerID)
	}
	if source != "" {
		m = m.Where("source", source)
	}
	if keyword != "" {
		m = m.Where("(customer_name LIKE ? OR id LIKE ?)", "%"+keyword+"%", "%"+keyword+"%")
	}

	result, err := pagination.Query(m.OrderDesc("created_at"), pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}

	orders := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		orders = append(orders, orderToResponse(row))
	}

	response.Ok(r, pagination.BuildResponse("orders", orders, result.Total, pg))
}

func (c *Controller) Detail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("orders").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "订单不存在")
		return
	}
	response.Ok(r, orderToResponse(row))
}

type orderCreateBody struct {
	CustomerID         string          `json:"customer_id"`
	CustomerName       string          `json:"customer_name"`
	CustomerType       string          `json:"customer_type"`
	CustomerLevel      string          `json:"customer_level"`
	CustomerIndustry   string          `json:"customer_industry"`
	CustomerRegion     string          `json:"customer_region"`
	Date               string          `json:"date"`
	Status             string          `json:"status"`
	Total              *float64        `json:"total"`
	Items              json.RawMessage `json:"items"`
	Source             string          `json:"source"`
	BuyerType          string          `json:"buyer_type"`
	BuyerName          string          `json:"buyer_name"`
	BuyerID            string          `json:"buyer_id"`
	ShippingAddress    string          `json:"shipping_address"`
	DeliveryMethod     string          `json:"delivery_method"`
	IsPaid             *bool           `json:"is_paid"`
	PaymentDate        string          `json:"payment_date"`
	PaymentMethod      string          `json:"payment_method"`
	PaymentTerms       string          `json:"payment_terms"`
	PaymentRecord      json.RawMessage `json:"payment_record"`
	Approval           json.RawMessage `json:"approval"`
	ApprovalRecords    json.RawMessage `json:"approval_records"`
	SalesRepID         string          `json:"sales_rep_id"`
	SalesRepName       string          `json:"sales_rep_name"`
	BizManagerID       string          `json:"biz_manager_id"`
	BizManagerName     string          `json:"biz_manager_name"`
	InvoiceInfo        json.RawMessage `json:"invoice_info"`
	AcceptanceInfo     json.RawMessage `json:"acceptance_info"`
	AcceptanceConfig   json.RawMessage `json:"acceptance_config"`
	OpportunityID      string          `json:"opportunity_id"`
	OpportunityName    string          `json:"opportunity_name"`
	OriginalOrderID    string          `json:"original_order_id"`
	RefundReason       string          `json:"refund_reason"`
	RefundAmount       *float64        `json:"refund_amount"`
	OrderRemark        string          `json:"order_remark"`
	Extra              json.RawMessage `json:"extra"`
}

func (c *Controller) Create(r *ghttp.Request) {
	ctx := r.Context()
	var req orderCreateBody
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if strings.TrimSpace(req.CustomerID) == "" || strings.TrimSpace(req.CustomerName) == "" {
		response.BadRequest(r, "customer_id 与 customer_name 必填")
		return
	}

	id := fmt.Sprintf("ORD-%d", time.Now().UnixMilli())
	st := strings.TrimSpace(req.Status)
	if st == "" {
		st = "DRAFT"
	} else {
		st = normalizeOrderStatus(st)
	}

	total := 0.0
	if req.Total != nil {
		total = *req.Total
	}

	itemsJSON := "[]"
	if len(req.Items) > 0 {
		itemsJSON = string(req.Items)
	}

	source := strings.TrimSpace(req.Source)
	if source == "" {
		source = "Sales"
	}
	buyerType := strings.TrimSpace(req.BuyerType)
	if buyerType == "" {
		buyerType = "Customer"
	}

	approvalJSON, err := json.Marshal(defaultApprovalMap())
	if err != nil {
		response.InternalError(r, err)
		return
	}
	if len(req.Approval) > 0 {
		var m map[string]interface{}
		if err := json.Unmarshal(req.Approval, &m); err == nil && m != nil {
			approvalJSON, _ = json.Marshal(m)
		}
	}

	approvalRecordsJSON := "[]"
	if len(req.ApprovalRecords) > 0 {
		approvalRecordsJSON = string(req.ApprovalRecords)
	}

	isPaid := 0
	if req.IsPaid != nil && *req.IsPaid {
		isPaid = 1
	}

	var paymentRecord *string
	if len(req.PaymentRecord) > 0 {
		s := string(req.PaymentRecord)
		paymentRecord = &s
	}

	inv := nullableJSONString(req.InvoiceInfo)
	accI := nullableJSONString(req.AcceptanceInfo)
	accC := nullableJSONString(req.AcceptanceConfig)

	extraJSON := "{}"
	if len(req.Extra) > 0 {
		extraJSON = string(req.Extra)
	}

	dateVal := strings.TrimSpace(req.Date)
	if dateVal == "" {
		dateVal = time.Now().Format(time.RFC3339)
	}

	refundAmt := 0.0
	if req.RefundAmount != nil {
		refundAmt = *req.RefundAmount
	}

	data := g.Map{
		"id":               id,
		"customer_id":      req.CustomerID,
		"customer_name":    req.CustomerName,
		"customer_type":    nullIfEmpty(req.CustomerType),
		"customer_level":   nullIfEmpty(req.CustomerLevel),
		"customer_industry": nullIfEmpty(req.CustomerIndustry),
		"customer_region":  nullIfEmpty(req.CustomerRegion),
		"date":             dateVal,
		"status":           st,
		"total":            total,
		"items":            itemsJSON,
		"source":           source,
		"buyer_type":       buyerType,
		"buyer_name":       nullIfEmpty(req.BuyerName),
		"buyer_id":         nullIfEmpty(req.BuyerID),
		"shipping_address": nullIfEmpty(req.ShippingAddress),
		"delivery_method":  nullIfEmpty(req.DeliveryMethod),
		"is_paid":          isPaid,
		"payment_date":     nullIfEmpty(req.PaymentDate),
		"payment_method":   nullIfEmpty(req.PaymentMethod),
		"payment_terms":    nullIfEmpty(req.PaymentTerms),
		"approval":         string(approvalJSON),
		"approval_records": approvalRecordsJSON,
		"sales_rep_id":     nullIfEmpty(req.SalesRepID),
		"sales_rep_name":   nullIfEmpty(req.SalesRepName),
		"biz_manager_id":   nullIfEmpty(req.BizManagerID),
		"biz_manager_name": nullIfEmpty(req.BizManagerName),
		"opportunity_id":   nullIfEmpty(req.OpportunityID),
		"opportunity_name": nullIfEmpty(req.OpportunityName),
		"original_order_id": nullIfEmpty(req.OriginalOrderID),
		"refund_reason":    nullIfEmpty(req.RefundReason),
		"refund_amount":    refundAmt,
		"order_remark":     nullIfEmpty(req.OrderRemark),
		"extra":            extraJSON,
	}
	if paymentRecord != nil {
		data["payment_record"] = *paymentRecord
	}
	if inv != nil {
		data["invoice_info"] = *inv
	}
	if accI != nil {
		data["acceptance_info"] = *accI
	}
	if accC != nil {
		data["acceptance_config"] = *accC
	}

	_, err = g.DB().Model("orders").Ctx(ctx).Data(data).Insert()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row, _ := g.DB().Model("orders").Ctx(ctx).Where("id", id).One()
	response.Created(r, orderToResponse(row))
}

func nullIfEmpty(s string) interface{} {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return s
}

func nullableJSONString(raw json.RawMessage) *string {
	if len(raw) == 0 {
		return nil
	}
	s := strings.TrimSpace(string(raw))
	if s == "" || s == "null" {
		return nil
	}
	return &s
}

type orderUpdateBody struct {
	CustomerID         *string         `json:"customer_id"`
	CustomerName       *string         `json:"customer_name"`
	CustomerType       *string         `json:"customer_type"`
	CustomerLevel      *string         `json:"customer_level"`
	CustomerIndustry   *string         `json:"customer_industry"`
	CustomerRegion     *string         `json:"customer_region"`
	Date               *string         `json:"date"`
	Status             *string         `json:"status"`
	Total              *float64        `json:"total"`
	Items              json.RawMessage `json:"items"`
	Source             *string         `json:"source"`
	BuyerType          *string         `json:"buyer_type"`
	BuyerName          *string         `json:"buyer_name"`
	BuyerID            *string         `json:"buyer_id"`
	ShippingAddress    *string         `json:"shipping_address"`
	DeliveryMethod     *string         `json:"delivery_method"`
	IsPaid             *bool           `json:"is_paid"`
	PaymentDate        *string         `json:"payment_date"`
	PaymentMethod      *string         `json:"payment_method"`
	PaymentTerms       *string         `json:"payment_terms"`
	PaymentRecord      json.RawMessage `json:"payment_record"`
	Approval           json.RawMessage `json:"approval"`
	ApprovalRecords    json.RawMessage `json:"approval_records"`
	SalesRepID         *string         `json:"sales_rep_id"`
	SalesRepName       *string         `json:"sales_rep_name"`
	BizManagerID       *string         `json:"biz_manager_id"`
	BizManagerName     *string         `json:"biz_manager_name"`
	InvoiceInfo        json.RawMessage `json:"invoice_info"`
	AcceptanceInfo     json.RawMessage `json:"acceptance_info"`
	AcceptanceConfig   json.RawMessage `json:"acceptance_config"`
	OpportunityID      *string         `json:"opportunity_id"`
	OpportunityName    *string         `json:"opportunity_name"`
	OriginalOrderID    *string         `json:"original_order_id"`
	RefundReason       *string         `json:"refund_reason"`
	RefundAmount       *float64        `json:"refund_amount"`
	OrderRemark        *string         `json:"order_remark"`
	Extra              json.RawMessage `json:"extra"`
}

func setIfPtrStr(m g.Map, key string, p *string) {
	if p != nil {
		m[key] = strings.TrimSpace(*p)
	}
}

func (c *Controller) Update(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	row, err := g.DB().Model("orders").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "订单不存在")
		return
	}

	var req orderUpdateBody
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}

	data := g.Map{}
	setIfPtrStr(data, "customer_id", req.CustomerID)
	setIfPtrStr(data, "customer_name", req.CustomerName)
	setIfPtrStr(data, "customer_type", req.CustomerType)
	setIfPtrStr(data, "customer_level", req.CustomerLevel)
	setIfPtrStr(data, "customer_industry", req.CustomerIndustry)
	setIfPtrStr(data, "customer_region", req.CustomerRegion)
	if req.Date != nil {
		data["date"] = strings.TrimSpace(*req.Date)
	}
	if req.Status != nil {
		data["status"] = normalizeOrderStatus(*req.Status)
	}
	if req.Total != nil {
		data["total"] = *req.Total
	}
	if len(req.Items) > 0 {
		data["items"] = string(req.Items)
	}
	setIfPtrStr(data, "source", req.Source)
	setIfPtrStr(data, "buyer_type", req.BuyerType)
	setIfPtrStr(data, "buyer_name", req.BuyerName)
	setIfPtrStr(data, "buyer_id", req.BuyerID)
	setIfPtrStr(data, "shipping_address", req.ShippingAddress)
	setIfPtrStr(data, "delivery_method", req.DeliveryMethod)
	if req.IsPaid != nil {
		if *req.IsPaid {
			data["is_paid"] = 1
		} else {
			data["is_paid"] = 0
		}
	}
	setIfPtrStr(data, "payment_date", req.PaymentDate)
	setIfPtrStr(data, "payment_method", req.PaymentMethod)
	setIfPtrStr(data, "payment_terms", req.PaymentTerms)
	if len(req.PaymentRecord) > 0 {
		data["payment_record"] = string(req.PaymentRecord)
	}
	if len(req.Approval) > 0 {
		data["approval"] = string(req.Approval)
	}
	if len(req.ApprovalRecords) > 0 {
		data["approval_records"] = string(req.ApprovalRecords)
	}
	setIfPtrStr(data, "sales_rep_id", req.SalesRepID)
	setIfPtrStr(data, "sales_rep_name", req.SalesRepName)
	setIfPtrStr(data, "biz_manager_id", req.BizManagerID)
	setIfPtrStr(data, "biz_manager_name", req.BizManagerName)
	if inv := nullableJSONString(req.InvoiceInfo); inv != nil {
		data["invoice_info"] = *inv
	}
	if accI := nullableJSONString(req.AcceptanceInfo); accI != nil {
		data["acceptance_info"] = *accI
	}
	if accC := nullableJSONString(req.AcceptanceConfig); accC != nil {
		data["acceptance_config"] = *accC
	}
	setIfPtrStr(data, "opportunity_id", req.OpportunityID)
	setIfPtrStr(data, "opportunity_name", req.OpportunityName)
	setIfPtrStr(data, "original_order_id", req.OriginalOrderID)
	setIfPtrStr(data, "refund_reason", req.RefundReason)
	if req.RefundAmount != nil {
		data["refund_amount"] = *req.RefundAmount
	}
	setIfPtrStr(data, "order_remark", req.OrderRemark)
	if len(req.Extra) > 0 {
		data["extra"] = string(req.Extra)
	}

	if len(data) == 0 {
		response.BadRequest(r, "没有要更新的字段")
		return
	}

	data["updated_at"] = time.Now().Format("2006-01-02 15:04:05")

	_, err = g.DB().Model("orders").Ctx(ctx).Where("id", id).Data(data).Update()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row2, _ := g.DB().Model("orders").Ctx(ctx).Where("id", id).One()
	response.Ok(r, orderToResponse(row2))
}

type approveBody struct {
	Action string `json:"action"`
	Remark string `json:"remark"`
}

func (c *Controller) Approve(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	row, err := g.DB().Model("orders").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "订单不存在")
		return
	}

	var body approveBody
	if err := r.Parse(&body); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	action := strings.ToLower(strings.TrimSpace(body.Action))
	if action != "approve" && action != "reject" {
		response.BadRequest(r, "action 必须为 approve 或 reject")
		return
	}

	cur := normalizeOrderStatus(row["status"].String())
	if cur != "PENDING_APPROVAL" {
		response.BadRequest(r, fmt.Sprintf("当前状态 %s 不允许审批操作", cur))
		return
	}

	roleJSON := middleware.GetUserRole(r)
	roles := rbac.ParseRoles(roleJSON)
	field := approvalFieldForRoles(roles)
	if field == "" {
		response.Forbidden(r, "当前角色无审批字段映射")
		return
	}

	approval := parseJSONObject(row["approval"].String())
	def := defaultApprovalMap()
	for k, v := range def {
		if _, ok := approval[k]; !ok {
			approval[k] = v
		}
	}

	records := parseJSONArray(row["approval_records"].String())
	rec := map[string]interface{}{
		"userId":    middleware.GetUserID(r),
		"role":      strings.Join(roles, ","),
		"action":    action,
		"remark":    strings.TrimSpace(body.Remark),
		"timestamp": time.Now().Format(time.RFC3339),
	}
	records = append(records, rec)

	if action == "approve" {
		approval[field] = true
	}

	sales := jsonTruthy(approval["salesApproved"])
	biz := jsonTruthy(approval["businessApproved"])
	fin := jsonTruthy(approval["financeApproved"])

	newStatus := "PENDING_APPROVAL"
	if action == "reject" {
		newStatus = "DRAFT"
	} else if sales && biz && fin {
		newStatus = "PENDING_CONFIRM"
	}

	approvalBytes, _ := json.Marshal(approval)
	recordsBytes, _ := json.Marshal(records)

	_, err = g.DB().Model("orders").Ctx(ctx).Where("id", id).Data(g.Map{
		"status":           newStatus,
		"approval":         string(approvalBytes),
		"approval_records": string(recordsBytes),
		"updated_at":       time.Now().Format("2006-01-02 15:04:05"),
	}).Update()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row2, _ := g.DB().Model("orders").Ctx(ctx).Where("id", id).One()
	response.Ok(r, orderToResponse(row2))
}

func (c *Controller) Submit(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	row, err := g.DB().Model("orders").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "订单不存在")
		return
	}

	cur := normalizeOrderStatus(row["status"].String())
	if cur != "DRAFT" {
		response.BadRequest(r, fmt.Sprintf("当前状态 %s 不允许提交审批", cur))
		return
	}

	approvalJSON, _ := json.Marshal(defaultApprovalMap())
	_, err = g.DB().Model("orders").Ctx(ctx).Where("id", id).Data(g.Map{
		"status":     "PENDING_APPROVAL",
		"approval":   string(approvalJSON),
		"updated_at": time.Now().Format("2006-01-02 15:04:05"),
	}).Update()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row2, _ := g.DB().Model("orders").Ctx(ctx).Where("id", id).One()
	response.Ok(r, orderToResponse(row2))
}

func (c *Controller) Delete(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	row, err := g.DB().Model("orders").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "订单不存在")
		return
	}

	st := strings.TrimSpace(row["status"].String())
	isAdmin := rbac.HasRole(middleware.GetUserRole(r), "Admin")
	if !isAdmin && st != "DRAFT" && st != "CANCELLED" {
		response.BadRequest(r, "只有草稿或已取消的订单可以被删除")
		return
	}

	_, err = g.DB().Model("orders").Ctx(ctx).Where("id", id).Delete()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	response.Ok(r, g.Map{"ok": true})
}

func (c *Controller) Logs(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	exists, err := g.DB().Model("orders").Ctx(ctx).Where("id", id).Count()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	if exists == 0 {
		response.NotFound(r, "订单不存在")
		return
	}

	rows, err := g.DB().Model("audit_logs").Ctx(ctx).
		Where("resource", "Order").
		Where("resource_id", id).
		OrderDesc("created_at").
		All()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	out := make([]g.Map, 0, len(rows))
	for _, row := range rows {
		out = append(out, g.Map{
			"id":        row["id"].Int(),
			"userId":    row["user_id"].String(),
			"userName":  row["user_name"].String(),
			"action":    row["action"].String(),
			"detail":    row["detail"].String(),
			"createdAt": row["created_at"].String(),
		})
	}
	response.Ok(r, out)
}
