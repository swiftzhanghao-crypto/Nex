package rbac

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

var permissionMatrix = map[string][]string{
	"user:list": {"Admin", "Sales", "Business", "Technical", "Executive", "Commerce"},
	"user:read": {"Admin", "Sales", "Business", "Technical", "Executive", "Commerce"},
	"user:update": {"Admin"},
	"role:create": {"Admin"},
	"role:update": {"Admin"},
	"role:delete": {"Admin"},
	"role:copy":   {"Admin"},

	"order:list":    {"Admin", "Sales", "Business", "Executive", "Commerce"},
	"order:read":    {"Admin", "Sales", "Business", "Executive", "Commerce"},
	"order:create":  {"Admin", "Sales", "Business"},
	"order:update":  {"Admin", "Sales", "Business"},
	"order:delete":  {"Admin", "Sales"},
	"order:approve": {"Admin", "Business", "Commerce"},
	"order:submit":  {"Admin", "Sales", "Business"},

	"customer:list":   {"Admin", "Sales", "Business", "Executive", "Commerce"},
	"customer:read":   {"Admin", "Sales", "Business", "Executive", "Commerce"},
	"customer:create": {"Admin", "Sales", "Business"},
	"customer:update": {"Admin", "Sales", "Business"},
	"customer:delete": {"Admin", "Sales", "Business"},

	"product:list":   {"Admin", "Sales", "Business", "Technical", "Executive", "Commerce"},
	"product:read":   {"Admin", "Sales", "Business", "Technical", "Executive", "Commerce"},
	"product:create": {"Admin"},
	"product:update": {"Admin"},
	"product:delete": {"Admin"},

	"channel:list":   {"Admin", "Sales", "Business", "Executive", "Commerce"},
	"channel:read":   {"Admin", "Sales", "Business", "Executive", "Commerce"},
	"channel:create": {"Admin"},
	"channel:update": {"Admin"},
	"channel:delete": {"Admin"},

	"contract:list":   {"Admin", "Business", "Sales", "Executive", "Commerce"},
	"contract:read":   {"Admin", "Business", "Sales", "Executive", "Commerce"},
	"contract:create": {"Admin", "Business", "Commerce"},
	"contract:update": {"Admin", "Business", "Commerce"},
	"contract:delete": {"Admin", "Business"},

	"remittance:list":   {"Admin", "Business", "Executive", "Commerce"},
	"remittance:read":   {"Admin", "Business", "Executive", "Commerce"},
	"remittance:create": {"Admin", "Business"},
	"remittance:update": {"Admin", "Business"},
	"remittance:delete": {"Admin", "Business"},

	"invoice:list":   {"Admin", "Sales", "Business", "Executive", "Commerce"},
	"invoice:read":   {"Admin", "Sales", "Business", "Executive", "Commerce"},
	"invoice:create": {"Admin", "Business"},
	"invoice:update": {"Admin", "Business"},
	"invoice:delete": {"Admin", "Business"},

	"performance:list": {"Admin", "Sales", "Business", "Executive", "Commerce"},
	"performance:read": {"Admin", "Sales", "Business", "Executive", "Commerce"},

	"authorization:list":   {"Admin", "Business", "Sales", "Technical", "Executive", "Commerce"},
	"authorization:read":   {"Admin", "Business", "Sales", "Technical", "Executive", "Commerce"},
	"authorization:create": {"Admin", "Business"},

	"delivery:list":   {"Admin", "Business", "Sales", "Technical", "Executive", "Commerce"},
	"delivery:read":   {"Admin", "Business", "Sales", "Technical", "Executive", "Commerce"},
	"delivery:create": {"Admin", "Business"},

	"auditlog:list": {"Admin", "Business"},

	"opportunity:list":   {"Admin", "Sales", "Business", "Executive", "Commerce"},
	"opportunity:read":   {"Admin", "Sales", "Business", "Executive", "Commerce"},
	"opportunity:create": {"Admin", "Sales", "Business"},
	"opportunity:update": {"Admin", "Sales", "Business"},
	"opportunity:delete": {"Admin", "Sales", "Business"},
}

func CheckPermission(resource, action string) gin.HandlerFunc {
	key := fmt.Sprintf("%s:%s", resource, action)
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "未认证"})
			return
		}
		allowed, ok := permissionMatrix[key]
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "权限未定义"})
			return
		}
		roleStr, _ := role.(string)
		for _, r := range allowed {
			if r == roleStr {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": fmt.Sprintf("权限不足 (需要: %s)", joinRoles(allowed))})
	}
}

func joinRoles(roles []string) string {
	result := ""
	for i, r := range roles {
		if i > 0 {
			result += "/"
		}
		result += r
	}
	return result
}
