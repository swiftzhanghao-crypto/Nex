package handler

import (
	"net/http"

	"nex-backend/internal/config"
	"nex-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.RouterGroup) {
	r.POST("/login", loginHandler)
	r.GET("/me", middleware.AuthMiddleware(), meHandler)
}

func loginHandler(c *gin.Context) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Email == "" || body.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请提供邮箱和密码"})
		return
	}

	db := config.GetDB()
	var id, accountID, name, email, phone, passwordHash, role, userType, status string
	var avatar, departmentID, monthBadge *string

	err := db.QueryRow(
		"SELECT id, account_id, name, email, COALESCE(phone,''), password_hash, role, user_type, status, avatar, department_id, month_badge FROM users WHERE email = ?",
		body.Email,
	).Scan(&id, &accountID, &name, &email, &phone, &passwordHash, &role, &userType, &status, &avatar, &departmentID, &monthBadge)

	if err != nil || !middleware.VerifyPassword(body.Password, passwordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "邮箱或密码错误"})
		return
	}

	if passwordHash != "" && len(passwordHash) > 0 && passwordHash[0] != 0 && !contains(passwordHash, ":") {
		upgraded := middleware.HashPassword(body.Password)
		db.Exec("UPDATE users SET password_hash = ? WHERE id = ?", upgraded, id)
	}

	token, err := middleware.SignToken(id, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成令牌失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id": id, "accountId": accountID, "name": name,
			"email": email, "phone": phone, "role": role,
			"userType": userType, "status": status,
			"avatar": avatar, "departmentId": departmentID,
			"monthBadge": monthBadge,
		},
	})
}

func meHandler(c *gin.Context) {
	db := config.GetDB()
	userID := middleware.GetUserID(c)

	var id, accountID, name, email, phone, role, userType, status string
	var avatar, departmentID, monthBadge *string

	err := db.QueryRow(
		"SELECT id, account_id, name, email, COALESCE(phone,''), role, user_type, status, avatar, department_id, month_badge FROM users WHERE id = ?",
		userID,
	).Scan(&id, &accountID, &name, &email, &phone, &role, &userType, &status, &avatar, &departmentID, &monthBadge)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id": id, "accountId": accountID, "name": name,
		"email": email, "phone": phone, "role": role,
		"userType": userType, "status": status,
		"avatar": avatar, "departmentId": departmentID,
		"monthBadge": monthBadge,
	})
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(s) > 0 && containsStr(s, sub))
}

func containsStr(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
