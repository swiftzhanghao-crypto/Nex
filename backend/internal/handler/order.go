package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"nex-backend/internal/config"
	"nex-backend/internal/middleware"
	"nex-backend/internal/rbac"

	"github.com/gin-gonic/gin"
)

var orderStatusTransitions = map[string][]string{
	"DRAFT":            {"PENDING_APPROVAL", "CANCELLED"},
	"PENDING_APPROVAL": {"APPROVED", "REJECTED", "CANCELLED"},
	"APPROVED":         {"PROCESSING", "CANCELLED"},
	"REJECTED":         {"PENDING_APPROVAL", "CANCELLED"},
	"PROCESSING":       {"SHIPPED", "COMPLETED", "CANCELLED"},
	"SHIPPED":          {"COMPLETED"},
	"COMPLETED":        {"REFUND_REQUESTED"},
	"REFUND_REQUESTED": {"REFUNDING", "COMPLETED"},
	"REFUNDING":        {"REFUNDED", "COMPLETED"},
	"REFUNDED":         {},
	"CANCELLED":        {},
}

func RegisterOrderRoutes(r *gin.RouterGroup) {
	g := r.Group("/orders", middleware.AuthMiddleware())
	g.GET("/", rbac.CheckPermission("order", "list"), listOrders)
	g.GET("/:id", rbac.CheckPermission("order", "read"), getOrder)
	g.POST("/", rbac.CheckPermission("order", "create"), createOrder)
	g.PUT("/:id", rbac.CheckPermission("order", "update"), updateOrder)
	g.DELETE("/:id", rbac.CheckPermission("order", "delete"), deleteOrder)
	g.POST("/:id/approve", rbac.CheckPermission("order", "approve"), approveOrder)
	g.POST("/:id/submit", rbac.CheckPermission("order", "submit"), submitOrder)
	g.GET("/:id/logs", orderLogs)
}

func scanOrder(db interface{ QueryRow(string, ...any) *interface{} }) {
}

func toOrderMap(row map[string]string) gin.H {
	extra := parseJSONMap(row["extra"])
	result := gin.H{
		"id": row["id"], "customerId": row["customer_id"], "customerName": row["customer_name"],
		"customerType": row["customer_type"], "customerLevel": row["customer_level"],
		"customerIndustry": row["customer_industry"], "customerRegion": row["customer_region"],
		"date": row["date"], "status": row["status"],
		"items": parseJSONArray(row["items"]), "source": row["source"],
		"buyerType": row["buyer_type"], "buyerName": row["buyer_name"], "buyerId": row["buyer_id"],
		"shippingAddress": row["shipping_address"], "deliveryMethod": row["delivery_method"],
		"isPaid": row["is_paid"] == "1", "paymentDate": row["payment_date"],
		"paymentMethod": row["payment_method"], "paymentTerms": row["payment_terms"],
		"approval": parseJSONMap(row["approval"]), "approvalRecords": parseJSONArray(row["approval_records"]),
		"salesRepId": row["sales_rep_id"], "salesRepName": row["sales_rep_name"],
		"businessManagerId": row["biz_manager_id"], "businessManagerName": row["biz_manager_name"],
		"opportunityId": row["opportunity_id"], "opportunityName": row["opportunity_name"],
		"originalOrderId": row["original_order_id"],
		"refundReason": row["refund_reason"],
	}

	if t, err := parseFloat64(row["total"]); err == nil {
		result["total"] = t
	}
	if ra, err := parseFloat64(row["refund_amount"]); err == nil {
		result["refundAmount"] = ra
	}
	if row["payment_record"] != "" {
		result["paymentRecord"] = parseJSON(row["payment_record"])
	}
	if row["invoice_info"] != "" {
		result["invoiceInfo"] = parseJSON(row["invoice_info"])
	}
	if row["acceptance_info"] != "" {
		result["acceptanceInfo"] = parseJSON(row["acceptance_info"])
	}
	if row["acceptance_config"] != "" {
		result["acceptanceConfig"] = parseJSON(row["acceptance_config"])
	}

	for k, v := range extra {
		result[k] = v
	}
	return result
}

func parseFloat64(s string) (float64, error) {
	if s == "" {
		return 0, nil
	}
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	return f, err
}

func queryOrderByID(id string) (gin.H, bool) {
	db := config.GetDB()
	row := db.QueryRow(`SELECT id, customer_id, customer_name, COALESCE(customer_type,''), COALESCE(customer_level,''),
		COALESCE(customer_industry,''), COALESCE(customer_region,''), date, status, total, items, source,
		buyer_type, COALESCE(buyer_name,''), COALESCE(buyer_id,''), COALESCE(shipping_address,''),
		COALESCE(delivery_method,''), is_paid, COALESCE(payment_date,''), COALESCE(payment_method,''),
		COALESCE(payment_terms,''), COALESCE(payment_record,''), approval, approval_records,
		COALESCE(sales_rep_id,''), COALESCE(sales_rep_name,''), COALESCE(biz_manager_id,''),
		COALESCE(biz_manager_name,''), COALESCE(invoice_info,''), COALESCE(acceptance_info,''),
		COALESCE(acceptance_config,''), COALESCE(opportunity_id,''), COALESCE(opportunity_name,''),
		COALESCE(original_order_id,''), COALESCE(refund_reason,''), COALESCE(refund_amount,0), extra
		FROM orders WHERE id = ?`, id)

	var oid, custID, custName, custType, custLevel, custInd, custRegion, date, status string
	var total, refundAmt float64
	var items, source, buyerType, buyerName, buyerID, shipAddr, delMethod string
	var isPaid int
	var payDate, payMethod, payTerms, payRecord string
	var approval, approvalRecords string
	var salesRepID, salesRepName, bizMgrID, bizMgrName string
	var invoiceInfo, acceptInfo, acceptConfig string
	var oppID, oppName, origOrderID, refundReason string
	var extra string

	err := row.Scan(&oid, &custID, &custName, &custType, &custLevel, &custInd, &custRegion,
		&date, &status, &total, &items, &source, &buyerType, &buyerName, &buyerID,
		&shipAddr, &delMethod, &isPaid, &payDate, &payMethod, &payTerms, &payRecord,
		&approval, &approvalRecords, &salesRepID, &salesRepName, &bizMgrID, &bizMgrName,
		&invoiceInfo, &acceptInfo, &acceptConfig, &oppID, &oppName, &origOrderID,
		&refundReason, &refundAmt, &extra)

	if err != nil {
		return nil, false
	}

	m := map[string]string{
		"id": oid, "customer_id": custID, "customer_name": custName,
		"customer_type": custType, "customer_level": custLevel,
		"customer_industry": custInd, "customer_region": custRegion,
		"date": date, "status": status, "items": items, "source": source,
		"buyer_type": buyerType, "buyer_name": buyerName, "buyer_id": buyerID,
		"shipping_address": shipAddr, "delivery_method": delMethod,
		"is_paid": fmt.Sprintf("%d", isPaid), "payment_date": payDate,
		"payment_method": payMethod, "payment_terms": payTerms, "payment_record": payRecord,
		"approval": approval, "approval_records": approvalRecords,
		"sales_rep_id": salesRepID, "sales_rep_name": salesRepName,
		"biz_manager_id": bizMgrID, "biz_manager_name": bizMgrName,
		"invoice_info": invoiceInfo, "acceptance_info": acceptInfo, "acceptance_config": acceptConfig,
		"opportunity_id": oppID, "opportunity_name": oppName, "original_order_id": origOrderID,
		"refund_reason": refundReason, "extra": extra,
	}
	result := toOrderMap(m)
	result["total"] = total
	result["refundAmount"] = refundAmt
	return result, true
}

func listOrders(c *gin.Context) {
	db := config.GetDB()
	status := c.Query("status")
	custID := c.Query("customerId")
	source := c.Query("source")

	where := "1=1"
	var args []interface{}
	if status != "" {
		where += " AND status = ?"
		args = append(args, status)
	}
	if custID != "" {
		where += " AND customer_id = ?"
		args = append(args, custID)
	}
	if source != "" {
		where += " AND source = ?"
		args = append(args, source)
	}

	var total int
	db.QueryRow("SELECT COUNT(*) FROM orders WHERE "+where, args...).Scan(&total)

	limit, offset, pageNum := safePagination(c.DefaultQuery("page", "1"), c.DefaultQuery("size", "50"))
	fullArgs := append(args, limit, offset)

	rows, err := db.Query("SELECT id FROM orders WHERE "+where+" ORDER BY date DESC LIMIT ? OFFSET ?", fullArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var orders []gin.H
	for rows.Next() {
		var id string
		rows.Scan(&id)
		if o, ok := queryOrderByID(id); ok {
			orders = append(orders, o)
		}
	}
	if orders == nil {
		orders = []gin.H{}
	}
	c.JSON(http.StatusOK, gin.H{"data": orders, "total": total, "page": pageNum, "size": limit})
}

func getOrder(c *gin.Context) {
	o, ok := queryOrderByID(c.Param("id"))
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "订单不存在"})
		return
	}
	c.JSON(http.StatusOK, o)
}

func createOrder(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	id := getStr(body, "id")
	if id == "" {
		id = generateID("ORD")
	}

	extraMap := map[string]interface{}{
		"receivingParty": body["receivingParty"], "receivingCompany": body["receivingCompany"],
		"receivingMethod": body["receivingMethod"], "directChannel": body["directChannel"],
		"terminalChannel": body["terminalChannel"], "orderType": body["orderType"],
		"creatorId": body["creatorId"], "creatorName": body["creatorName"], "creatorPhone": body["creatorPhone"],
		"industryLine": body["industryLine"], "province": body["province"],
		"city": body["city"], "district": body["district"],
	}
	extra, _ := json.Marshal(extraMap)

	approvalJSON, _ := json.Marshal(getMap(body, "approval"))
	if string(approvalJSON) == "{}" || string(approvalJSON) == "null" {
		approvalJSON = []byte(`{"salesApproved":false,"businessApproved":false,"financeApproved":false}`)
	}
	recordsJSON, _ := json.Marshal(getArr(body, "approvalRecords"))
	itemsJSON, _ := json.Marshal(getArr(body, "items"))

	invoiceInfo := ""
	if v := body["invoiceInfo"]; v != nil {
		b, _ := json.Marshal(v)
		invoiceInfo = string(b)
	}
	acceptInfo := ""
	if v := body["acceptanceInfo"]; v != nil {
		b, _ := json.Marshal(v)
		acceptInfo = string(b)
	}
	acceptConfig := ""
	if v := body["acceptanceConfig"]; v != nil {
		b, _ := json.Marshal(v)
		acceptConfig = string(b)
	}

	dateStr := getStr(body, "date")
	if dateStr == "" {
		dateStr = fmt.Sprintf("%s", "now")
	}
	statusStr := getStr(body, "status")
	if statusStr == "" {
		statusStr = "PENDING_APPROVAL"
	}

	_, err := db.Exec(`INSERT INTO orders (id, customer_id, customer_name, customer_type, customer_level, customer_industry, customer_region,
		date, status, total, items, source, buyer_type, buyer_name, buyer_id, shipping_address, delivery_method,
		is_paid, payment_method, payment_terms, approval, approval_records, sales_rep_id, sales_rep_name,
		biz_manager_id, biz_manager_name, invoice_info, acceptance_info, acceptance_config,
		opportunity_id, opportunity_name, original_order_id, extra)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		id, getStr(body, "customerId"), getStr(body, "customerName"),
		nullStr(getStr(body, "customerType")), nullStr(getStr(body, "customerLevel")),
		nullStr(getStr(body, "customerIndustry")), nullStr(getStr(body, "customerRegion")),
		dateStr, statusStr, getFloat(body, "total"),
		string(itemsJSON), getStr(body, "source"),
		getStr(body, "buyerType"), nullStr(getStr(body, "buyerName")), nullStr(getStr(body, "buyerId")),
		nullStr(getStr(body, "shippingAddress")), nullStr(getStr(body, "deliveryMethod")),
		0, nullStr(getStr(body, "paymentMethod")), nullStr(getStr(body, "paymentTerms")),
		string(approvalJSON), string(recordsJSON),
		nullStr(getStr(body, "salesRepId")), nullStr(getStr(body, "salesRepName")),
		nullStr(getStr(body, "businessManagerId")), nullStr(getStr(body, "businessManagerName")),
		nullStr(invoiceInfo), nullStr(acceptInfo), nullStr(acceptConfig),
		nullStr(getStr(body, "opportunityId")), nullStr(getStr(body, "opportunityName")),
		nullStr(getStr(body, "originalOrderId")), string(extra))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "CREATE", "Order", id, fmt.Sprintf("创建订单 %s", id))

	o, _ := queryOrderByID(id)
	c.JSON(http.StatusCreated, o)
}

func updateOrder(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")

	var existStatus, existSalesRepID string
	err := db.QueryRow("SELECT status, COALESCE(sales_rep_id,'') FROM orders WHERE id = ?", id).Scan(&existStatus, &existSalesRepID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "订单不存在"})
		return
	}

	userID := middleware.GetUserID(c)
	userRole := middleware.GetUserRole(c)
	isAdmin := userRole == "Admin"
	isOwner := existSalesRepID == userID
	isManager := userRole == "Business" || userRole == "Finance" || userRole == "Commerce"
	if !isAdmin && !isOwner && !isManager {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权修改此订单"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	newStatus := getStr(body, "status")
	if newStatus != "" && newStatus != existStatus {
		allowed := orderStatusTransitions[existStatus]
		valid := false
		for _, s := range allowed {
			if s == newStatus {
				valid = true
				break
			}
		}
		if !valid {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("状态流转不合法: %s → %s", existStatus, newStatus)})
			return
		}
	}

	extraMap := map[string]interface{}{
		"receivingParty": body["receivingParty"], "receivingCompany": body["receivingCompany"],
		"receivingMethod": body["receivingMethod"], "directChannel": body["directChannel"],
		"terminalChannel": body["terminalChannel"], "orderType": body["orderType"],
		"creatorId": body["creatorId"], "creatorName": body["creatorName"], "creatorPhone": body["creatorPhone"],
		"industryLine": body["industryLine"], "province": body["province"],
		"city": body["city"], "district": body["district"],
		"isAuthConfirmed": body["isAuthConfirmed"], "authConfirmedDate": body["authConfirmedDate"],
		"isPackageConfirmed": body["isPackageConfirmed"], "packageConfirmedDate": body["packageConfirmedDate"],
		"isShippingConfirmed": body["isShippingConfirmed"], "shippingConfirmedDate": body["shippingConfirmedDate"],
		"isCDBurned": body["isCDBurned"], "cdBurnedDate": body["cdBurnedDate"],
		"shippedDate": body["shippedDate"], "carrier": body["carrier"], "trackingNumber": body["trackingNumber"],
	}
	extra, _ := json.Marshal(extraMap)
	approvalJSON, _ := json.Marshal(getMap(body, "approval"))
	recordsJSON, _ := json.Marshal(getArr(body, "approvalRecords"))
	itemsJSON, _ := json.Marshal(getArr(body, "items"))

	payRecordStr := ""
	if v := body["paymentRecord"]; v != nil {
		b, _ := json.Marshal(v)
		payRecordStr = string(b)
	}
	invoiceInfoStr := ""
	if v := body["invoiceInfo"]; v != nil {
		b, _ := json.Marshal(v)
		invoiceInfoStr = string(b)
	}
	acceptInfoStr := ""
	if v := body["acceptanceInfo"]; v != nil {
		b, _ := json.Marshal(v)
		acceptInfoStr = string(b)
	}
	acceptConfigStr := ""
	if v := body["acceptanceConfig"]; v != nil {
		b, _ := json.Marshal(v)
		acceptConfigStr = string(b)
	}

	isPaid := 0
	if getBool(body, "isPaid") {
		isPaid = 1
	}

	db.Exec(`UPDATE orders SET customer_id=?, customer_name=?, status=?, total=?, items=?,
		source=?, buyer_type=?, shipping_address=?, delivery_method=?,
		is_paid=?, payment_date=?, payment_method=?, payment_terms=?, payment_record=?,
		approval=?, approval_records=?, sales_rep_id=?, sales_rep_name=?,
		biz_manager_id=?, biz_manager_name=?, invoice_info=?, acceptance_info=?,
		acceptance_config=?, refund_reason=?, refund_amount=?, extra=?, updated_at=datetime('now')
		WHERE id=?`,
		getStr(body, "customerId"), getStr(body, "customerName"), getStr(body, "status"),
		getFloat(body, "total"), string(itemsJSON), getStr(body, "source"),
		getStr(body, "buyerType"), nullStr(getStr(body, "shippingAddress")),
		nullStr(getStr(body, "deliveryMethod")), isPaid,
		nullStr(getStr(body, "paymentDate")), nullStr(getStr(body, "paymentMethod")),
		nullStr(getStr(body, "paymentTerms")), nullStr(payRecordStr),
		string(approvalJSON), string(recordsJSON),
		nullStr(getStr(body, "salesRepId")), nullStr(getStr(body, "salesRepName")),
		nullStr(getStr(body, "businessManagerId")), nullStr(getStr(body, "businessManagerName")),
		nullStr(invoiceInfoStr), nullStr(acceptInfoStr), nullStr(acceptConfigStr),
		nullStr(getStr(body, "refundReason")), body["refundAmount"],
		string(extra), id)

	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "UPDATE", "Order", id, fmt.Sprintf("更新订单 %s，状态: %s", id, newStatus))

	o, _ := queryOrderByID(id)
	c.JSON(http.StatusOK, o)
}

func approveOrder(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")

	var existStatus, approvalStr, recordsStr string
	err := db.QueryRow("SELECT status, approval, approval_records FROM orders WHERE id = ?", id).
		Scan(&existStatus, &approvalStr, &recordsStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "订单不存在"})
		return
	}
	if existStatus != "PENDING_APPROVAL" {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("当前状态 %s 不允许审批操作", existStatus)})
		return
	}

	var body struct {
		Action string `json:"action"`
		Remark string `json:"remark"`
	}
	c.ShouldBindJSON(&body)

	approval := parseJSONMap(approvalStr)
	records := parseJSONArray(recordsStr)

	userID := middleware.GetUserID(c)
	roleKey := middleware.GetUserRole(c)

	fieldMap := map[string]string{
		"Sales": "salesApproved", "Business": "businessApproved", "Commerce": "businessApproved",
		"Finance": "financeApproved", "Admin": "financeApproved",
	}
	field, ok := fieldMap[roleKey]
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "当前角色无审批字段映射"})
		return
	}

	if body.Action == "approve" {
		approval[field] = true
	}

	records = append(records, map[string]interface{}{
		"userId": userID, "role": roleKey, "action": body.Action,
		"remark": body.Remark, "timestamp": fmt.Sprintf("%s", "now"),
	})

	newStatus := "PENDING_APPROVAL"
	if body.Action == "reject" {
		newStatus = "REJECTED"
	} else {
		sa, _ := approval["salesApproved"].(bool)
		ba, _ := approval["businessApproved"].(bool)
		fa, _ := approval["financeApproved"].(bool)
		if sa && ba && fa {
			newStatus = "APPROVED"
		}
	}

	approvalJSON, _ := json.Marshal(approval)
	recordsJSON, _ := json.Marshal(records)

	db.Exec("UPDATE orders SET status=?, approval=?, approval_records=?, updated_at=datetime('now') WHERE id=?",
		newStatus, string(approvalJSON), string(recordsJSON), id)

	userName := getUserName(db, userID)
	actionLabel := "审批通过"
	if body.Action != "approve" {
		actionLabel = "驳回"
	}
	detail := fmt.Sprintf("%s订单 %s", actionLabel, id)
	if body.Remark != "" {
		detail += "，备注: " + body.Remark
	}
	writeAuditLog(db, userID, userName, body.Action, "Order", id, detail)

	o, _ := queryOrderByID(id)
	c.JSON(http.StatusOK, o)
}

func submitOrder(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")

	var existStatus string
	err := db.QueryRow("SELECT status FROM orders WHERE id = ?", id).Scan(&existStatus)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "订单不存在"})
		return
	}
	if existStatus != "DRAFT" && existStatus != "REJECTED" {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("当前状态 %s 不允许提交审批", existStatus)})
		return
	}

	approval := `{"salesApproved":false,"businessApproved":false,"financeApproved":false}`
	db.Exec("UPDATE orders SET status='PENDING_APPROVAL', approval=?, updated_at=datetime('now') WHERE id=?", approval, id)

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "SUBMIT", "Order", id, fmt.Sprintf("提交订单 %s 至审批", id))

	o, _ := queryOrderByID(id)
	c.JSON(http.StatusOK, o)
}

func deleteOrder(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")

	var existStatus, salesRepID string
	err := db.QueryRow("SELECT status, COALESCE(sales_rep_id,'') FROM orders WHERE id = ?", id).Scan(&existStatus, &salesRepID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "订单不存在"})
		return
	}

	userID := middleware.GetUserID(c)
	userRole := middleware.GetUserRole(c)
	isAdmin := userRole == "Admin"
	isOwner := salesRepID == userID

	if !isAdmin && !isOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "只有管理员或订单归属销售可以删除订单"})
		return
	}
	if existStatus != "DRAFT" && existStatus != "CANCELLED" && !isAdmin {
		c.JSON(http.StatusBadRequest, gin.H{"error": "只有草稿或已取消的订单可以被删除"})
		return
	}

	db.Exec("DELETE FROM orders WHERE id = ?", id)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "DELETE", "Order", id, fmt.Sprintf("删除订单 %s", id))

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func orderLogs(c *gin.Context) {
	db := config.GetDB()
	rows, err := db.Query("SELECT id, user_id, user_name, action, detail, created_at FROM audit_logs WHERE resource='Order' AND resource_id=? ORDER BY created_at DESC", c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var logs []gin.H
	for rows.Next() {
		var lid int
		var uid, uname, action, detail, cat string
		rows.Scan(&lid, &uid, &uname, &action, &detail, &cat)
		logs = append(logs, gin.H{"id": lid, "userId": uid, "userName": uname, "action": action, "detail": detail, "createdAt": cat})
	}
	if logs == nil {
		logs = []gin.H{}
	}
	c.JSON(http.StatusOK, logs)
}
