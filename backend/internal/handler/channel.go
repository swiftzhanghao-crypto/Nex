package handler

import (
	"fmt"
	"net/http"

	"nex-backend/internal/config"
	"nex-backend/internal/middleware"
	"nex-backend/internal/rbac"

	"github.com/gin-gonic/gin"
)

func RegisterChannelRoutes(r *gin.RouterGroup) {
	g := r.Group("/channels", middleware.AuthMiddleware())
	g.GET("/", rbac.CheckPermission("channel", "list"), listChannels)
	g.GET("/:id", rbac.CheckPermission("channel", "read"), getChannel)
	g.POST("/", rbac.CheckPermission("channel", "create"), createChannel)
	g.PUT("/:id", rbac.CheckPermission("channel", "update"), updateChannel)
	g.DELETE("/:id", rbac.CheckPermission("channel", "delete"), deleteChannel)
}

func scanChannel(id string) (gin.H, bool) {
	db := config.GetDB()
	var cid, name, cType, level, contactName, contactPhone, email, region, status, agreementDate string
	err := db.QueryRow("SELECT id, name, type, level, contact_name, contact_phone, email, region, status, agreement_date FROM channels WHERE id = ?", id).
		Scan(&cid, &name, &cType, &level, &contactName, &contactPhone, &email, &region, &status, &agreementDate)
	if err != nil {
		return nil, false
	}
	return gin.H{
		"id": cid, "name": name, "type": cType, "level": level,
		"contactName": contactName, "contactPhone": contactPhone,
		"email": email, "region": region, "status": status, "agreementDate": agreementDate,
	}, true
}

func listChannels(c *gin.Context) {
	db := config.GetDB()
	cType := c.Query("type")
	level := c.Query("level")
	status := c.Query("status")
	region := c.Query("region")
	search := c.Query("search")

	where := "1=1"
	var args []interface{}
	if cType != "" {
		where += " AND type = ?"
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
	if region != "" {
		where += " AND region = ?"
		args = append(args, region)
	}
	if search != "" {
		where += " AND name LIKE ?"
		args = append(args, "%"+search+"%")
	}

	var total int
	db.QueryRow("SELECT COUNT(*) FROM channels WHERE "+where, args...).Scan(&total)

	limit, offset, pageNum := safePagination(c.DefaultQuery("page", "1"), c.DefaultQuery("size", "50"))
	fullArgs := append(args, limit, offset)

	rows, err := db.Query("SELECT id FROM channels WHERE "+where+" ORDER BY name LIMIT ? OFFSET ?", fullArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var channels []gin.H
	for rows.Next() {
		var id string
		rows.Scan(&id)
		if ch, ok := scanChannel(id); ok {
			channels = append(channels, ch)
		}
	}
	if channels == nil {
		channels = []gin.H{}
	}
	c.JSON(http.StatusOK, gin.H{"data": channels, "total": total, "page": pageNum, "size": limit})
}

func getChannel(c *gin.Context) {
	ch, ok := scanChannel(c.Param("id"))
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "渠道不存在"})
		return
	}
	c.JSON(http.StatusOK, ch)
}

func createChannel(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	id := getStr(body, "id")
	if id == "" {
		id = generateID("CH")
	}

	_, err := db.Exec(`INSERT INTO channels (id, name, type, level, contact_name, contact_phone, email, region, status, agreement_date)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, getStr(body, "name"), getStr(body, "type"), getStr(body, "level"),
		getStr(body, "contactName"), getStr(body, "contactPhone"), getStr(body, "email"),
		getStr(body, "region"), getStr(body, "status"), getStr(body, "agreementDate"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "CREATE", "Channel", id, fmt.Sprintf("创建渠道 %s", getStr(body, "name")))

	ch, _ := scanChannel(id)
	c.JSON(http.StatusCreated, ch)
}

func updateChannel(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")

	var exists int
	db.QueryRow("SELECT COUNT(*) FROM channels WHERE id = ?", id).Scan(&exists)
	if exists == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "渠道不存在"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	db.Exec(`UPDATE channels SET name=?, type=?, level=?, contact_name=?, contact_phone=?, email=?, region=?, status=?, agreement_date=? WHERE id=?`,
		getStr(body, "name"), getStr(body, "type"), getStr(body, "level"),
		getStr(body, "contactName"), getStr(body, "contactPhone"), getStr(body, "email"),
		getStr(body, "region"), getStr(body, "status"), getStr(body, "agreementDate"), id)

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "UPDATE", "Channel", id, fmt.Sprintf("更新渠道 %s", getStr(body, "name")))

	ch, _ := scanChannel(id)
	c.JSON(http.StatusOK, ch)
}

func deleteChannel(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")
	result, err := db.Exec("DELETE FROM channels WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "渠道不存在"})
		return
	}
	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "DELETE", "Channel", id, fmt.Sprintf("删除渠道 %s", id))
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
