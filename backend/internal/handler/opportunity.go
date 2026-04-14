package handler

import (
	"fmt"
	"net/http"

	"nex-backend/internal/config"
	"nex-backend/internal/middleware"
	"nex-backend/internal/rbac"

	"github.com/gin-gonic/gin"
)

var validStages = []string{"需求判断", "方案报价", "商务谈判", "赢单", "输单"}

func RegisterOpportunityRoutes(r *gin.RouterGroup) {
	g := r.Group("/opportunities", middleware.AuthMiddleware())
	g.GET("/", rbac.CheckPermission("opportunity", "list"), listOpportunities)
	g.GET("/:id", rbac.CheckPermission("opportunity", "read"), getOpportunity)
	g.POST("/", rbac.CheckPermission("opportunity", "create"), createOpportunity)
	g.PUT("/:id", rbac.CheckPermission("opportunity", "update"), updateOpportunity)
	g.DELETE("/:id", rbac.CheckPermission("opportunity", "delete"), deleteOpportunity)
}

func scanOpportunity(id string) (gin.H, bool) {
	db := config.GetDB()
	var oid, name, custID, custName, stage, ownerID, ownerName, closeDate, createdAt string
	var crmID, prodType, dept *string
	var prob, expRev float64
	var amount, finalRev *float64

	err := db.QueryRow(`SELECT id, crm_id, name, customer_id, customer_name, product_type, stage, probability,
		department, amount, expected_revenue, final_user_rev, close_date, owner_id, owner_name, created_at
		FROM opportunities WHERE id = ?`, id).
		Scan(&oid, &crmID, &name, &custID, &custName, &prodType, &stage, &prob,
			&dept, &amount, &expRev, &finalRev, &closeDate, &ownerID, &ownerName, &createdAt)
	if err != nil {
		return nil, false
	}
	return gin.H{
		"id": oid, "crmId": crmID, "name": name, "customerId": custID,
		"customerName": custName, "productType": prodType, "stage": stage,
		"probability": prob, "department": dept, "amount": amount,
		"expectedRevenue": expRev, "finalUserRevenue": finalRev,
		"closeDate": closeDate, "ownerId": ownerID, "ownerName": ownerName,
		"createdAt": createdAt,
	}, true
}

func isValidStage(s string) bool {
	for _, v := range validStages {
		if v == s {
			return true
		}
	}
	return false
}

func listOpportunities(c *gin.Context) {
	db := config.GetDB()
	custID := c.Query("customerId")
	stage := c.Query("stage")
	ownerID := c.Query("ownerId")
	search := c.Query("search")

	where := "1=1"
	var args []interface{}
	if custID != "" {
		where += " AND customer_id = ?"
		args = append(args, custID)
	}
	if stage != "" {
		where += " AND stage = ?"
		args = append(args, stage)
	}
	if ownerID != "" {
		where += " AND owner_id = ?"
		args = append(args, ownerID)
	}
	if search != "" {
		where += " AND (name LIKE ? OR customer_name LIKE ?)"
		args = append(args, "%"+search+"%", "%"+search+"%")
	}

	var total int
	db.QueryRow("SELECT COUNT(*) FROM opportunities WHERE "+where, args...).Scan(&total)

	limit, offset, pageNum := safePagination(c.DefaultQuery("page", "1"), c.DefaultQuery("size", "50"))
	fullArgs := append(args, limit, offset)

	rows, err := db.Query("SELECT id FROM opportunities WHERE "+where+" ORDER BY close_date DESC LIMIT ? OFFSET ?", fullArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var opps []gin.H
	for rows.Next() {
		var id string
		rows.Scan(&id)
		if o, ok := scanOpportunity(id); ok {
			opps = append(opps, o)
		}
	}
	if opps == nil {
		opps = []gin.H{}
	}
	c.JSON(http.StatusOK, gin.H{"data": opps, "total": total, "page": pageNum, "size": limit})
}

func getOpportunity(c *gin.Context) {
	o, ok := scanOpportunity(c.Param("id"))
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "商机不存在"})
		return
	}
	c.JSON(http.StatusOK, o)
}

func createOpportunity(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	stage := getStr(body, "stage")
	if stage == "" {
		stage = "需求判断"
	}
	if !isValidStage(stage) {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("无效的商机阶段: %s", stage)})
		return
	}

	id := getStr(body, "id")
	if id == "" {
		id = generateID("OPP")
	}

	_, err := db.Exec(`INSERT INTO opportunities (id, crm_id, name, customer_id, customer_name, product_type, stage, probability,
		department, amount, expected_revenue, final_user_rev, close_date, owner_id, owner_name, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
		id, nullStr(getStr(body, "crmId")), getStr(body, "name"),
		getStr(body, "customerId"), getStr(body, "customerName"),
		nullStr(getStr(body, "productType")), stage, getFloat(body, "probability"),
		nullStr(getStr(body, "department")), body["amount"],
		getFloat(body, "expectedRevenue"), body["finalUserRevenue"],
		getStr(body, "closeDate"), getStr(body, "ownerId"), getStr(body, "ownerName"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "CREATE", "Opportunity", id, fmt.Sprintf("创建商机 %s", getStr(body, "name")))

	o, _ := scanOpportunity(id)
	c.JSON(http.StatusCreated, o)
}

func updateOpportunity(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")

	var exists int
	db.QueryRow("SELECT COUNT(*) FROM opportunities WHERE id = ?", id).Scan(&exists)
	if exists == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "商机不存在"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	stage := getStr(body, "stage")
	if stage != "" && !isValidStage(stage) {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("无效的商机阶段: %s", stage)})
		return
	}

	db.Exec(`UPDATE opportunities SET crm_id=?, name=?, customer_id=?, customer_name=?, product_type=?,
		stage=?, probability=?, department=?, amount=?, expected_revenue=?, final_user_rev=?,
		close_date=?, owner_id=?, owner_name=? WHERE id=?`,
		nullStr(getStr(body, "crmId")), getStr(body, "name"),
		getStr(body, "customerId"), getStr(body, "customerName"),
		nullStr(getStr(body, "productType")), stage, getFloat(body, "probability"),
		nullStr(getStr(body, "department")), body["amount"],
		getFloat(body, "expectedRevenue"), body["finalUserRevenue"],
		getStr(body, "closeDate"), getStr(body, "ownerId"), getStr(body, "ownerName"), id)

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "UPDATE", "Opportunity", id, fmt.Sprintf("更新商机 %s，阶段: %s", getStr(body, "name"), stage))

	o, _ := scanOpportunity(id)
	c.JSON(http.StatusOK, o)
}

func deleteOpportunity(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")

	var stage string
	var name string
	err := db.QueryRow("SELECT stage, name FROM opportunities WHERE id = ?", id).Scan(&stage, &name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "商机不存在"})
		return
	}
	if stage == "赢单" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "已赢单的商机不允许删除"})
		return
	}

	db.Exec("DELETE FROM opportunities WHERE id = ?", id)
	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "DELETE", "Opportunity", id, fmt.Sprintf("删除商机 %s", name))
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
