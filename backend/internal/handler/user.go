package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"nex-backend/internal/config"
	"nex-backend/internal/middleware"
	"nex-backend/internal/rbac"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(r *gin.RouterGroup) {
	g := r.Group("/users", middleware.AuthMiddleware())

	g.GET("/", rbac.CheckPermission("user", "list"), listUsers)
	g.GET("/meta/departments", listDepartments)
	g.GET("/meta/roles", listRoles)
	g.GET("/:id", rbac.CheckPermission("user", "read"), getUser)
	g.PUT("/:id", middleware.RequireSelfOrRole("Admin"), updateUser)

	g.POST("/meta/roles", rbac.CheckPermission("role", "create"), createRole)
	g.PUT("/meta/roles/:id", rbac.CheckPermission("role", "update"), updateRole)
	g.POST("/meta/roles/:id/copy", rbac.CheckPermission("role", "copy"), copyRole)
	g.DELETE("/meta/roles/:id", rbac.CheckPermission("role", "delete"), deleteRole)
	g.PUT("/meta/roles-order", rbac.CheckPermission("role", "update"), reorderRoles)
}

func listUsers(c *gin.Context) {
	db := config.GetDB()
	rows, err := db.Query("SELECT id, account_id, name, email, COALESCE(phone,''), role, user_type, status, avatar, department_id, month_badge FROM users ORDER BY name")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []gin.H
	for rows.Next() {
		var id, accountID, name, email, phone, role, userType, status string
		var avatar, deptID, monthBadge *string
		rows.Scan(&id, &accountID, &name, &email, &phone, &role, &userType, &status, &avatar, &deptID, &monthBadge)
		users = append(users, gin.H{
			"id": id, "accountId": accountID, "name": name, "email": email, "phone": phone,
			"role": role, "userType": userType, "status": status, "avatar": avatar,
			"departmentId": deptID, "monthBadge": monthBadge,
		})
	}
	if users == nil {
		users = []gin.H{}
	}
	c.JSON(http.StatusOK, users)
}

func listDepartments(c *gin.Context) {
	db := config.GetDB()
	rows, err := db.Query("SELECT id, name, COALESCE(description,''), parent_id FROM departments")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var depts []gin.H
	for rows.Next() {
		var id, name, desc string
		var parentID *string
		rows.Scan(&id, &name, &desc, &parentID)
		depts = append(depts, gin.H{"id": id, "name": name, "description": desc, "parentId": parentID})
	}
	if depts == nil {
		depts = []gin.H{}
	}
	c.JSON(http.StatusOK, depts)
}

func listRoles(c *gin.Context) {
	db := config.GetDB()
	rows, err := db.Query("SELECT id, name, description, permissions, is_system, row_permissions, column_permissions, sort_order FROM roles ORDER BY sort_order ASC, rowid ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var roles []gin.H
	for rows.Next() {
		var id, name, desc, perms, rowPerms, colPerms string
		var isSystem, sortOrder int
		rows.Scan(&id, &name, &desc, &perms, &isSystem, &rowPerms, &colPerms, &sortOrder)
		roles = append(roles, gin.H{
			"id": id, "name": name, "description": desc,
			"permissions": parseJSONArray(perms), "isSystem": isSystem == 1,
			"rowPermissions": parseJSONArray(rowPerms), "columnPermissions": parseJSONArray(colPerms),
			"sortOrder": sortOrder,
		})
	}
	if roles == nil {
		roles = []gin.H{}
	}
	c.JSON(http.StatusOK, roles)
}

func getUser(c *gin.Context) {
	db := config.GetDB()
	var id, accountID, name, email, phone, role, userType, status string
	var avatar, deptID, monthBadge *string
	err := db.QueryRow(
		"SELECT id, account_id, name, email, COALESCE(phone,''), role, user_type, status, avatar, department_id, month_badge FROM users WHERE id = ?",
		c.Param("id"),
	).Scan(&id, &accountID, &name, &email, &phone, &role, &userType, &status, &avatar, &deptID, &monthBadge)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id": id, "accountId": accountID, "name": name, "email": email, "phone": phone,
		"role": role, "userType": userType, "status": status, "avatar": avatar,
		"departmentId": deptID, "monthBadge": monthBadge,
	})
}

func updateUser(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	userID := middleware.GetUserID(c)
	userRole := middleware.GetUserRole(c)
	targetID := c.Param("id")

	isSelf := userID == targetID
	isAdmin := userRole == "Admin"

	if isSelf && !isAdmin {
		if body["role"] != nil || body["userType"] != nil || body["status"] != nil || body["departmentId"] != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "非管理员不能修改角色、类型、状态或部门"})
			return
		}
		db.Exec("UPDATE users SET name=?, phone=?, updated_at=datetime('now') WHERE id=?",
			getStr(body, "name"), nullStr(getStr(body, "phone")), targetID)
	} else {
		db.Exec(`UPDATE users SET name=?, email=?, phone=?, role=?, user_type=?, status=?, department_id=?, updated_at=datetime('now') WHERE id=?`,
			getStr(body, "name"), getStr(body, "email"), nullStr(getStr(body, "phone")),
			getStr(body, "role"), getStr(body, "userType"), getStr(body, "status"),
			nullStr(getStr(body, "departmentId")), targetID)
	}

	var id, accountID, name, email, phone, role, userType, status string
	var avatar, deptID, monthBadge *string
	db.QueryRow(
		"SELECT id, account_id, name, email, COALESCE(phone,''), role, user_type, status, avatar, department_id, month_badge FROM users WHERE id = ?",
		targetID,
	).Scan(&id, &accountID, &name, &email, &phone, &role, &userType, &status, &avatar, &deptID, &monthBadge)

	c.JSON(http.StatusOK, gin.H{
		"id": id, "accountId": accountID, "name": name, "email": email, "phone": phone,
		"role": role, "userType": userType, "status": status, "avatar": avatar,
		"departmentId": deptID, "monthBadge": monthBadge,
	})
}

func createRole(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	id := fmt.Sprintf("role-%d-%s", time.Now().UnixMilli(), randomStr(4))
	name := getStr(body, "name")
	desc := getStr(body, "description")
	perms, _ := json.Marshal(getArr(body, "permissions"))
	rowPerms, _ := json.Marshal(getArr(body, "rowPermissions"))
	colPerms, _ := json.Marshal(getArr(body, "columnPermissions"))

	db.Exec("INSERT INTO roles (id, name, description, permissions, is_system, row_permissions, column_permissions) VALUES (?, ?, ?, ?, 0, ?, ?)",
		id, name, desc, string(perms), string(rowPerms), string(colPerms))

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "CREATE", "Role", id, fmt.Sprintf("创建角色 %s", name))

	c.JSON(http.StatusCreated, gin.H{
		"id": id, "name": name, "description": desc,
		"permissions": parseJSONArray(string(perms)), "isSystem": false,
		"rowPermissions": parseJSONArray(string(rowPerms)), "columnPermissions": parseJSONArray(string(colPerms)),
	})
}

func updateRole(c *gin.Context) {
	db := config.GetDB()
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求格式错误"})
		return
	}

	id := c.Param("id")
	name := getStr(body, "name")
	desc := getStr(body, "description")
	perms, _ := json.Marshal(getArr(body, "permissions"))
	rowPerms, _ := json.Marshal(getArr(body, "rowPermissions"))
	colPerms, _ := json.Marshal(getArr(body, "columnPermissions"))

	db.Exec("UPDATE roles SET name=?, description=?, permissions=?, row_permissions=?, column_permissions=? WHERE id=?",
		name, desc, string(perms), string(rowPerms), string(colPerms), id)

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "UPDATE", "Role", id, fmt.Sprintf("更新角色 %s", name))

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func copyRole(c *gin.Context) {
	db := config.GetDB()
	sourceID := c.Param("id")

	var srcName, srcDesc, srcPerms, srcRowPerms, srcColPerms string
	err := db.QueryRow("SELECT name, description, permissions, row_permissions, column_permissions FROM roles WHERE id = ?", sourceID).
		Scan(&srcName, &srcDesc, &srcPerms, &srcRowPerms, &srcColPerms)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "源角色不存在"})
		return
	}

	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	newName := getStr(body, "name")
	if newName == "" {
		newName = srcName + " (副本)"
	}

	newID := fmt.Sprintf("role-%d-%s", time.Now().UnixMilli(), randomStr(4))
	db.Exec("INSERT INTO roles (id, name, description, permissions, is_system, row_permissions, column_permissions) VALUES (?, ?, ?, ?, 0, ?, ?)",
		newID, newName, srcDesc, srcPerms, srcRowPerms, srcColPerms)

	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "COPY", "Role", newID, fmt.Sprintf("从 %s 复制角色 %s", srcName, newName))

	c.JSON(http.StatusCreated, gin.H{
		"id": newID, "name": newName, "description": srcDesc,
		"permissions": parseJSONArray(srcPerms), "isSystem": false,
		"rowPermissions": parseJSONArray(srcRowPerms), "columnPermissions": parseJSONArray(srcColPerms),
	})
}

func deleteRole(c *gin.Context) {
	db := config.GetDB()
	id := c.Param("id")

	var name string
	var isSystem int
	err := db.QueryRow("SELECT name, is_system FROM roles WHERE id = ?", id).Scan(&name, &isSystem)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "角色不存在"})
		return
	}
	if isSystem == 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "系统内置角色不可删除"})
		return
	}

	var count int
	db.QueryRow("SELECT COUNT(*) FROM users WHERE role = ?", id).Scan(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "该角色下仍有用户，无法删除"})
		return
	}

	db.Exec("DELETE FROM roles WHERE id = ?", id)
	userID := middleware.GetUserID(c)
	userName := getUserName(db, userID)
	writeAuditLog(db, userID, userName, "DELETE", "Role", id, fmt.Sprintf("删除角色 %s", name))

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func reorderRoles(c *gin.Context) {
	var body struct {
		OrderedIDs []string `json:"orderedIds"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || len(body.OrderedIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提供 orderedIds 数组"})
		return
	}

	db := config.GetDB()
	tx, err := db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for i, id := range body.OrderedIDs {
		tx.Exec("UPDATE roles SET sort_order = ? WHERE id = ?", i, id)
	}
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
