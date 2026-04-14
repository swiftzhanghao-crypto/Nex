package handler

import (
	"fmt"
	"time"

	"nex-backend/internal/config"
	"nex-backend/internal/middleware"
	"nex-backend/internal/rbac"

	"github.com/gin-gonic/gin"
)

func timeNow() time.Time { return time.Now() }

func RegisterFinanceRoutes(r *gin.RouterGroup) {
	g := r.Group("/finance", middleware.AuthMiddleware())

	g.GET("/contracts", rbac.CheckPermission("contract", "list"), listContracts)
	g.GET("/contracts/:id", rbac.CheckPermission("contract", "read"), getContract)
	g.POST("/contracts", rbac.CheckPermission("contract", "create"), createContract)
	g.PUT("/contracts/:id", rbac.CheckPermission("contract", "update"), updateContract)
	g.DELETE("/contracts/:id", rbac.CheckPermission("contract", "delete"), deleteContract)

	g.GET("/remittances", rbac.CheckPermission("remittance", "list"), listRemittances)
	g.GET("/remittances/:id", rbac.CheckPermission("remittance", "read"), getRemittance)
	g.POST("/remittances", rbac.CheckPermission("remittance", "create"), createRemittance)
	g.PUT("/remittances/:id", rbac.CheckPermission("remittance", "update"), updateRemittance)
	g.DELETE("/remittances/:id", rbac.CheckPermission("remittance", "delete"), deleteRemittance)

	g.GET("/invoices", rbac.CheckPermission("invoice", "list"), listInvoices)
	g.GET("/invoices/:id", rbac.CheckPermission("invoice", "read"), getInvoice)
	g.POST("/invoices", rbac.CheckPermission("invoice", "create"), createInvoice)
	g.PUT("/invoices/:id", rbac.CheckPermission("invoice", "update"), updateInvoice)
	g.DELETE("/invoices/:id", rbac.CheckPermission("invoice", "delete"), deleteInvoice)

	g.GET("/performances", rbac.CheckPermission("performance", "list"), listPerformances)
	g.GET("/performances/:id", rbac.CheckPermission("performance", "read"), getPerformance)

	g.GET("/authorizations", rbac.CheckPermission("authorization", "list"), listAuthorizations)
	g.GET("/authorizations/:id", rbac.CheckPermission("authorization", "read"), getAuthorization)
	g.POST("/authorizations", rbac.CheckPermission("authorization", "create"), createAuthorization)

	g.GET("/delivery-infos", rbac.CheckPermission("delivery", "list"), listDeliveryInfos)
	g.GET("/delivery-infos/:id", rbac.CheckPermission("delivery", "read"), getDeliveryInfo)
	g.POST("/delivery-infos", rbac.CheckPermission("delivery", "create"), createDeliveryInfo)

	g.GET("/audit-logs", rbac.CheckPermission("auditlog", "list"), listAuditLogs)
}

// ==================== Contracts ====================

func listContracts(c *gin.Context) {
	db := config.GetDB()
	status := c.Query("status")
	orderID := c.Query("orderId")
	search := c.Query("search")
	where := "1=1"
	var args []interface{}
	if status != "" { where += " AND verify_status = ?"; args = append(args, status) }
	if orderID != "" { where += " AND order_id = ?"; args = append(args, orderID) }
	if search != "" { where += " AND (name LIKE ? OR code LIKE ?)"; args = append(args, "%"+search+"%", "%"+search+"%") }

	var total int
	db.QueryRow("SELECT COUNT(*) FROM contracts WHERE "+where, args...).Scan(&total)
	limit, offset, pageNum := safePagination(c.DefaultQuery("page", "1"), c.DefaultQuery("size", "50"))
	fullArgs := append(args, limit, offset)

	rows, err := db.Query("SELECT id, code, name, COALESCE(external_code,''), contract_type, COALESCE(party_a,''), COALESCE(party_b,''), verify_status, COALESCE(verify_remark,''), COALESCE(amount,0), COALESCE(sign_date,''), COALESCE(order_id,''), COALESCE(customer_id,''), created_at FROM contracts WHERE "+where+" ORDER BY created_at DESC LIMIT ? OFFSET ?", fullArgs...)
	if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
	defer rows.Close()

	var list []gin.H
	for rows.Next() {
		var id, code, name, extCode, cType, partyA, partyB, vs, vr, signDate, oid, custID, cat string
		var amount float64
		rows.Scan(&id, &code, &name, &extCode, &cType, &partyA, &partyB, &vs, &vr, &amount, &signDate, &oid, &custID, &cat)
		list = append(list, gin.H{
			"id": id, "code": code, "name": name, "externalCode": extCode, "contractType": cType,
			"partyA": partyA, "partyB": partyB, "verifyStatus": vs, "verifyRemark": vr,
			"amount": amount, "signDate": signDate, "orderId": oid, "customerId": custID, "createdAt": cat,
		})
	}
	if list == nil { list = []gin.H{} }
	c.JSON(200, gin.H{"data": list, "total": total, "page": pageNum, "size": limit})
}

func getContract(c *gin.Context) {
	db := config.GetDB()
	var id, code, name, cType, vs, cat string
	var extCode, partyA, partyB, vr, signDate, oid, custID *string
	var amount *float64
	err := db.QueryRow("SELECT id, code, name, external_code, contract_type, party_a, party_b, verify_status, verify_remark, amount, sign_date, order_id, customer_id, created_at FROM contracts WHERE id = ?", c.Param("id")).
		Scan(&id, &code, &name, &extCode, &cType, &partyA, &partyB, &vs, &vr, &amount, &signDate, &oid, &custID, &cat)
	if err != nil { c.JSON(404, gin.H{"error": "合同不存在"}); return }
	c.JSON(200, gin.H{"id": id, "code": code, "name": name, "externalCode": extCode, "contractType": cType, "partyA": partyA, "partyB": partyB, "verifyStatus": vs, "verifyRemark": vr, "amount": amount, "signDate": signDate, "orderId": oid, "customerId": custID, "createdAt": cat})
}

func createContract(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	id := getStr(body, "id")
	if id == "" { id = generateID("CON") }

	validVS := []string{"PENDING_BUSINESS", "PENDING", "VERIFIED", "APPROVED", "REJECTED"}
	vs := getStr(body, "verifyStatus")
	if vs == "" { vs = "PENDING" }
	valid := false
	for _, v := range validVS { if v == vs { valid = true; break } }
	if !valid { c.JSON(400, gin.H{"error": fmt.Sprintf("无效的核查状态: %s", vs)}); return }

	db.Exec(`INSERT INTO contracts (id, code, name, external_code, contract_type, party_a, party_b, verify_status, verify_remark, amount, sign_date, order_id, customer_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		id, getStr(body, "code"), getStr(body, "name"), nullStr(getStr(body, "externalCode")), getStr(body, "contractType"),
		nullStr(getStr(body, "partyA")), nullStr(getStr(body, "partyB")), vs, nullStr(getStr(body, "verifyRemark")),
		body["amount"], nullStr(getStr(body, "signDate")), nullStr(getStr(body, "orderId")), nullStr(getStr(body, "customerId")),
		time.Now().Format(time.RFC3339))

	userID := middleware.GetUserID(c)
	writeAuditLog(db, userID, getUserName(db, userID), "CREATE", "Contract", id, fmt.Sprintf("创建合同 %s", getStr(body, "name")))
	c.JSON(201, gin.H{"id": id, "code": getStr(body, "code"), "name": getStr(body, "name"), "verifyStatus": vs})
}

func updateContract(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")
	var existVS string
	err := db.QueryRow("SELECT verify_status FROM contracts WHERE id = ?", id).Scan(&existVS)
	if err != nil { c.JSON(404, gin.H{"error": "合同不存在"}); return }

	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	newVS := getStr(body, "verifyStatus")
	if existVS == "APPROVED" && newVS != "APPROVED" {
		c.JSON(400, gin.H{"error": "已审批通过的合同不可回退状态"}); return
	}

	db.Exec(`UPDATE contracts SET code=?, name=?, external_code=?, contract_type=?, party_a=?, party_b=?, verify_status=?, verify_remark=?, amount=?, sign_date=?, order_id=?, customer_id=? WHERE id=?`,
		getStr(body, "code"), getStr(body, "name"), nullStr(getStr(body, "externalCode")), getStr(body, "contractType"),
		nullStr(getStr(body, "partyA")), nullStr(getStr(body, "partyB")), newVS, nullStr(getStr(body, "verifyRemark")),
		body["amount"], nullStr(getStr(body, "signDate")), nullStr(getStr(body, "orderId")), nullStr(getStr(body, "customerId")), id)

	userID := middleware.GetUserID(c)
	writeAuditLog(db, userID, getUserName(db, userID), "UPDATE", "Contract", id, fmt.Sprintf("更新合同 %s", getStr(body, "name")))
	c.JSON(200, gin.H{"ok": true})
}

func deleteContract(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")
	var vs, name string
	err := db.QueryRow("SELECT verify_status, name FROM contracts WHERE id = ?", id).Scan(&vs, &name)
	if err != nil { c.JSON(404, gin.H{"error": "合同不存在"}); return }
	if vs == "APPROVED" { c.JSON(400, gin.H{"error": "已审批通过的合同不允许删除"}); return }

	db.Exec("DELETE FROM contracts WHERE id = ?", id)
	userID := middleware.GetUserID(c)
	writeAuditLog(db, userID, getUserName(db, userID), "DELETE", "Contract", id, fmt.Sprintf("删除合同 %s", name))
	c.JSON(200, gin.H{"ok": true})
}

// ==================== Remittances ====================

func listRemittances(c *gin.Context) {
	db := config.GetDB()
	rType := c.Query("type"); search := c.Query("search")
	where := "1=1"; var args []interface{}
	if rType != "" { where += " AND type = ?"; args = append(args, rType) }
	if search != "" { where += " AND (remitter_name LIKE ? OR receiver_name LIKE ?)"; args = append(args, "%"+search+"%", "%"+search+"%") }

	var total int
	db.QueryRow("SELECT COUNT(*) FROM remittances WHERE "+where, args...).Scan(&total)
	limit, offset, pageNum := safePagination(c.DefaultQuery("page", "1"), c.DefaultQuery("size", "50"))
	fullArgs := append(args, limit, offset)

	rows, _ := db.Query("SELECT id, COALESCE(erp_doc_no,''), COALESCE(bank_transaction_no,''), type, remitter_name, COALESCE(remitter_account,''), payment_method, amount, receiver_name, COALESCE(receiver_account,''), payment_time FROM remittances WHERE "+where+" ORDER BY payment_time DESC LIMIT ? OFFSET ?", fullArgs...)
	defer rows.Close()
	var list []gin.H
	for rows.Next() {
		var id, erpNo, bankNo, rt, rn, ra, pm, recvN, recvA, pt string; var amt float64
		rows.Scan(&id, &erpNo, &bankNo, &rt, &rn, &ra, &pm, &amt, &recvN, &recvA, &pt)
		list = append(list, gin.H{"id": id, "erpDocNo": erpNo, "bankTransactionNo": bankNo, "type": rt, "remitterName": rn, "remitterAccount": ra, "paymentMethod": pm, "amount": amt, "receiverName": recvN, "receiverAccount": recvA, "paymentTime": pt})
	}
	if list == nil { list = []gin.H{} }
	c.JSON(200, gin.H{"data": list, "total": total, "page": pageNum, "size": limit})
}

func getRemittance(c *gin.Context) {
	db := config.GetDB()
	var id, rt, rn, pm, recvN, pt string; var amt float64
	var erpNo, bankNo, ra, recvA *string
	err := db.QueryRow("SELECT id, erp_doc_no, bank_transaction_no, type, remitter_name, remitter_account, payment_method, amount, receiver_name, receiver_account, payment_time FROM remittances WHERE id = ?", c.Param("id")).
		Scan(&id, &erpNo, &bankNo, &rt, &rn, &ra, &pm, &amt, &recvN, &recvA, &pt)
	if err != nil { c.JSON(404, gin.H{"error": "回款记录不存在"}); return }
	c.JSON(200, gin.H{"id": id, "erpDocNo": erpNo, "bankTransactionNo": bankNo, "type": rt, "remitterName": rn, "remitterAccount": ra, "paymentMethod": pm, "amount": amt, "receiverName": recvN, "receiverAccount": recvA, "paymentTime": pt})
}

func createRemittance(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}; c.ShouldBindJSON(&body)
	id := getStr(body, "id"); if id == "" { id = generateID("REM") }
	db.Exec(`INSERT INTO remittances (id, erp_doc_no, bank_transaction_no, type, remitter_name, remitter_account, payment_method, amount, receiver_name, receiver_account, payment_time) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
		id, nullStr(getStr(body, "erpDocNo")), nullStr(getStr(body, "bankTransactionNo")), getStr(body, "type"),
		getStr(body, "remitterName"), nullStr(getStr(body, "remitterAccount")), getStr(body, "paymentMethod"),
		getFloat(body, "amount"), getStr(body, "receiverName"), nullStr(getStr(body, "receiverAccount")), getStr(body, "paymentTime"))
	userID := middleware.GetUserID(c)
	writeAuditLog(db, userID, getUserName(db, userID), "CREATE", "Remittance", id, fmt.Sprintf("创建回款 %s ¥%.0f", getStr(body, "remitterName"), getFloat(body, "amount")))
	c.JSON(201, gin.H{"id": id})
}

func updateRemittance(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")
	var exists int; db.QueryRow("SELECT COUNT(*) FROM remittances WHERE id = ?", id).Scan(&exists)
	if exists == 0 { c.JSON(404, gin.H{"error": "回款记录不存在"}); return }
	var body map[string]interface{}; c.ShouldBindJSON(&body)
	db.Exec(`UPDATE remittances SET erp_doc_no=?, bank_transaction_no=?, type=?, remitter_name=?, remitter_account=?, payment_method=?, amount=?, receiver_name=?, receiver_account=?, payment_time=? WHERE id=?`,
		nullStr(getStr(body, "erpDocNo")), nullStr(getStr(body, "bankTransactionNo")), getStr(body, "type"),
		getStr(body, "remitterName"), nullStr(getStr(body, "remitterAccount")), getStr(body, "paymentMethod"),
		getFloat(body, "amount"), getStr(body, "receiverName"), nullStr(getStr(body, "receiverAccount")), getStr(body, "paymentTime"), id)
	userID := middleware.GetUserID(c)
	writeAuditLog(db, userID, getUserName(db, userID), "UPDATE", "Remittance", id, fmt.Sprintf("更新回款 %s", id))
	c.JSON(200, gin.H{"ok": true})
}

func deleteRemittance(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")
	result, _ := db.Exec("DELETE FROM remittances WHERE id = ?", id)
	rows, _ := result.RowsAffected()
	if rows == 0 { c.JSON(404, gin.H{"error": "回款记录不存在"}); return }
	userID := middleware.GetUserID(c)
	writeAuditLog(db, userID, getUserName(db, userID), "DELETE", "Remittance", id, fmt.Sprintf("删除回款 %s", id))
	c.JSON(200, gin.H{"ok": true})
}

// ==================== Invoices ====================

var validInvoiceStatus = []string{"PENDING", "APPROVED", "ISSUED", "REJECTED", "CANCELLED"}

func listInvoices(c *gin.Context) {
	db := config.GetDB()
	status := c.Query("status"); orderID := c.Query("orderId"); search := c.Query("search")
	where := "1=1"; var args []interface{}
	if status != "" { where += " AND status = ?"; args = append(args, status) }
	if orderID != "" { where += " AND order_id = ?"; args = append(args, orderID) }
	if search != "" { where += " AND invoice_title LIKE ?"; args = append(args, "%"+search+"%") }

	var total int; db.QueryRow("SELECT COUNT(*) FROM invoices WHERE "+where, args...).Scan(&total)
	limit, offset, pageNum := safePagination(c.DefaultQuery("page", "1"), c.DefaultQuery("size", "50"))
	fullArgs := append(args, limit, offset)
	rows, _ := db.Query("SELECT id, invoice_title, amount, apply_time, apply_type, status, COALESCE(order_id,''), COALESCE(tax_id,''), COALESCE(remark,'') FROM invoices WHERE "+where+" ORDER BY apply_time DESC LIMIT ? OFFSET ?", fullArgs...)
	defer rows.Close()
	var list []gin.H
	for rows.Next() {
		var id, title, at, aType, st, oid, taxID, remark string; var amt float64
		rows.Scan(&id, &title, &amt, &at, &aType, &st, &oid, &taxID, &remark)
		list = append(list, gin.H{"id": id, "invoiceTitle": title, "amount": amt, "applyTime": at, "applyType": aType, "status": st, "orderId": oid, "taxId": taxID, "remark": remark})
	}
	if list == nil { list = []gin.H{} }
	c.JSON(200, gin.H{"data": list, "total": total, "page": pageNum, "size": limit})
}

func getInvoice(c *gin.Context) {
	db := config.GetDB()
	var id, title, at, aType, st string; var amt float64; var oid, taxID, remark *string
	err := db.QueryRow("SELECT id, invoice_title, amount, apply_time, apply_type, status, order_id, tax_id, remark FROM invoices WHERE id = ?", c.Param("id")).
		Scan(&id, &title, &amt, &at, &aType, &st, &oid, &taxID, &remark)
	if err != nil { c.JSON(404, gin.H{"error": "发票不存在"}); return }
	c.JSON(200, gin.H{"id": id, "invoiceTitle": title, "amount": amt, "applyTime": at, "applyType": aType, "status": st, "orderId": oid, "taxId": taxID, "remark": remark})
}

func createInvoice(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}; c.ShouldBindJSON(&body)
	id := getStr(body, "id"); if id == "" { id = generateID("INV") }
	st := getStr(body, "status"); if st == "" { st = "PENDING" }
	valid := false; for _, v := range validInvoiceStatus { if v == st { valid = true; break } }
	if !valid { c.JSON(400, gin.H{"error": fmt.Sprintf("无效的发票状态: %s", st)}); return }

	at := getStr(body, "applyTime"); if at == "" { at = time.Now().Format(time.RFC3339) }
	db.Exec(`INSERT INTO invoices (id, invoice_title, amount, apply_time, apply_type, status, order_id, tax_id, remark) VALUES (?,?,?,?,?,?,?,?,?)`,
		id, getStr(body, "invoiceTitle"), getFloat(body, "amount"), at, getStr(body, "applyType"), st,
		nullStr(getStr(body, "orderId")), nullStr(getStr(body, "taxId")), nullStr(getStr(body, "remark")))
	userID := middleware.GetUserID(c)
	writeAuditLog(db, userID, getUserName(db, userID), "CREATE", "Invoice", id, fmt.Sprintf("创建发票 %s ¥%.0f", getStr(body, "invoiceTitle"), getFloat(body, "amount")))
	c.JSON(201, gin.H{"id": id})
}

func updateInvoice(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")
	var existSt string; err := db.QueryRow("SELECT status FROM invoices WHERE id = ?", id).Scan(&existSt)
	if err != nil { c.JSON(404, gin.H{"error": "发票不存在"}); return }

	var body map[string]interface{}; c.ShouldBindJSON(&body)
	newSt := getStr(body, "status")
	if existSt == "ISSUED" && newSt != "ISSUED" { c.JSON(400, gin.H{"error": "已开具的发票不可回退状态"}); return }
	if newSt != "" { valid := false; for _, v := range validInvoiceStatus { if v == newSt { valid = true; break } }; if !valid { c.JSON(400, gin.H{"error": fmt.Sprintf("无效的发票状态: %s", newSt)}); return } }

	db.Exec(`UPDATE invoices SET invoice_title=?, amount=?, apply_time=?, apply_type=?, status=?, order_id=?, tax_id=?, remark=? WHERE id=?`,
		getStr(body, "invoiceTitle"), getFloat(body, "amount"), getStr(body, "applyTime"), getStr(body, "applyType"),
		newSt, nullStr(getStr(body, "orderId")), nullStr(getStr(body, "taxId")), nullStr(getStr(body, "remark")), id)
	userID := middleware.GetUserID(c)
	writeAuditLog(db, userID, getUserName(db, userID), "UPDATE", "Invoice", id, fmt.Sprintf("更新发票 %s", id))
	c.JSON(200, gin.H{"ok": true})
}

func deleteInvoice(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")
	var st string; err := db.QueryRow("SELECT status FROM invoices WHERE id = ?", id).Scan(&st)
	if err != nil { c.JSON(404, gin.H{"error": "发票不存在"}); return }
	if st == "ISSUED" { c.JSON(400, gin.H{"error": "已开具的发票不允许删除"}); return }
	db.Exec("DELETE FROM invoices WHERE id = ?", id)
	userID := middleware.GetUserID(c)
	writeAuditLog(db, userID, getUserName(db, userID), "DELETE", "Invoice", id, fmt.Sprintf("删除发票 %s", id))
	c.JSON(200, gin.H{"ok": true})
}

// ==================== Performances ====================

func listPerformances(c *gin.Context) {
	db := config.GetDB()
	orderID := c.Query("orderId"); owner := c.Query("owner"); svcType := c.Query("serviceType"); search := c.Query("search")
	where := "1=1"; var args []interface{}
	if orderID != "" { where += " AND order_id = ?"; args = append(args, orderID) }
	if owner != "" { where += " AND owner = ?"; args = append(args, owner) }
	if svcType != "" { where += " AND service_type = ?"; args = append(args, svcType) }
	if search != "" { where += " AND (id LIKE ? OR order_id LIKE ?)"; args = append(args, "%"+search+"%", "%"+search+"%") }

	var total int; db.QueryRow("SELECT COUNT(*) FROM performances WHERE "+where, args...).Scan(&total)
	limit, offset, pageNum := safePagination(c.DefaultQuery("page", "1"), c.DefaultQuery("size", "50"))
	fullArgs := append(args, limit, offset)

	rows, _ := db.Query(`SELECT id, order_id, acceptance_detail_id, order_status, detail_amount_subtotal, acceptance_ratio,
		deferral_ratio, post_contract_status, discount, cost_amount, sales_performance, weighted_sales_performance,
		project_weight_coeff, product_weight_coeff_sub, product_weight_coeff_auth, service_type, owner
		FROM performances WHERE `+where+" ORDER BY id DESC LIMIT ? OFFSET ?", fullArgs...)
	defer rows.Close()
	var list []gin.H
	for rows.Next() {
		var id, oid, adid, os, pcs, disc, st, ow string
		var das, ar, dr, ca, sp, wsp, pwc, pwcs, pwca float64
		rows.Scan(&id, &oid, &adid, &os, &das, &ar, &dr, &pcs, &disc, &ca, &sp, &wsp, &pwc, &pwcs, &pwca, &st, &ow)
		list = append(list, gin.H{"id": id, "orderId": oid, "acceptanceDetailId": adid, "orderStatus": os,
			"detailAmountSubtotal": das, "acceptanceRatio": ar, "deferralRatio": dr,
			"postContractStatus": pcs, "discount": disc, "costAmount": ca,
			"salesPerformance": sp, "weightedSalesPerformance": wsp,
			"projectWeightCoeff": pwc, "productWeightCoeffSubscription": pwcs,
			"productWeightCoeffAuthorization": pwca, "serviceType": st, "owner": ow})
	}
	if list == nil { list = []gin.H{} }
	c.JSON(200, gin.H{"data": list, "total": total, "page": pageNum, "size": limit})
}

func getPerformance(c *gin.Context) {
	db := config.GetDB()
	var id, oid, adid, os, pcs, disc, st, ow string
	var das, ar, dr, ca, sp, wsp, pwc, pwcs, pwca float64
	err := db.QueryRow(`SELECT id, order_id, acceptance_detail_id, order_status, detail_amount_subtotal, acceptance_ratio,
		deferral_ratio, post_contract_status, discount, cost_amount, sales_performance, weighted_sales_performance,
		project_weight_coeff, product_weight_coeff_sub, product_weight_coeff_auth, service_type, owner
		FROM performances WHERE id = ?`, c.Param("id")).
		Scan(&id, &oid, &adid, &os, &das, &ar, &dr, &pcs, &disc, &ca, &sp, &wsp, &pwc, &pwcs, &pwca, &st, &ow)
	if err != nil { c.JSON(404, gin.H{"error": "业绩记录不存在"}); return }
	c.JSON(200, gin.H{"id": id, "orderId": oid, "acceptanceDetailId": adid, "orderStatus": os,
		"detailAmountSubtotal": das, "acceptanceRatio": ar, "deferralRatio": dr,
		"postContractStatus": pcs, "discount": disc, "costAmount": ca,
		"salesPerformance": sp, "weightedSalesPerformance": wsp,
		"projectWeightCoeff": pwc, "productWeightCoeffSubscription": pwcs,
		"productWeightCoeffAuthorization": pwca, "serviceType": st, "owner": ow})
}

// ==================== Authorizations ====================

func listAuthorizations(c *gin.Context) {
	db := config.GetDB()
	custID := c.Query("customerId"); orderID := c.Query("orderId"); search := c.Query("search")
	where := "1=1"; var args []interface{}
	if custID != "" { where += " AND customer_id = ?"; args = append(args, custID) }
	if orderID != "" { where += " AND order_id = ?"; args = append(args, orderID) }
	if search != "" { where += " AND (customer_name LIKE ? OR product_name LIKE ? OR licensee LIKE ?)"; args = append(args, "%"+search+"%", "%"+search+"%", "%"+search+"%") }

	var total int; db.QueryRow("SELECT COUNT(*) FROM authorizations WHERE "+where, args...).Scan(&total)
	limit, offset, pageNum := safePagination(c.DefaultQuery("page", "1"), c.DefaultQuery("size", "50"))
	fullArgs := append(args, limit, offset)
	rows, _ := db.Query("SELECT id, auth_code, order_id, licensee, customer_name, customer_id, product_name, product_code, auth_start_date, auth_end_date, COALESCE(service_start_date,''), COALESCE(service_end_date,'') FROM authorizations WHERE "+where+" ORDER BY auth_start_date DESC LIMIT ? OFFSET ?", fullArgs...)
	defer rows.Close()
	var list []gin.H
	for rows.Next() {
		var id, ac, oid, lic, cn, ci, pn, pc, asd, aed, ssd, sed string
		rows.Scan(&id, &ac, &oid, &lic, &cn, &ci, &pn, &pc, &asd, &aed, &ssd, &sed)
		list = append(list, gin.H{"id": id, "authCode": ac, "orderId": oid, "licensee": lic, "customerName": cn, "customerId": ci, "productName": pn, "productCode": pc, "authStartDate": asd, "authEndDate": aed, "serviceStartDate": ssd, "serviceEndDate": sed})
	}
	if list == nil { list = []gin.H{} }
	c.JSON(200, gin.H{"data": list, "total": total, "page": pageNum, "size": limit})
}

func getAuthorization(c *gin.Context) {
	db := config.GetDB()
	var id, ac, oid, lic, cn, ci, pn, pc, asd, aed string
	var ssd, sed *string
	err := db.QueryRow("SELECT id, auth_code, order_id, licensee, customer_name, customer_id, product_name, product_code, auth_start_date, auth_end_date, service_start_date, service_end_date FROM authorizations WHERE id = ?", c.Param("id")).
		Scan(&id, &ac, &oid, &lic, &cn, &ci, &pn, &pc, &asd, &aed, &ssd, &sed)
	if err != nil { c.JSON(404, gin.H{"error": "授权记录不存在"}); return }
	c.JSON(200, gin.H{"id": id, "authCode": ac, "orderId": oid, "licensee": lic, "customerName": cn, "customerId": ci, "productName": pn, "productCode": pc, "authStartDate": asd, "authEndDate": aed, "serviceStartDate": ssd, "serviceEndDate": sed})
}

func createAuthorization(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}; c.ShouldBindJSON(&body)
	id := getStr(body, "id"); if id == "" { id = generateID("AUTH") }
	db.Exec(`INSERT INTO authorizations (id, auth_code, order_id, licensee, customer_name, customer_id, product_name, product_code, auth_start_date, auth_end_date, service_start_date, service_end_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
		id, getStr(body, "authCode"), getStr(body, "orderId"), getStr(body, "licensee"), getStr(body, "customerName"),
		getStr(body, "customerId"), getStr(body, "productName"), getStr(body, "productCode"),
		getStr(body, "authStartDate"), getStr(body, "authEndDate"),
		nullStr(getStr(body, "serviceStartDate")), nullStr(getStr(body, "serviceEndDate")))
	userID := middleware.GetUserID(c)
	writeAuditLog(db, userID, getUserName(db, userID), "CREATE", "Authorization", id, fmt.Sprintf("创建授权 %s - %s", getStr(body, "licensee"), getStr(body, "productName")))
	c.JSON(201, gin.H{"id": id})
}

// ==================== Delivery Infos ====================

func listDeliveryInfos(c *gin.Context) {
	db := config.GetDB()
	custID := c.Query("customerId"); orderID := c.Query("orderId"); dType := c.Query("deliveryType"); search := c.Query("search")
	where := "1=1"; var args []interface{}
	if custID != "" { where += " AND customer_id = ?"; args = append(args, custID) }
	if orderID != "" { where += " AND order_id = ?"; args = append(args, orderID) }
	if dType != "" { where += " AND delivery_type = ?"; args = append(args, dType) }
	if search != "" { where += " AND (customer_name LIKE ? OR licensee LIKE ?)"; args = append(args, "%"+search+"%", "%"+search+"%") }

	var total int; db.QueryRow("SELECT COUNT(*) FROM delivery_infos WHERE "+where, args...).Scan(&total)
	limit, offset, pageNum := safePagination(c.DefaultQuery("page", "1"), c.DefaultQuery("size", "50"))
	fullArgs := append(args, limit, offset)
	rows, _ := db.Query("SELECT id, delivery_type, order_id, quantity, auth_type, licensee, customer_name, customer_id, COALESCE(auth_code,''), COALESCE(auth_duration,''), COALESCE(auth_start_date,''), COALESCE(auth_end_date,''), COALESCE(service_start_date,''), COALESCE(service_end_date,'') FROM delivery_infos WHERE "+where+" ORDER BY id DESC LIMIT ? OFFSET ?", fullArgs...)
	defer rows.Close()
	var list []gin.H
	for rows.Next() {
		var id, dt, oid, at, lic, cn, ci, ac, ad, asd, aed, ssd, sed string; var qty int
		rows.Scan(&id, &dt, &oid, &qty, &at, &lic, &cn, &ci, &ac, &ad, &asd, &aed, &ssd, &sed)
		list = append(list, gin.H{"id": id, "deliveryType": dt, "orderId": oid, "quantity": qty, "authType": at, "licensee": lic, "customerName": cn, "customerId": ci, "authCode": ac, "authDuration": ad, "authStartDate": asd, "authEndDate": aed, "serviceStartDate": ssd, "serviceEndDate": sed})
	}
	if list == nil { list = []gin.H{} }
	c.JSON(200, gin.H{"data": list, "total": total, "page": pageNum, "size": limit})
}

func getDeliveryInfo(c *gin.Context) {
	db := config.GetDB()
	var id, dt, oid, at, lic, cn, ci string; var qty int
	var ac, ad, asd, aed, ssd, sed *string
	err := db.QueryRow("SELECT id, delivery_type, order_id, quantity, auth_type, licensee, customer_name, customer_id, auth_code, auth_duration, auth_start_date, auth_end_date, service_start_date, service_end_date FROM delivery_infos WHERE id = ?", c.Param("id")).
		Scan(&id, &dt, &oid, &qty, &at, &lic, &cn, &ci, &ac, &ad, &asd, &aed, &ssd, &sed)
	if err != nil { c.JSON(404, gin.H{"error": "交付信息不存在"}); return }
	c.JSON(200, gin.H{"id": id, "deliveryType": dt, "orderId": oid, "quantity": qty, "authType": at, "licensee": lic, "customerName": cn, "customerId": ci, "authCode": ac, "authDuration": ad, "authStartDate": asd, "authEndDate": aed, "serviceStartDate": ssd, "serviceEndDate": sed})
}

func createDeliveryInfo(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}; c.ShouldBindJSON(&body)
	id := getStr(body, "id"); if id == "" { id = generateID("DLV") }
	db.Exec(`INSERT INTO delivery_infos (id, delivery_type, order_id, quantity, auth_type, licensee, customer_name, customer_id, auth_code, auth_duration, auth_start_date, auth_end_date, service_start_date, service_end_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		id, getStr(body, "deliveryType"), getStr(body, "orderId"), getInt(body, "quantity"),
		getStr(body, "authType"), getStr(body, "licensee"), getStr(body, "customerName"), getStr(body, "customerId"),
		nullStr(getStr(body, "authCode")), nullStr(getStr(body, "authDuration")),
		nullStr(getStr(body, "authStartDate")), nullStr(getStr(body, "authEndDate")),
		nullStr(getStr(body, "serviceStartDate")), nullStr(getStr(body, "serviceEndDate")))
	userID := middleware.GetUserID(c)
	writeAuditLog(db, userID, getUserName(db, userID), "CREATE", "DeliveryInfo", id, fmt.Sprintf("创建交付信息 %s", getStr(body, "licensee")))
	c.JSON(201, gin.H{"id": id})
}

// ==================== Audit Logs ====================

func listAuditLogs(c *gin.Context) {
	db := config.GetDB()
	resource := c.Query("resource"); resID := c.Query("resourceId"); userID := c.Query("userId"); action := c.Query("action")
	where := "1=1"; var args []interface{}
	if resource != "" { where += " AND resource = ?"; args = append(args, resource) }
	if resID != "" { where += " AND resource_id = ?"; args = append(args, resID) }
	if userID != "" { where += " AND user_id = ?"; args = append(args, userID) }
	if action != "" { where += " AND action = ?"; args = append(args, action) }

	var total int; db.QueryRow("SELECT COUNT(*) FROM audit_logs WHERE "+where, args...).Scan(&total)
	limit, offset, pageNum := safePagination(c.DefaultQuery("page", "1"), c.DefaultQuery("size", "50"))
	fullArgs := append(args, limit, offset)
	rows, _ := db.Query("SELECT id, user_id, user_name, action, resource, resource_id, COALESCE(detail,''), created_at FROM audit_logs WHERE "+where+" ORDER BY created_at DESC LIMIT ? OFFSET ?", fullArgs...)
	defer rows.Close()
	var list []gin.H
	for rows.Next() {
		var id int; var uid, un, act, res, rid, detail, cat string
		rows.Scan(&id, &uid, &un, &act, &res, &rid, &detail, &cat)
		list = append(list, gin.H{"id": id, "userId": uid, "userName": un, "action": act, "resource": res, "resourceId": rid, "detail": detail, "createdAt": cat})
	}
	if list == nil { list = []gin.H{} }
	c.JSON(200, gin.H{"data": list, "total": total, "page": pageNum, "size": limit})
}
