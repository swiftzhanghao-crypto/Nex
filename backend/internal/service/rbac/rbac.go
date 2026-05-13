package rbac

import (
	"encoding/json"
	"fmt"
	"strings"

	"nex-backend/internal/middleware"
	"nex-backend/internal/pkg/response"

	"github.com/gogf/gf/v2/net/ghttp"
)

var permissionMatrix = map[string][]string{
	"user:list":        {"Admin", "Sales", "Business", "Technical", "Executive", "Commerce"},
	"user:read":        {"Admin", "Sales", "Business", "Technical", "Executive", "Commerce"},
	"user:update":      {"Admin"},
	"user:impersonate": {"Admin"},

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

func Check(resource, action string) func(r *ghttp.Request) {
	key := fmt.Sprintf("%s:%s", resource, action)
	return func(r *ghttp.Request) {
		roleJSON := middleware.GetUserRole(r)
		roles := ParseRoles(roleJSON)
		allowed, ok := permissionMatrix[key]
		if !ok {
			response.Forbidden(r, "权限未定义")
			return
		}
		for _, userRole := range roles {
			for _, allowedRole := range allowed {
				if userRole == allowedRole {
					r.Middleware.Next()
					return
				}
			}
		}
		response.Forbidden(r, fmt.Sprintf("权限不足 (需要: %s)", strings.Join(allowed, "/")))
	}
}

func ParseRoles(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	if strings.HasPrefix(raw, "[") {
		var roles []string
		if err := json.Unmarshal([]byte(raw), &roles); err == nil {
			return roles
		}
	}
	return []string{raw}
}

func HasRole(roleJSON string, target string) bool {
	for _, r := range ParseRoles(roleJSON) {
		if r == target {
			return true
		}
	}
	return false
}

func HasPermission(roleJSON string, permission string) bool {
	roles := ParseRoles(roleJSON)
	allowed, ok := permissionMatrix[permission]
	if !ok {
		return false
	}
	for _, userRole := range roles {
		for _, allowedRole := range allowed {
			if userRole == allowedRole {
				return true
			}
		}
	}
	return false
}
