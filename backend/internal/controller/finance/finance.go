package finance

import (
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

var contractVerifyStatuses = map[string]struct{}{
	"PENDING_BUSINESS": {},
	"PENDING":          {},
	"VERIFIED":         {},
	"APPROVED":         {},
	"REJECTED":         {},
}

var invoiceStatuses = map[string]struct{}{
	"PENDING":   {},
	"APPROVED":  {},
	"ISSUED":    {},
	"REJECTED":  {},
	"CANCELLED": {},
}

func contractFromRow(row gdb.Record) g.Map {
	return g.Map{
		"id":             row["id"].String(),
		"code":           row["code"].String(),
		"name":           row["name"].String(),
		"externalCode":   row["external_code"].String(),
		"contractType":   row["contract_type"].String(),
		"partyA":         row["party_a"].String(),
		"partyB":         row["party_b"].String(),
		"verifyStatus":   row["verify_status"].String(),
		"verifyRemark":   row["verify_remark"].String(),
		"amount":         row["amount"].Float64(),
		"signDate":       row["sign_date"].String(),
		"orderId":        row["order_id"].String(),
		"customerId":     row["customer_id"].String(),
		"createdAt":      row["created_at"].String(),
	}
}

func remittanceFromRow(row gdb.Record) g.Map {
	return g.Map{
		"id":                 row["id"].String(),
		"erpDocNo":           row["erp_doc_no"].String(),
		"bankTransactionNo":  row["bank_transaction_no"].String(),
		"type":               row["type"].String(),
		"remitterName":       row["remitter_name"].String(),
		"remitterAccount":    row["remitter_account"].String(),
		"paymentMethod":      row["payment_method"].String(),
		"amount":             row["amount"].Float64(),
		"receiverName":       row["receiver_name"].String(),
		"receiverAccount":    row["receiver_account"].String(),
		"paymentTime":        row["payment_time"].String(),
	}
}

func invoiceFromRow(row gdb.Record) g.Map {
	return g.Map{
		"id":           row["id"].String(),
		"invoiceTitle": row["invoice_title"].String(),
		"amount":       row["amount"].Float64(),
		"applyTime":    row["apply_time"].String(),
		"applyType":    row["apply_type"].String(),
		"status":       row["status"].String(),
		"orderId":      row["order_id"].String(),
		"taxId":        row["tax_id"].String(),
		"remark":       row["remark"].String(),
	}
}

func performanceFromRow(row gdb.Record) g.Map {
	return g.Map{
		"id":                         row["id"].String(),
		"orderId":                    row["order_id"].String(),
		"acceptanceDetailId":         row["acceptance_detail_id"].String(),
		"orderStatus":                row["order_status"].String(),
		"detailAmountSubtotal":       row["detail_amount_subtotal"].Float64(),
		"acceptanceRatio":            row["acceptance_ratio"].Float64(),
		"deferralRatio":              row["deferral_ratio"].Float64(),
		"postContractStatus":         row["post_contract_status"].String(),
		"discount":                   row["discount"].String(),
		"costAmount":                 row["cost_amount"].Float64(),
		"salesPerformance":           row["sales_performance"].Float64(),
		"weightedSalesPerformance":   row["weighted_sales_performance"].Float64(),
		"projectWeightCoeff":         row["project_weight_coeff"].Float64(),
		"productWeightCoeffSub":      row["product_weight_coeff_sub"].Float64(),
		"productWeightCoeffAuth":     row["product_weight_coeff_auth"].Float64(),
		"serviceType":                row["service_type"].String(),
		"owner":                      row["owner"].String(),
	}
}

func authorizationFromRow(row gdb.Record) g.Map {
	return g.Map{
		"id":               row["id"].String(),
		"authCode":         row["auth_code"].String(),
		"orderId":          row["order_id"].String(),
		"licensee":         row["licensee"].String(),
		"customerName":     row["customer_name"].String(),
		"customerId":       row["customer_id"].String(),
		"productName":      row["product_name"].String(),
		"productCode":      row["product_code"].String(),
		"authStartDate":    row["auth_start_date"].String(),
		"authEndDate":      row["auth_end_date"].String(),
		"serviceStartDate": row["service_start_date"].String(),
		"serviceEndDate":   row["service_end_date"].String(),
	}
}

func deliveryFromRow(row gdb.Record) g.Map {
	return g.Map{
		"id":               row["id"].String(),
		"deliveryType":     row["delivery_type"].String(),
		"orderId":          row["order_id"].String(),
		"quantity":         row["quantity"].Int(),
		"authType":         row["auth_type"].String(),
		"licensee":         row["licensee"].String(),
		"customerName":     row["customer_name"].String(),
		"customerId":       row["customer_id"].String(),
		"authCode":         row["auth_code"].String(),
		"authDuration":     row["auth_duration"].String(),
		"authStartDate":    row["auth_start_date"].String(),
		"authEndDate":      row["auth_end_date"].String(),
		"serviceStartDate": row["service_start_date"].String(),
		"serviceEndDate":   row["service_end_date"].String(),
	}
}

func auditLogFromRow(row gdb.Record) g.Map {
	return g.Map{
		"id":         row["id"].Int64(),
		"userId":     row["user_id"].String(),
		"userName":   row["user_name"].String(),
		"action":     row["action"].String(),
		"resource":   row["resource"].String(),
		"resourceId": row["resource_id"].String(),
		"detail":     row["detail"].String(),
		"ip":         row["ip"].String(),
		"createdAt":  row["created_at"].String(),
	}
}

// --- Contracts ---

func (c *Controller) ContractList(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	status := r.GetQuery("status").String()
	orderID := r.GetQuery("orderId").String()
	search := r.GetQuery("search").String()

	m := g.DB().Model("contracts").Ctx(ctx)
	if status != "" {
		m = m.Where("verify_status", status)
	}
	if orderID != "" {
		m = m.Where("order_id", orderID)
	}
	if search != "" {
		k := "%" + search + "%"
		m = m.Where("code LIKE ? OR name LIKE ?", k, k)
	}
	m = m.OrderDesc("created_at")

	result, err := pagination.Query(m, pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}
	contracts := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		contracts = append(contracts, contractFromRow(row))
	}
	response.Ok(r, pagination.BuildResponse("contracts", contracts, result.Total, pg))
}

func (c *Controller) ContractDetail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("contracts").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "合同不存在")
		return
	}
	response.Ok(r, contractFromRow(row))
}

func (c *Controller) ContractCreate(r *ghttp.Request) {
	ctx := r.Context()
	var req struct {
		Code          string  `json:"code"`
		Name          string  `json:"name"`
		ExternalCode  string  `json:"external_code"`
		ContractType  string  `json:"contract_type"`
		PartyA        string  `json:"party_a"`
		PartyB        string  `json:"party_b"`
		VerifyStatus  string  `json:"verify_status"`
		VerifyRemark  string  `json:"verify_remark"`
		Amount        float64 `json:"amount"`
		SignDate      string  `json:"sign_date"`
		OrderID       string  `json:"order_id"`
		CustomerID    string  `json:"customer_id"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if req.Code == "" || req.Name == "" || req.ContractType == "" {
		response.BadRequest(r, "code, name, contract_type 为必填")
		return
	}
	verifyStatus := req.VerifyStatus
	if verifyStatus == "" {
		verifyStatus = "PENDING"
	}
	if _, ok := contractVerifyStatuses[verifyStatus]; !ok {
		response.BadRequest(r, "非法 verify_status")
		return
	}

	id := fmt.Sprintf("CON-%d", time.Now().UnixMilli())
	_, err := g.DB().Model("contracts").Ctx(ctx).Data(g.Map{
		"id":             id,
		"code":           req.Code,
		"name":           req.Name,
		"external_code":  req.ExternalCode,
		"contract_type":  req.ContractType,
		"party_a":        req.PartyA,
		"party_b":        req.PartyB,
		"verify_status":  verifyStatus,
		"verify_remark":  req.VerifyRemark,
		"amount":         req.Amount,
		"sign_date":      req.SignDate,
		"order_id":       req.OrderID,
		"customer_id":    req.CustomerID,
	}).Insert()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ := g.DB().Model("contracts").Ctx(ctx).Where("id", id).One()
	response.Created(r, contractFromRow(row))
}

func (c *Controller) ContractUpdate(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	cur, err := g.DB().Model("contracts").Ctx(ctx).Where("id", id).One()
	if err != nil || cur.IsEmpty() {
		response.NotFound(r, "合同不存在")
		return
	}

	var req struct {
		Code          *string  `json:"code"`
		Name          *string  `json:"name"`
		ExternalCode  *string  `json:"external_code"`
		ContractType  *string  `json:"contract_type"`
		PartyA        *string  `json:"party_a"`
		PartyB        *string  `json:"party_b"`
		VerifyStatus  *string  `json:"verify_status"`
		VerifyRemark  *string  `json:"verify_remark"`
		Amount        *float64 `json:"amount"`
		SignDate      *string  `json:"sign_date"`
		OrderID       *string  `json:"order_id"`
		CustomerID    *string  `json:"customer_id"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}

	data := g.Map{}
	if req.Code != nil {
		data["code"] = *req.Code
	}
	if req.Name != nil {
		data["name"] = *req.Name
	}
	if req.ExternalCode != nil {
		data["external_code"] = *req.ExternalCode
	}
	if req.ContractType != nil {
		data["contract_type"] = *req.ContractType
	}
	if req.PartyA != nil {
		data["party_a"] = *req.PartyA
	}
	if req.PartyB != nil {
		data["party_b"] = *req.PartyB
	}
	if req.VerifyStatus != nil {
		if _, ok := contractVerifyStatuses[*req.VerifyStatus]; !ok {
			response.BadRequest(r, "非法 verify_status")
			return
		}
		if cur["verify_status"].String() == "APPROVED" && *req.VerifyStatus != "APPROVED" {
			response.BadRequest(r, "已审批合同不可修改审批状态")
			return
		}
		data["verify_status"] = *req.VerifyStatus
	}
	if req.VerifyRemark != nil {
		data["verify_remark"] = *req.VerifyRemark
	}
	if req.Amount != nil {
		data["amount"] = *req.Amount
	}
	if req.SignDate != nil {
		data["sign_date"] = *req.SignDate
	}
	if req.OrderID != nil {
		data["order_id"] = *req.OrderID
	}
	if req.CustomerID != nil {
		data["customer_id"] = *req.CustomerID
	}

	if len(data) == 0 {
		response.BadRequest(r, "没有要更新的字段")
		return
	}
	if _, err := g.DB().Model("contracts").Ctx(ctx).Where("id", id).Data(data).Update(); err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ := g.DB().Model("contracts").Ctx(ctx).Where("id", id).One()
	response.Ok(r, contractFromRow(row))
}

func (c *Controller) ContractDelete(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("contracts").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "合同不存在")
		return
	}
	if row["verify_status"].String() == "APPROVED" {
		response.Forbidden(r, "已审批合同不可删除")
		return
	}
	if _, err := g.DB().Model("contracts").Ctx(ctx).Where("id", id).Delete(); err != nil {
		response.InternalError(r, err)
		return
	}
	response.Ok(r, g.Map{"ok": true})
}

// --- Remittances ---

func (c *Controller) RemittanceList(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	typ := r.GetQuery("type").String()
	search := r.GetQuery("search").String()

	m := g.DB().Model("remittances").Ctx(ctx)
	if typ != "" {
		m = m.Where("type", typ)
	}
	if search != "" {
		k := "%" + search + "%"
		m = m.Where("remitter_name LIKE ? OR receiver_name LIKE ?", k, k)
	}
	m = m.OrderDesc("id")

	result, err := pagination.Query(m, pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}
	list := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		list = append(list, remittanceFromRow(row))
	}
	response.Ok(r, pagination.BuildResponse("remittances", list, result.Total, pg))
}

func (c *Controller) RemittanceDetail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("remittances").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "回款记录不存在")
		return
	}
	response.Ok(r, remittanceFromRow(row))
}

func (c *Controller) RemittanceCreate(r *ghttp.Request) {
	ctx := r.Context()
	var req struct {
		ErpDocNo          string  `json:"erp_doc_no"`
		BankTransactionNo string  `json:"bank_transaction_no"`
		Type              string  `json:"type"`
		RemitterName      string  `json:"remitter_name"`
		RemitterAccount   string  `json:"remitter_account"`
		PaymentMethod     string  `json:"payment_method"`
		Amount            float64 `json:"amount"`
		ReceiverName      string  `json:"receiver_name"`
		ReceiverAccount   string  `json:"receiver_account"`
		PaymentTime       string  `json:"payment_time"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if req.Type == "" || req.RemitterName == "" || req.PaymentMethod == "" || req.ReceiverName == "" || req.PaymentTime == "" {
		response.BadRequest(r, "type, remitter_name, payment_method, receiver_name, payment_time 为必填")
		return
	}

	id := fmt.Sprintf("REM-%d", time.Now().UnixMilli())
	_, err := g.DB().Model("remittances").Ctx(ctx).Data(g.Map{
		"id":                   id,
		"erp_doc_no":           req.ErpDocNo,
		"bank_transaction_no":  req.BankTransactionNo,
		"type":                 req.Type,
		"remitter_name":        req.RemitterName,
		"remitter_account":     req.RemitterAccount,
		"payment_method":       req.PaymentMethod,
		"amount":               req.Amount,
		"receiver_name":        req.ReceiverName,
		"receiver_account":     req.ReceiverAccount,
		"payment_time":         req.PaymentTime,
	}).Insert()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ := g.DB().Model("remittances").Ctx(ctx).Where("id", id).One()
	response.Created(r, remittanceFromRow(row))
}

func (c *Controller) RemittanceUpdate(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	exists, _ := g.DB().Model("remittances").Ctx(ctx).Where("id", id).Count()
	if exists == 0 {
		response.NotFound(r, "回款记录不存在")
		return
	}

	var req struct {
		ErpDocNo          *string  `json:"erp_doc_no"`
		BankTransactionNo *string  `json:"bank_transaction_no"`
		Type              *string  `json:"type"`
		RemitterName      *string  `json:"remitter_name"`
		RemitterAccount   *string  `json:"remitter_account"`
		PaymentMethod     *string  `json:"payment_method"`
		Amount            *float64 `json:"amount"`
		ReceiverName      *string  `json:"receiver_name"`
		ReceiverAccount   *string  `json:"receiver_account"`
		PaymentTime       *string  `json:"payment_time"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	data := g.Map{}
	if req.ErpDocNo != nil {
		data["erp_doc_no"] = *req.ErpDocNo
	}
	if req.BankTransactionNo != nil {
		data["bank_transaction_no"] = *req.BankTransactionNo
	}
	if req.Type != nil {
		data["type"] = *req.Type
	}
	if req.RemitterName != nil {
		data["remitter_name"] = *req.RemitterName
	}
	if req.RemitterAccount != nil {
		data["remitter_account"] = *req.RemitterAccount
	}
	if req.PaymentMethod != nil {
		data["payment_method"] = *req.PaymentMethod
	}
	if req.Amount != nil {
		data["amount"] = *req.Amount
	}
	if req.ReceiverName != nil {
		data["receiver_name"] = *req.ReceiverName
	}
	if req.ReceiverAccount != nil {
		data["receiver_account"] = *req.ReceiverAccount
	}
	if req.PaymentTime != nil {
		data["payment_time"] = *req.PaymentTime
	}
	if len(data) == 0 {
		response.BadRequest(r, "没有要更新的字段")
		return
	}
	if _, err := g.DB().Model("remittances").Ctx(ctx).Where("id", id).Data(data).Update(); err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ := g.DB().Model("remittances").Ctx(ctx).Where("id", id).One()
	response.Ok(r, remittanceFromRow(row))
}

func (c *Controller) RemittanceDelete(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	res, err := g.DB().Model("remittances").Ctx(ctx).Where("id", id).Delete()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		response.NotFound(r, "回款记录不存在")
		return
	}
	response.Ok(r, g.Map{"ok": true})
}

// --- Invoices ---

func (c *Controller) InvoiceList(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	status := r.GetQuery("status").String()
	orderID := r.GetQuery("orderId").String()
	search := r.GetQuery("search").String()

	m := g.DB().Model("invoices").Ctx(ctx)
	if status != "" {
		m = m.Where("status", status)
	}
	if orderID != "" {
		m = m.Where("order_id", orderID)
	}
	if search != "" {
		m = m.Where("invoice_title LIKE ?", "%"+search+"%")
	}
	m = m.OrderDesc("id")

	result, err := pagination.Query(m, pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}
	list := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		list = append(list, invoiceFromRow(row))
	}
	response.Ok(r, pagination.BuildResponse("invoices", list, result.Total, pg))
}

func (c *Controller) InvoiceDetail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("invoices").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "发票不存在")
		return
	}
	response.Ok(r, invoiceFromRow(row))
}

func (c *Controller) InvoiceCreate(r *ghttp.Request) {
	ctx := r.Context()
	var req struct {
		InvoiceTitle string  `json:"invoice_title"`
		Amount       float64 `json:"amount"`
		ApplyTime    string  `json:"apply_time"`
		ApplyType    string  `json:"apply_type"`
		Status       string  `json:"status"`
		OrderID      string  `json:"order_id"`
		TaxID        string  `json:"tax_id"`
		Remark       string  `json:"remark"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if req.InvoiceTitle == "" || req.ApplyTime == "" || req.ApplyType == "" {
		response.BadRequest(r, "invoice_title, apply_time, apply_type 为必填")
		return
	}
	st := req.Status
	if st == "" {
		st = "PENDING"
	}
	if _, ok := invoiceStatuses[st]; !ok {
		response.BadRequest(r, "非法 status")
		return
	}

	id := fmt.Sprintf("INV-%d", time.Now().UnixMilli())
	_, err := g.DB().Model("invoices").Ctx(ctx).Data(g.Map{
		"id":             id,
		"invoice_title":  req.InvoiceTitle,
		"amount":         req.Amount,
		"apply_time":     req.ApplyTime,
		"apply_type":     req.ApplyType,
		"status":         st,
		"order_id":       req.OrderID,
		"tax_id":         req.TaxID,
		"remark":         req.Remark,
	}).Insert()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ := g.DB().Model("invoices").Ctx(ctx).Where("id", id).One()
	response.Created(r, invoiceFromRow(row))
}

func (c *Controller) InvoiceUpdate(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	cur, err := g.DB().Model("invoices").Ctx(ctx).Where("id", id).One()
	if err != nil || cur.IsEmpty() {
		response.NotFound(r, "发票不存在")
		return
	}
	var req struct {
		InvoiceTitle *string  `json:"invoice_title"`
		Amount       *float64 `json:"amount"`
		ApplyTime    *string  `json:"apply_time"`
		ApplyType    *string  `json:"apply_type"`
		Status       *string  `json:"status"`
		OrderID      *string  `json:"order_id"`
		TaxID        *string  `json:"tax_id"`
		Remark       *string  `json:"remark"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if cur["status"].String() == "ISSUED" && req.Status != nil && *req.Status != "ISSUED" {
		response.BadRequest(r, "已开具发票不可变更状态")
		return
	}
	if req.Status != nil {
		if _, ok := invoiceStatuses[*req.Status]; !ok {
			response.BadRequest(r, "非法 status")
			return
		}
	}

	data := g.Map{}
	if req.InvoiceTitle != nil {
		data["invoice_title"] = *req.InvoiceTitle
	}
	if req.Amount != nil {
		data["amount"] = *req.Amount
	}
	if req.ApplyTime != nil {
		data["apply_time"] = *req.ApplyTime
	}
	if req.ApplyType != nil {
		data["apply_type"] = *req.ApplyType
	}
	if req.Status != nil {
		data["status"] = *req.Status
	}
	if req.OrderID != nil {
		data["order_id"] = *req.OrderID
	}
	if req.TaxID != nil {
		data["tax_id"] = *req.TaxID
	}
	if req.Remark != nil {
		data["remark"] = *req.Remark
	}
	if len(data) == 0 {
		response.BadRequest(r, "没有要更新的字段")
		return
	}
	if _, err := g.DB().Model("invoices").Ctx(ctx).Where("id", id).Data(data).Update(); err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ := g.DB().Model("invoices").Ctx(ctx).Where("id", id).One()
	response.Ok(r, invoiceFromRow(row))
}

func (c *Controller) InvoiceDelete(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("invoices").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "发票不存在")
		return
	}
	if row["status"].String() == "ISSUED" {
		response.Forbidden(r, "已开具发票不可删除")
		return
	}
	if _, err := g.DB().Model("invoices").Ctx(ctx).Where("id", id).Delete(); err != nil {
		response.InternalError(r, err)
		return
	}
	response.Ok(r, g.Map{"ok": true})
}

// --- Performances (read-only) ---

func (c *Controller) PerformanceList(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	orderID := r.GetQuery("orderId").String()
	owner := r.GetQuery("owner").String()
	serviceType := r.GetQuery("serviceType").String()
	search := r.GetQuery("search").String()

	m := g.DB().Model("performances").Ctx(ctx)
	if orderID != "" {
		m = m.Where("order_id", orderID)
	}
	if owner != "" {
		m = m.Where("owner", owner)
	}
	if serviceType != "" {
		m = m.Where("service_type", serviceType)
	}
	if search != "" {
		k := "%" + search + "%"
		m = m.Where("order_id LIKE ? OR owner LIKE ? OR acceptance_detail_id LIKE ? OR service_type LIKE ?", k, k, k, k)
	}
	m = m.OrderDesc("id")

	result, err := pagination.Query(m, pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}
	list := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		list = append(list, performanceFromRow(row))
	}
	response.Ok(r, pagination.BuildResponse("performances", list, result.Total, pg))
}

func (c *Controller) PerformanceDetail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("performances").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "业绩记录不存在")
		return
	}
	response.Ok(r, performanceFromRow(row))
}

// --- Authorizations ---

func (c *Controller) AuthorizationList(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	customerID := r.GetQuery("customerId").String()
	orderID := r.GetQuery("orderId").String()
	search := r.GetQuery("search").String()

	m := g.DB().Model("authorizations").Ctx(ctx)
	if customerID != "" {
		m = m.Where("customer_id", customerID)
	}
	if orderID != "" {
		m = m.Where("order_id", orderID)
	}
	if search != "" {
		k := "%" + search + "%"
		m = m.Where("auth_code LIKE ? OR customer_name LIKE ? OR product_name LIKE ? OR product_code LIKE ?", k, k, k, k)
	}
	m = m.OrderDesc("id")

	result, err := pagination.Query(m, pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}
	list := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		list = append(list, authorizationFromRow(row))
	}
	response.Ok(r, pagination.BuildResponse("authorizations", list, result.Total, pg))
}

func (c *Controller) AuthorizationDetail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("authorizations").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "授权不存在")
		return
	}
	response.Ok(r, authorizationFromRow(row))
}

func (c *Controller) AuthorizationCreate(r *ghttp.Request) {
	ctx := r.Context()
	var req struct {
		AuthCode         string `json:"auth_code"`
		OrderID          string `json:"order_id"`
		Licensee         string `json:"licensee"`
		CustomerName     string `json:"customer_name"`
		CustomerID       string `json:"customer_id"`
		ProductName      string `json:"product_name"`
		ProductCode      string `json:"product_code"`
		AuthStartDate    string `json:"auth_start_date"`
		AuthEndDate      string `json:"auth_end_date"`
		ServiceStartDate string `json:"service_start_date"`
		ServiceEndDate   string `json:"service_end_date"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if req.AuthCode == "" || req.OrderID == "" || req.Licensee == "" || req.CustomerName == "" ||
		req.CustomerID == "" || req.ProductName == "" || req.ProductCode == "" ||
		req.AuthStartDate == "" || req.AuthEndDate == "" {
		response.BadRequest(r, "必填字段缺失")
		return
	}

	id := fmt.Sprintf("AUTH-%d", time.Now().UnixMilli())
	_, err := g.DB().Model("authorizations").Ctx(ctx).Data(g.Map{
		"id":                 id,
		"auth_code":          req.AuthCode,
		"order_id":           req.OrderID,
		"licensee":           req.Licensee,
		"customer_name":      req.CustomerName,
		"customer_id":        req.CustomerID,
		"product_name":       req.ProductName,
		"product_code":       req.ProductCode,
		"auth_start_date":    req.AuthStartDate,
		"auth_end_date":      req.AuthEndDate,
		"service_start_date": req.ServiceStartDate,
		"service_end_date":   req.ServiceEndDate,
	}).Insert()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ := g.DB().Model("authorizations").Ctx(ctx).Where("id", id).One()
	response.Created(r, authorizationFromRow(row))
}

// --- Delivery infos ---

func (c *Controller) DeliveryList(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	customerID := r.GetQuery("customerId").String()
	orderID := r.GetQuery("orderId").String()
	deliveryType := r.GetQuery("deliveryType").String()
	search := r.GetQuery("search").String()

	m := g.DB().Model("delivery_infos").Ctx(ctx)
	if customerID != "" {
		m = m.Where("customer_id", customerID)
	}
	if orderID != "" {
		m = m.Where("order_id", orderID)
	}
	if deliveryType != "" {
		m = m.Where("delivery_type", deliveryType)
	}
	if search != "" {
		k := "%" + search + "%"
		m = m.Where("licensee LIKE ? OR customer_name LIKE ? OR auth_code LIKE ? OR order_id LIKE ?", k, k, k, k)
	}
	m = m.OrderDesc("id")

	result, err := pagination.Query(m, pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}
	list := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		list = append(list, deliveryFromRow(row))
	}
	response.Ok(r, pagination.BuildResponse("deliveryInfos", list, result.Total, pg))
}

func (c *Controller) DeliveryDetail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("delivery_infos").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "交付信息不存在")
		return
	}
	response.Ok(r, deliveryFromRow(row))
}

func (c *Controller) DeliveryCreate(r *ghttp.Request) {
	ctx := r.Context()
	var req struct {
		DeliveryType     string `json:"delivery_type"`
		OrderID          string `json:"order_id"`
		Quantity         int    `json:"quantity"`
		AuthType         string `json:"auth_type"`
		Licensee         string `json:"licensee"`
		CustomerName     string `json:"customer_name"`
		CustomerID       string `json:"customer_id"`
		AuthCode         string `json:"auth_code"`
		AuthDuration     string `json:"auth_duration"`
		AuthStartDate    string `json:"auth_start_date"`
		AuthEndDate      string `json:"auth_end_date"`
		ServiceStartDate string `json:"service_start_date"`
		ServiceEndDate   string `json:"service_end_date"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if req.DeliveryType == "" || req.OrderID == "" || req.AuthType == "" ||
		req.Licensee == "" || req.CustomerName == "" || req.CustomerID == "" {
		response.BadRequest(r, "delivery_type, order_id, auth_type, licensee, customer_name, customer_id 为必填")
		return
	}

	id := fmt.Sprintf("DEL-%d", time.Now().UnixMilli())
	_, err := g.DB().Model("delivery_infos").Ctx(ctx).Data(g.Map{
		"id":                  id,
		"delivery_type":       req.DeliveryType,
		"order_id":            req.OrderID,
		"quantity":            req.Quantity,
		"auth_type":           req.AuthType,
		"licensee":            req.Licensee,
		"customer_name":       req.CustomerName,
		"customer_id":         req.CustomerID,
		"auth_code":           req.AuthCode,
		"auth_duration":       req.AuthDuration,
		"auth_start_date":     req.AuthStartDate,
		"auth_end_date":       req.AuthEndDate,
		"service_start_date":  req.ServiceStartDate,
		"service_end_date":    req.ServiceEndDate,
	}).Insert()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ := g.DB().Model("delivery_infos").Ctx(ctx).Where("id", id).One()
	response.Created(r, deliveryFromRow(row))
}

// --- Audit logs ---

func (c *Controller) AuditLogList(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	res := r.GetQuery("resource").String()
	resID := r.GetQuery("resourceId").String()
	userID := r.GetQuery("userId").String()
	action := r.GetQuery("action").String()

	m := g.DB().Model("audit_logs").Ctx(ctx)
	if res != "" {
		m = m.Where("resource", res)
	}
	if resID != "" {
		m = m.Where("resource_id", resID)
	}
	if userID != "" {
		m = m.Where("user_id", userID)
	}
	if action != "" {
		m = m.Where("action", action)
	}
	m = m.OrderDesc("created_at")

	result, err := pagination.Query(m, pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}
	logs := make([]g.Map, 0, len(result.Rows))
	for _, row := range result.Rows {
		logs = append(logs, auditLogFromRow(row))
	}
	response.Ok(r, pagination.BuildResponse("logs", logs, result.Total, pg))
}
