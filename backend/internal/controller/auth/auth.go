package auth

import (
	"encoding/json"
	"net/http"
	"strings"

	v1 "nex-backend/api/auth/v1"
	"nex-backend/internal/middleware"
	authsvc "nex-backend/internal/service/auth"
	"nex-backend/internal/service/rbac"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

type Controller struct{}

func New() *Controller { return &Controller{} }

func (c *Controller) Login(r *ghttp.Request) {
	var req v1.LoginReq
	if err := r.Parse(&req); err != nil {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": "请提供邮箱和密码"})
		return
	}

	ctx := r.Context()
	db := g.DB()

	row, err := db.Model("users").Ctx(ctx).Where("email", req.Email).One()
	if err != nil || row.IsEmpty() {
		r.Response.Status = http.StatusUnauthorized
		r.Response.WriteJsonExit(g.Map{"error": "邮箱或密码错误"})
		return
	}

	passwordHash := row["password_hash"].String()
	if !authsvc.VerifyPassword(req.Password, passwordHash) {
		r.Response.Status = http.StatusUnauthorized
		r.Response.WriteJsonExit(g.Map{"error": "邮箱或密码错误"})
		return
	}

	if passwordHash != "" && !strings.Contains(passwordHash, ":") {
		upgraded := authsvc.HashPassword(req.Password)
		db.Model("users").Ctx(ctx).Where("id", row["id"].String()).Data(g.Map{"password_hash": upgraded}).Update()
	}

	roleStr := row["role"].String()
	token, err := authsvc.SignToken(ctx, row["id"].String(), roleStr)
	if err != nil {
		r.Response.Status = http.StatusInternalServerError
		r.Response.WriteJsonExit(g.Map{"error": "生成令牌失败"})
		return
	}

	r.Response.WriteJsonExit(g.Map{
		"token": token,
		"user":  BuildUserProfile(row),
	})
}

func (c *Controller) Me(r *ghttp.Request) {
	ctx := r.Context()
	userID := middleware.GetUserID(r)
	impersonatedBy := middleware.GetImpersonatedBy(r)

	row, err := g.DB().Model("users").Ctx(ctx).Where("id", userID).One()
	if err != nil || row.IsEmpty() {
		r.Response.Status = http.StatusNotFound
		r.Response.WriteJsonExit(g.Map{"error": "用户不存在"})
		return
	}

	result := g.Map{}
	profile := BuildUserProfile(row)
	for k, v := range profileToMap(profile) {
		result[k] = v
	}

	if impersonatedBy != "" {
		result["impersonatedBy"] = impersonatedBy
		opRow, _ := g.DB().Model("users").Ctx(ctx).Where("id", impersonatedBy).One()
		if !opRow.IsEmpty() {
			result["impersonatorName"] = opRow["name"].String()
		}
	}

	r.Response.WriteJsonExit(result)
}

func profileToMap(p v1.UserProfile) g.Map {
	m := g.Map{
		"id":        p.ID,
		"accountId": p.AccountID,
		"name":      p.Name,
		"email":     p.Email,
		"phone":     p.Phone,
		"roles":     p.Roles,
		"userType":  p.UserType,
		"status":    p.Status,
	}
	if p.Avatar != nil {
		m["avatar"] = *p.Avatar
	} else {
		m["avatar"] = nil
	}
	if p.DepartmentID != nil {
		m["departmentId"] = *p.DepartmentID
	} else {
		m["departmentId"] = nil
	}
	if p.MonthBadge != nil {
		m["monthBadge"] = *p.MonthBadge
	} else {
		m["monthBadge"] = nil
	}
	if p.ChannelID != nil {
		m["channelId"] = *p.ChannelID
	}
	return m
}

func (c *Controller) Logout(r *ghttp.Request) {
	r.Response.WriteJsonExit(g.Map{"ok": true})
}

func (c *Controller) Impersonate(r *ghttp.Request) {
	ctx := r.Context()
	operatorID := middleware.GetUserID(r)
	operatorRole := middleware.GetUserRole(r)

	if !rbac.HasPermission(operatorRole, "user:impersonate") {
		r.Response.Status = http.StatusForbidden
		r.Response.WriteJsonExit(g.Map{"error": "无模拟登录权限"})
		return
	}

	var req struct {
		UserID string `json:"userId" v:"required"`
	}
	if err := r.Parse(&req); err != nil {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": "请提供目标用户 ID"})
		return
	}

	if req.UserID == operatorID {
		r.Response.Status = http.StatusBadRequest
		r.Response.WriteJsonExit(g.Map{"error": "不能模拟登录自己"})
		return
	}

	targetRow, err := g.DB().Model("users").Ctx(ctx).Where("id", req.UserID).One()
	if err != nil || targetRow.IsEmpty() {
		r.Response.Status = http.StatusNotFound
		r.Response.WriteJsonExit(g.Map{"error": "目标用户不存在"})
		return
	}

	if targetRow["status"].String() != "Active" {
		r.Response.Status = http.StatusForbidden
		r.Response.WriteJsonExit(g.Map{"error": "目标用户已禁用"})
		return
	}

	operatorRow, _ := g.DB().Model("users").Ctx(ctx).Where("id", operatorID).One()
	operatorName := ""
	if !operatorRow.IsEmpty() {
		operatorName = operatorRow["name"].String()
	}

	roleStr := targetRow["role"].String()
	token, err := authsvc.SignTokenWithImpersonation(ctx, req.UserID, roleStr, operatorID)
	if err != nil {
		r.Response.Status = http.StatusInternalServerError
		r.Response.WriteJsonExit(g.Map{"error": "生成令牌失败"})
		return
	}

	g.DB().Exec(ctx,
		`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail, ip) VALUES (?,?,?,?,?,?,?)`,
		operatorID, operatorName, "impersonate", "User", req.UserID,
		"模拟登录为: "+targetRow["name"].String(), r.GetClientIp(),
	)

	profile := BuildUserProfile(targetRow)
	r.Response.WriteJsonExit(g.Map{
		"token":          token,
		"user":           profile,
		"impersonatedBy": operatorID,
	})
}

func BuildUserProfile(row gdb.Record) v1.UserProfile {
	var roles []string
	roleStr := row["role"].String()
	if strings.HasPrefix(roleStr, "[") {
		json.Unmarshal([]byte(roleStr), &roles)
	} else if roleStr != "" {
		roles = []string{roleStr}
	}

	profile := v1.UserProfile{
		ID:        row["id"].String(),
		AccountID: row["account_id"].String(),
		Name:      row["name"].String(),
		Email:     row["email"].String(),
		Phone:     row["phone"].String(),
		Roles:     roles,
		UserType:  row["user_type"].String(),
		Status:    row["status"].String(),
	}
	if v := row["avatar"].String(); v != "" {
		profile.Avatar = &v
	}
	if v := row["department_id"].String(); v != "" {
		profile.DepartmentID = &v
	}
	if v := row["month_badge"].String(); v != "" {
		profile.MonthBadge = &v
	}
	if v := row["channel_id"].String(); v != "" {
		profile.ChannelID = &v
	}
	return profile
}
