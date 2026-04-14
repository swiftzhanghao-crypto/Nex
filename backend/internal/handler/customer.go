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

func RegisterCustomerRoutes(r *gin.RouterGroup) {
	g := r.Group("/customers", middleware.AuthMiddleware())
	g.GET("/", rbac.CheckPermission("customer", "list"), listCustomers)
	g.GET("/:id", rbac.CheckPermission("customer", "read"), getCustomer)
	g.POST("/", rbac.CheckPermission("customer", "create"), createCustomer)
	g.PUT("/:id", rbac.CheckPermission("customer", "update"), updateCustomer)
	g.DELETE("/:id", rbac.CheckPermission("customer", "delete"), deleteCustomer)
}

func scanCustomer(id string) (gin.H, bool) {
	db := config.GetDB()
	var cid, companyName, industry, custType, level, region, address, shipAddr, status string
	var contacts, enterprises string
	var logo, billingInfo, ownerID, ownerName, nextFollowUp *string

	err := db.QueryRow(`SELECT id, company_name, industry, customer_type, level, region, address,
		shipping_address, status, logo, contacts, billing_info, owner_id, owner_name, enterprises, next_follow_up
		FROM customers WHERE id = ?`, id).
		Scan(&cid, &companyName, &industry, &custType, &level, &region, &address,
			&shipAddr, &status, &logo, &contacts, &billingInfo, &ownerID, &ownerName, &enterprises, &nextFollowUp)
	if err != nil {
		return nil, false
	}

	result := gin.H{
		"id": cid, "companyName": companyName, "industry": industry,
		"customerType": custType, "level": level, "region": region,
		"address": address, "shippingAddress": shipAddr, "status": status,
		"logo": logo, "contacts": parseJSONArray(contacts),
		"ownerId": ownerID, "ownerName": ownerName,
		"enterprises": parseJSONArray(enterprises), "nextFollowUpDate": nextFollowUp,
	}
	if billingInfo != nil && *billingInfo != "" {
		result["billingInfo"] = parseJSON(*billingInfo)
	}
	return result, true
}

func listCustomers(c *gin.Context) {
	db := config.GetDB()
	cType := c.Query("type")
	level := c.Query("level")
	status := c.Query("status")
	search := c.Query("search")

	where := "1=1"
	var args []interface{}
	if cType != "" {
		where += " AND customer_type = ?"
		args = append(args, cType)
	}
	if level != "" {
		where += " AND level = ?"
		args = append(args, level)
	}
	if status != "" {
		where += " AND status = ?"
		args = append(args, status)
	}
	if search != "" {
		where += " AND company_name LIKE ?"
		args = append(args, "%"+search+"%")
	}

	var total int
	db.QueryRow("SELECT COUNT(*) FROM customers WHERE "+where, args...).Scan(&total)

	limit, offset, pageNum := safePagination(c.DefaultQuery("page", "1"), c.DefaultQuery("size", "50"))
	fullArgs := append(args, limit, offset)

	rows, err := db.Query("SELECT id FROM customers WHERE "+where+" ORDER BY company_name LIMIT ? OFFSET ?", fullArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var customers []gin.H
	for rows.Next() {
		var id string
		rows.Scan(&id)
		if cust, ok := scanCustomer(id); ok {
			customers = append(customers, cust)
		}
	}
	if customers == nil {
		customers = []gin.H{}
	}
	c.JSON(http.StatusOK, gin.H{"data": customers, "total": total, "page": pageNum, "size": limit})
}

func getCustomer(c *gin.Context) {
	cust, ok := scanCustomer(c.Param("id"))
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "客户不存在"})
		return
	}
	c.JSON(http.StatusOK, cust)
}

func createCustomer(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	id := getStr(body, "id")
	if id == "" {
		id = fmt.Sprintf("C%d", mustTime()%100000000)
	}

	contactsJSON, _ := json.Marshal(getArr(body, "contacts"))
	enterprisesJSON, _ := json.Marshal(getArr(body, "enterprises"))
	billingInfoStr := ""
	if v := body["billingInfo"]; v != nil {
		b, _ := json.Marshal(v)
		billingInfoStr = string(b)
	}

	_, err := db.Exec(`INSERT INTO customers (id, company_name, industry, customer_type, level, region, address, shipping_address,
		status, logo, contacts, billing_info, owner_id, owner_name, enterprises, next_follow_up)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, getStr(body, "companyName"), getStr(body, "industry"), getStr(body, "customerType"),
		getStr(body, "level"), getStr(body, "region"), getStr(body, "address"), getStr(body, "shippingAddress"),
		getStr(body, "status"), nullStr(getStr(body, "logo")),
		string(contactsJSON), nullStr(billingInfoStr),
		nullStr(getStr(body, "ownerId")), nullStr(getStr(body, "ownerName")),
		string(enterprisesJSON), nullStr(getStr(body, "nextFollowUpDate")))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "CREATE", "Customer", id, fmt.Sprintf("创建客户 %s", getStr(body, "companyName")))

	cust, _ := scanCustomer(id)
	c.JSON(http.StatusCreated, cust)
}

func updateCustomer(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")

	var exists int
	db.QueryRow("SELECT COUNT(*) FROM customers WHERE id = ?", id).Scan(&exists)
	if exists == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "客户不存在"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	contactsJSON, _ := json.Marshal(getArr(body, "contacts"))
	enterprisesJSON, _ := json.Marshal(getArr(body, "enterprises"))
	billingInfoStr := ""
	if v := body["billingInfo"]; v != nil {
		b, _ := json.Marshal(v)
		billingInfoStr = string(b)
	}

	db.Exec(`UPDATE customers SET company_name=?, industry=?, customer_type=?, level=?, region=?, address=?,
		shipping_address=?, status=?, logo=?, contacts=?, billing_info=?, owner_id=?, owner_name=?,
		enterprises=?, next_follow_up=?, updated_at=datetime('now') WHERE id=?`,
		getStr(body, "companyName"), getStr(body, "industry"), getStr(body, "customerType"),
		getStr(body, "level"), getStr(body, "region"), getStr(body, "address"),
		getStr(body, "shippingAddress"), getStr(body, "status"), nullStr(getStr(body, "logo")),
		string(contactsJSON), nullStr(billingInfoStr),
		nullStr(getStr(body, "ownerId")), nullStr(getStr(body, "ownerName")),
		string(enterprisesJSON), nullStr(getStr(body, "nextFollowUpDate")), id)

	cust, _ := scanCustomer(id)
	c.JSON(http.StatusOK, cust)
}

func deleteCustomer(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")
	result, err := db.Exec("DELETE FROM customers WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "客户不存在"})
		return
	}
	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "DELETE", "Customer", id, fmt.Sprintf("删除客户 %s", id))
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func mustTime() int64 {
	return timeNow().UnixMilli()
}
