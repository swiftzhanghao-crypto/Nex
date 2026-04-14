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

func RegisterProductRoutes(r *gin.RouterGroup) {
	g := r.Group("/products", middleware.AuthMiddleware())
	g.GET("/", rbac.CheckPermission("product", "list"), listProducts)
	g.GET("/meta/channels", listMetaChannels)
	g.GET("/meta/opportunities", listMetaOpportunities)
	g.GET("/:id", rbac.CheckPermission("product", "read"), getProduct)
	g.POST("/", rbac.CheckPermission("product", "create"), createProduct)
	g.PUT("/:id", rbac.CheckPermission("product", "update"), updateProduct)
	g.DELETE("/:id", rbac.CheckPermission("product", "delete"), deleteProduct)
}

func scanProduct(id string) (gin.H, bool) {
	db := config.GetDB()
	var pid, name, category, status, tags, skus, composition, installPkgs string
	var subCategory, description, licenseTpl *string

	err := db.QueryRow(`SELECT id, name, category, sub_category, description, status, tags, skus, composition, install_pkgs, license_tpl
		FROM products WHERE id = ?`, id).
		Scan(&pid, &name, &category, &subCategory, &description, &status, &tags, &skus, &composition, &installPkgs, &licenseTpl)
	if err != nil {
		return nil, false
	}

	result := gin.H{
		"id": pid, "name": name, "category": category, "subCategory": subCategory,
		"description": description, "status": status,
		"tags": parseJSONArray(tags), "skus": parseJSONArray(skus),
		"composition": parseJSONArray(composition), "installPackages": parseJSONArray(installPkgs),
	}
	if licenseTpl != nil && *licenseTpl != "" {
		result["licenseTemplate"] = parseJSON(*licenseTpl)
	}
	return result, true
}

func listProducts(c *gin.Context) {
	db := config.GetDB()
	category := c.Query("category")
	status := c.Query("status")
	search := c.Query("search")

	where := "1=1"
	var args []interface{}
	if category != "" {
		where += " AND category = ?"
		args = append(args, category)
	}
	if status != "" {
		where += " AND status = ?"
		args = append(args, status)
	}
	if search != "" {
		where += " AND name LIKE ?"
		args = append(args, "%"+search+"%")
	}

	rows, err := db.Query("SELECT id FROM products WHERE "+where+" ORDER BY name", args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var products []gin.H
	for rows.Next() {
		var id string
		rows.Scan(&id)
		if p, ok := scanProduct(id); ok {
			products = append(products, p)
		}
	}
	if products == nil {
		products = []gin.H{}
	}
	c.JSON(http.StatusOK, products)
}

func listMetaChannels(c *gin.Context) {
	db := config.GetDB()
	rows, err := db.Query("SELECT id, name, type, level, contact_name, contact_phone, email, region, status, agreement_date FROM channels ORDER BY name")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var channels []gin.H
	for rows.Next() {
		var id, name, cType, level, contactName, contactPhone, email, region, status, agreementDate string
		rows.Scan(&id, &name, &cType, &level, &contactName, &contactPhone, &email, &region, &status, &agreementDate)
		channels = append(channels, gin.H{
			"id": id, "name": name, "type": cType, "level": level,
			"contactName": contactName, "contactPhone": contactPhone,
			"email": email, "region": region, "status": status, "agreementDate": agreementDate,
		})
	}
	if channels == nil {
		channels = []gin.H{}
	}
	c.JSON(http.StatusOK, channels)
}

func listMetaOpportunities(c *gin.Context) {
	db := config.GetDB()
	rows, err := db.Query(`SELECT id, COALESCE(crm_id,''), name, customer_id, customer_name, COALESCE(product_type,''),
		stage, probability, COALESCE(amount,0), expected_revenue, COALESCE(final_user_rev,0),
		close_date, owner_id, owner_name, created_at FROM opportunities ORDER BY close_date DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var opps []gin.H
	for rows.Next() {
		var id, crmID, name, custID, custName, prodType, stage string
		var prob, amount, expRev, finalRev float64
		var closeDate, ownerID, ownerName, createdAt string
		rows.Scan(&id, &crmID, &name, &custID, &custName, &prodType, &stage,
			&prob, &amount, &expRev, &finalRev, &closeDate, &ownerID, &ownerName, &createdAt)
		opps = append(opps, gin.H{
			"id": id, "crmId": crmID, "name": name, "customerId": custID,
			"customerName": custName, "productType": prodType, "stage": stage,
			"probability": prob, "amount": amount, "expectedRevenue": expRev,
			"finalUserRevenue": finalRev, "closeDate": closeDate,
			"ownerId": ownerID, "ownerName": ownerName, "createdAt": createdAt,
		})
	}
	if opps == nil {
		opps = []gin.H{}
	}
	c.JSON(http.StatusOK, opps)
}

func getProduct(c *gin.Context) {
	p, ok := scanProduct(c.Param("id"))
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "产品不存在"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func createProduct(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	id := getStr(body, "id")
	if id == "" {
		id = generateID("PROD")
	}

	tagsJSON, _ := json.Marshal(getArr(body, "tags"))
	skusJSON, _ := json.Marshal(getArr(body, "skus"))
	compositionJSON, _ := json.Marshal(getArr(body, "composition"))
	installPkgsJSON, _ := json.Marshal(getArr(body, "installPackages"))
	licenseTplStr := ""
	if v := body["licenseTemplate"]; v != nil {
		b, _ := json.Marshal(v)
		licenseTplStr = string(b)
	}

	_, err := db.Exec(`INSERT INTO products (id, name, category, sub_category, description, status, tags, skus, composition, install_pkgs, license_tpl)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, getStr(body, "name"), getStr(body, "category"),
		nullStr(getStr(body, "subCategory")), nullStr(getStr(body, "description")),
		getStr(body, "status"), string(tagsJSON), string(skusJSON),
		string(compositionJSON), string(installPkgsJSON), nullStr(licenseTplStr))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "CREATE", "Product", id, fmt.Sprintf("创建产品 %s", getStr(body, "name")))

	p, _ := scanProduct(id)
	c.JSON(http.StatusCreated, p)
}

func updateProduct(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	tagsJSON, _ := json.Marshal(getArr(body, "tags"))
	skusJSON, _ := json.Marshal(getArr(body, "skus"))
	compositionJSON, _ := json.Marshal(getArr(body, "composition"))
	installPkgsJSON, _ := json.Marshal(getArr(body, "installPackages"))
	licenseTplStr := ""
	if v := body["licenseTemplate"]; v != nil {
		b, _ := json.Marshal(v)
		licenseTplStr = string(b)
	}

	db.Exec(`UPDATE products SET name=?, category=?, sub_category=?, description=?, status=?,
		tags=?, skus=?, composition=?, install_pkgs=?, license_tpl=? WHERE id=?`,
		getStr(body, "name"), getStr(body, "category"),
		nullStr(getStr(body, "subCategory")), nullStr(getStr(body, "description")),
		getStr(body, "status"), string(tagsJSON), string(skusJSON),
		string(compositionJSON), string(installPkgsJSON), nullStr(licenseTplStr), id)

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "UPDATE", "Product", id, fmt.Sprintf("更新产品 %s", getStr(body, "name")))

	p, _ := scanProduct(id)
	c.JSON(http.StatusOK, p)
}

func deleteProduct(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")
	result, err := db.Exec("DELETE FROM products WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "产品不存在"})
		return
	}
	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "DELETE", "Product", id, fmt.Sprintf("删除产品 %s", id))
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
