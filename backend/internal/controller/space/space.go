package space

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"nex-backend/internal/middleware"
	"nex-backend/internal/pkg/response"
	"nex-backend/internal/service/rbac"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

type Controller struct{}

func New() *Controller { return &Controller{} }

func isSpaceAdmin(ctx context.Context, spaceID, userID, userRole string) bool {
	if rbac.HasRole(userRole, "Admin") {
		return true
	}
	n, err := g.DB().Model("space_members").Ctx(ctx).
		Where("space_id", spaceID).
		Where("user_id", userID).
		Where("is_admin", 1).
		Count()
	if err != nil {
		return false
	}
	return n > 0
}

func parseJSONText(text string, fallback string) interface{} {
	if strings.TrimSpace(text) == "" {
		text = fallback
	}
	var v interface{}
	if err := json.Unmarshal([]byte(text), &v); err != nil {
		var fb interface{}
		_ = json.Unmarshal([]byte(fallback), &fb)
		return fb
	}
	return v
}

func marshalJSONField(v interface{}) (string, error) {
	if v == nil {
		return "null", nil
	}
	b, err := json.Marshal(v)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func spaceToMap(row gdb.Record) g.Map {
	return g.Map{
		"id":              row["id"].String(),
		"name":            row["name"].String(),
		"description":     row["description"].String(),
		"icon":            row["icon"].String(),
		"permTree":        parseJSONText(row["perm_tree"].String(), "[]"),
		"resourceConfig":  parseJSONText(row["resource_config"].String(), "[]"),
		"columnConfig":    parseJSONText(row["column_config"].String(), "[]"),
		"sortOrder":       row["sort_order"].Int(),
	}
}

func (c *Controller) List(r *ghttp.Request) {
	ctx := r.Context()
	rows, err := g.DB().Model("spaces").Ctx(ctx).OrderAsc("sort_order").All()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	out := make([]g.Map, 0, len(rows))
	for _, row := range rows {
		out = append(out, spaceToMap(row))
	}
	response.Ok(r, out)
}

func (c *Controller) Detail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("spaces").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "空间不存在")
		return
	}
	response.Ok(r, spaceToMap(row))
}

func (c *Controller) Create(r *ghttp.Request) {
	ctx := r.Context()
	userRole := middleware.GetUserRole(r)
	if !rbac.HasRole(userRole, "Admin") {
		response.Forbidden(r, "需要管理员权限")
		return
	}
	var req struct {
		Name            string      `json:"name"`
		Description     *string     `json:"description"`
		Icon            *string     `json:"icon"`
		PermTree        interface{} `json:"permTree"`
		ResourceConfig  interface{} `json:"resourceConfig"`
		ColumnConfig    interface{} `json:"columnConfig"`
		AdminUserID     *string     `json:"adminUserId"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		response.BadRequest(r, "name 必填")
		return
	}
	currentUID := middleware.GetUserID(r)
	adminUID := currentUID
	if req.AdminUserID != nil && strings.TrimSpace(*req.AdminUserID) != "" {
		adminUID = strings.TrimSpace(*req.AdminUserID)
	}
	desc := ""
	if req.Description != nil {
		desc = *req.Description
	}
	icon := "Box"
	if req.Icon != nil && *req.Icon != "" {
		icon = *req.Icon
	}
	permTree := "[]"
	resourceCfg := "[]"
	columnCfg := "[]"
	var err error
	if req.PermTree != nil {
		permTree, err = marshalJSONField(req.PermTree)
		if err != nil {
			response.BadRequest(r, "permTree 格式无效")
			return
		}
	}
	if req.ResourceConfig != nil {
		resourceCfg, err = marshalJSONField(req.ResourceConfig)
		if err != nil {
			response.BadRequest(r, "resourceConfig 格式无效")
			return
		}
	}
	if req.ColumnConfig != nil {
		columnCfg, err = marshalJSONField(req.ColumnConfig)
		if err != nil {
			response.BadRequest(r, "columnConfig 格式无效")
			return
		}
	}
	maxOrder, _ := g.DB().Model("spaces").Ctx(ctx).Max("sort_order")
	spaceID := fmt.Sprintf("sp_%d", time.Now().UnixMilli())
	roleID := fmt.Sprintf("sr_%d", time.Now().UnixNano())
	memberID := fmt.Sprintf("sm_%d", time.Now().UnixNano())

	err = g.DB().Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		_, e := tx.Model("spaces").Ctx(ctx).Data(g.Map{
			"id":              spaceID,
			"name":            strings.TrimSpace(req.Name),
			"description":     desc,
			"icon":            icon,
			"perm_tree":       permTree,
			"resource_config": resourceCfg,
			"column_config":   columnCfg,
			"sort_order":      int(maxOrder) + 1,
		}).Insert()
		if e != nil {
			return e
		}
		_, e = tx.Model("space_roles").Ctx(ctx).Data(g.Map{
			"id":                  roleID,
			"space_id":            spaceID,
			"name":                "应用管理员",
			"description":         "",
			"permissions":         "[]",
			"row_permissions":     "[]",
			"row_logic":           "{}",
			"column_permissions":  "[]",
			"sort_order":          0,
		}).Insert()
		if e != nil {
			return e
		}
		_, e = tx.Model("space_members").Ctx(ctx).Data(g.Map{
			"id":        memberID,
			"space_id":  spaceID,
			"user_id":   adminUID,
			"role_id":   roleID,
			"is_admin":  1,
		}).Insert()
		return e
	})
	if err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ := g.DB().Model("spaces").Ctx(ctx).Where("id", spaceID).One()
	response.Created(r, spaceToMap(row))
}

func (c *Controller) Update(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	userID := middleware.GetUserID(r)
	userRole := middleware.GetUserRole(r)
	if !isSpaceAdmin(ctx, id, userID, userRole) {
		response.Forbidden(r, "需要空间管理员或全局管理员权限")
		return
	}
	row, err := g.DB().Model("spaces").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "空间不存在")
		return
	}
	var req struct {
		Name            *string     `json:"name"`
		Description     *string     `json:"description"`
		Icon            *string     `json:"icon"`
		PermTree        interface{} `json:"permTree"`
		ResourceConfig  interface{} `json:"resourceConfig"`
		ColumnConfig    interface{} `json:"columnConfig"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	data := g.Map{}
	if req.Name != nil {
		data["name"] = *req.Name
	}
	if req.Description != nil {
		data["description"] = *req.Description
	}
	if req.Icon != nil {
		data["icon"] = *req.Icon
	}
	if req.PermTree != nil {
		s, err := marshalJSONField(req.PermTree)
		if err != nil {
			response.BadRequest(r, "permTree 格式无效")
			return
		}
		data["perm_tree"] = s
	}
	if req.ResourceConfig != nil {
		s, err := marshalJSONField(req.ResourceConfig)
		if err != nil {
			response.BadRequest(r, "resourceConfig 格式无效")
			return
		}
		data["resource_config"] = s
	}
	if req.ColumnConfig != nil {
		s, err := marshalJSONField(req.ColumnConfig)
		if err != nil {
			response.BadRequest(r, "columnConfig 格式无效")
			return
		}
		data["column_config"] = s
	}
	if len(data) == 0 {
		response.BadRequest(r, "没有要更新的字段")
		return
	}
	_, err = g.DB().Model("spaces").Ctx(ctx).Where("id", id).Data(data).Update()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ = g.DB().Model("spaces").Ctx(ctx).Where("id", id).One()
	response.Ok(r, spaceToMap(row))
}

func (c *Controller) Delete(r *ghttp.Request) {
	ctx := r.Context()
	if !rbac.HasRole(middleware.GetUserRole(r), "Admin") {
		response.Forbidden(r, "需要管理员权限")
		return
	}
	id := r.Get("id").String()
	row, err := g.DB().Model("spaces").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "空间不存在")
		return
	}
	_, _ = g.DB().Model("space_members").Ctx(ctx).Where("space_id", id).Delete()
	_, _ = g.DB().Model("space_roles").Ctx(ctx).Where("space_id", id).Delete()
	_, err = g.DB().Model("spaces").Ctx(ctx).Where("id", id).Delete()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	response.Ok(r, g.Map{"ok": true})
}

func spaceRoleToMap(row gdb.Record) g.Map {
	return g.Map{
		"id":                 row["id"].String(),
		"spaceId":            row["space_id"].String(),
		"name":               row["name"].String(),
		"description":        row["description"].String(),
		"permissions":        parseJSONText(row["permissions"].String(), "[]"),
		"rowPermissions":     parseJSONText(row["row_permissions"].String(), "[]"),
		"rowLogic":           parseJSONText(row["row_logic"].String(), "{}"),
		"columnPermissions":  parseJSONText(row["column_permissions"].String(), "[]"),
		"sortOrder":          row["sort_order"].Int(),
	}
}

func (c *Controller) ListRoles(r *ghttp.Request) {
	ctx := r.Context()
	spaceID := r.Get("id").String()
	rows, err := g.DB().Model("space_roles").Ctx(ctx).
		Where("space_id", spaceID).
		OrderAsc("sort_order").
		All()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	out := make([]g.Map, 0, len(rows))
	for _, row := range rows {
		out = append(out, spaceRoleToMap(row))
	}
	response.Ok(r, out)
}

func (c *Controller) CreateRole(r *ghttp.Request) {
	ctx := r.Context()
	spaceID := r.Get("id").String()
	userID := middleware.GetUserID(r)
	userRole := middleware.GetUserRole(r)
	if !isSpaceAdmin(ctx, spaceID, userID, userRole) {
		response.Forbidden(r, "需要空间管理员或全局管理员权限")
		return
	}
	sp, _ := g.DB().Model("spaces").Ctx(ctx).Where("id", spaceID).One()
	if sp.IsEmpty() {
		response.NotFound(r, "空间不存在")
		return
	}
	var req struct {
		Name                string      `json:"name"`
		Description         *string     `json:"description"`
		Permissions         interface{} `json:"permissions"`
		RowPermissions      interface{} `json:"rowPermissions"`
		RowLogic            interface{} `json:"rowLogic"`
		ColumnPermissions   interface{} `json:"columnPermissions"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		response.BadRequest(r, "name 必填")
		return
	}
	desc := ""
	if req.Description != nil {
		desc = *req.Description
	}
	perms := "[]"
	rowPerms := "[]"
	rowLogic := "{}"
	colPerms := "[]"
	var err error
	if req.Permissions != nil {
		perms, err = marshalJSONField(req.Permissions)
		if err != nil {
			response.BadRequest(r, "permissions 格式无效")
			return
		}
	}
	if req.RowPermissions != nil {
		rowPerms, err = marshalJSONField(req.RowPermissions)
		if err != nil {
			response.BadRequest(r, "rowPermissions 格式无效")
			return
		}
	}
	if req.RowLogic != nil {
		rowLogic, err = marshalJSONField(req.RowLogic)
		if err != nil {
			response.BadRequest(r, "rowLogic 格式无效")
			return
		}
	}
	if req.ColumnPermissions != nil {
		colPerms, err = marshalJSONField(req.ColumnPermissions)
		if err != nil {
			response.BadRequest(r, "columnPermissions 格式无效")
			return
		}
	}
	roleID := fmt.Sprintf("sr_%d", time.Now().UnixMilli())
	_, err = g.DB().Model("space_roles").Ctx(ctx).Data(g.Map{
		"id":                  roleID,
		"space_id":            spaceID,
		"name":                strings.TrimSpace(req.Name),
		"description":         desc,
		"permissions":         perms,
		"row_permissions":     rowPerms,
		"row_logic":           rowLogic,
		"column_permissions":  colPerms,
		"sort_order":          999,
	}).Insert()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ := g.DB().Model("space_roles").Ctx(ctx).Where("id", roleID).One()
	response.Created(r, spaceRoleToMap(row))
}

func (c *Controller) UpdateRole(r *ghttp.Request) {
	ctx := r.Context()
	spaceID := r.Get("id").String()
	roleID := r.Get("roleId").String()
	userID := middleware.GetUserID(r)
	userRole := middleware.GetUserRole(r)
	if !isSpaceAdmin(ctx, spaceID, userID, userRole) {
		response.Forbidden(r, "需要空间管理员或全局管理员权限")
		return
	}
	row, err := g.DB().Model("space_roles").Ctx(ctx).Where("id", roleID).Where("space_id", spaceID).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "角色不存在")
		return
	}
	var req struct {
		Name                *string     `json:"name"`
		Description         *string     `json:"description"`
		Permissions         interface{} `json:"permissions"`
		RowPermissions      interface{} `json:"rowPermissions"`
		RowLogic            interface{} `json:"rowLogic"`
		ColumnPermissions   interface{} `json:"columnPermissions"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	data := g.Map{}
	if req.Name != nil {
		data["name"] = *req.Name
	}
	if req.Description != nil {
		data["description"] = *req.Description
	}
	if req.Permissions != nil {
		s, err := marshalJSONField(req.Permissions)
		if err != nil {
			response.BadRequest(r, "permissions 格式无效")
			return
		}
		data["permissions"] = s
	}
	if req.RowPermissions != nil {
		s, err := marshalJSONField(req.RowPermissions)
		if err != nil {
			response.BadRequest(r, "rowPermissions 格式无效")
			return
		}
		data["row_permissions"] = s
	}
	if req.RowLogic != nil {
		s, err := marshalJSONField(req.RowLogic)
		if err != nil {
			response.BadRequest(r, "rowLogic 格式无效")
			return
		}
		data["row_logic"] = s
	}
	if req.ColumnPermissions != nil {
		s, err := marshalJSONField(req.ColumnPermissions)
		if err != nil {
			response.BadRequest(r, "columnPermissions 格式无效")
			return
		}
		data["column_permissions"] = s
	}
	if len(data) > 0 {
		_, err = g.DB().Model("space_roles").Ctx(ctx).Where("id", roleID).Where("space_id", spaceID).Data(data).Update()
		if err != nil {
			response.InternalError(r, err)
			return
		}
	}
	row, _ = g.DB().Model("space_roles").Ctx(ctx).Where("id", roleID).One()
	response.Ok(r, spaceRoleToMap(row))
}

func (c *Controller) DeleteRole(r *ghttp.Request) {
	ctx := r.Context()
	spaceID := r.Get("id").String()
	roleID := r.Get("roleId").String()
	userID := middleware.GetUserID(r)
	userRole := middleware.GetUserRole(r)
	if !isSpaceAdmin(ctx, spaceID, userID, userRole) {
		response.Forbidden(r, "需要空间管理员或全局管理员权限")
		return
	}
	row, err := g.DB().Model("space_roles").Ctx(ctx).Where("id", roleID).Where("space_id", spaceID).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "角色不存在")
		return
	}
	if row["sort_order"].Int() == 0 && row["name"].String() == "应用管理员" {
		response.Forbidden(r, "内置应用管理员角色不可删除")
		return
	}
	n, _ := g.DB().Model("space_members").Ctx(ctx).Where("role_id", roleID).Count()
	if n > 0 {
		response.Fail(r, 409, "仍有成员使用该角色，无法删除")
		return
	}
	_, err = g.DB().Model("space_roles").Ctx(ctx).Where("id", roleID).Where("space_id", spaceID).Delete()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	response.Ok(r, g.Map{"ok": true})
}

func (c *Controller) ListMembers(r *ghttp.Request) {
	ctx := r.Context()
	spaceID := r.Get("id").String()
	rows, err := g.DB().Ctx(ctx).Raw(`
		SELECT
			sm.id AS id,
			sm.space_id AS space_id,
			sm.user_id AS user_id,
			u.name AS user_name,
			u.email AS user_email,
			u.avatar AS user_avatar,
			u.department_id AS department_id,
			sm.role_id AS role_id,
			sr.name AS role_name,
			sm.is_admin AS is_admin
		FROM space_members sm
		LEFT JOIN users u ON u.id = sm.user_id
		LEFT JOIN space_roles sr ON sr.id = sm.role_id
		WHERE sm.space_id = ?
		ORDER BY sm.created_at ASC
	`, spaceID).All()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	out := make([]g.Map, 0, len(rows))
	for _, row := range rows {
		out = append(out, g.Map{
			"id":           row["id"].String(),
			"spaceId":      row["space_id"].String(),
			"userId":       row["user_id"].String(),
			"userName":     row["user_name"].String(),
			"userEmail":    row["user_email"].String(),
			"userAvatar":   row["user_avatar"].String(),
			"departmentId": row["department_id"].String(),
			"roleId":       row["role_id"].String(),
			"roleName":     row["role_name"].String(),
			"isAdmin":      row["is_admin"].Int() == 1,
		})
	}
	response.Ok(r, out)
}

func (c *Controller) AddMember(r *ghttp.Request) {
	ctx := r.Context()
	spaceID := r.Get("id").String()
	userID := middleware.GetUserID(r)
	userRole := middleware.GetUserRole(r)
	if !isSpaceAdmin(ctx, spaceID, userID, userRole) {
		response.Forbidden(r, "需要空间管理员或全局管理员权限")
		return
	}
	sp, _ := g.DB().Model("spaces").Ctx(ctx).Where("id", spaceID).One()
	if sp.IsEmpty() {
		response.NotFound(r, "空间不存在")
		return
	}
	var req struct {
		UserID   string `json:"userId"`
		RoleID   string `json:"roleId"`
		IsAdmin  *bool  `json:"isAdmin"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	if strings.TrimSpace(req.UserID) == "" || strings.TrimSpace(req.RoleID) == "" {
		response.BadRequest(r, "userId 与 roleId 必填")
		return
	}
	dup, _ := g.DB().Model("space_members").Ctx(ctx).
		Where("space_id", spaceID).
		Where("user_id", strings.TrimSpace(req.UserID)).
		Count()
	if dup > 0 {
		response.Fail(r, 409, "该用户已加入此空间")
		return
	}
	roleRow, _ := g.DB().Model("space_roles").Ctx(ctx).
		Where("id", strings.TrimSpace(req.RoleID)).
		Where("space_id", spaceID).
		One()
	if roleRow.IsEmpty() {
		response.BadRequest(r, "角色不存在或不属于该空间")
		return
	}
	isAdm := 0
	if req.IsAdmin != nil && *req.IsAdmin {
		isAdm = 1
	}
	memberID := fmt.Sprintf("sm_%d", time.Now().UnixMilli())
	_, err := g.DB().Model("space_members").Ctx(ctx).Data(g.Map{
		"id":        memberID,
		"space_id":  spaceID,
		"user_id":   strings.TrimSpace(req.UserID),
		"role_id":   strings.TrimSpace(req.RoleID),
		"is_admin":  isAdm,
	}).Insert()
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			response.Fail(r, 409, "该用户已加入此空间")
			return
		}
		response.InternalError(r, err)
		return
	}
	row, _ := g.DB().Model("space_members").Ctx(ctx).Where("id", memberID).One()
	response.Created(r, g.Map{
		"id":        row["id"].String(),
		"spaceId":   row["space_id"].String(),
		"userId":    row["user_id"].String(),
		"roleId":    row["role_id"].String(),
		"isAdmin":   row["is_admin"].Int() == 1,
	})
}

func (c *Controller) UpdateMember(r *ghttp.Request) {
	ctx := r.Context()
	spaceID := r.Get("id").String()
	memberID := r.Get("memberId").String()
	userID := middleware.GetUserID(r)
	userRole := middleware.GetUserRole(r)
	if !isSpaceAdmin(ctx, spaceID, userID, userRole) {
		response.Forbidden(r, "需要空间管理员或全局管理员权限")
		return
	}
	row, err := g.DB().Model("space_members").Ctx(ctx).
		Where("id", memberID).
		Where("space_id", spaceID).
		One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "成员不存在")
		return
	}
	var req struct {
		RoleID  *string `json:"roleId"`
		IsAdmin *bool   `json:"isAdmin"`
	}
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}
	data := g.Map{}
	if req.RoleID != nil {
		rid := strings.TrimSpace(*req.RoleID)
		if rid == "" {
			response.BadRequest(r, "roleId 不能为空")
			return
		}
		roleRow, _ := g.DB().Model("space_roles").Ctx(ctx).
			Where("id", rid).
			Where("space_id", spaceID).
			One()
		if roleRow.IsEmpty() {
			response.BadRequest(r, "角色不存在或不属于该空间")
			return
		}
		data["role_id"] = rid
	}
	if req.IsAdmin != nil {
		if *req.IsAdmin {
			data["is_admin"] = 1
		} else {
			data["is_admin"] = 0
		}
	}
	if len(data) == 0 {
		response.BadRequest(r, "没有要更新的字段")
		return
	}
	_, err = g.DB().Model("space_members").Ctx(ctx).
		Where("id", memberID).
		Where("space_id", spaceID).
		Data(data).
		Update()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	row, _ = g.DB().Model("space_members").Ctx(ctx).Where("id", memberID).One()
	response.Ok(r, g.Map{
		"id":        row["id"].String(),
		"spaceId":   row["space_id"].String(),
		"userId":    row["user_id"].String(),
		"roleId":    row["role_id"].String(),
		"isAdmin":   row["is_admin"].Int() == 1,
	})
}

func (c *Controller) RemoveMember(r *ghttp.Request) {
	ctx := r.Context()
	spaceID := r.Get("id").String()
	memberID := r.Get("memberId").String()
	userID := middleware.GetUserID(r)
	userRole := middleware.GetUserRole(r)
	if !isSpaceAdmin(ctx, spaceID, userID, userRole) {
		response.Forbidden(r, "需要空间管理员或全局管理员权限")
		return
	}
	_, err := g.DB().Model("space_members").Ctx(ctx).
		Where("id", memberID).
		Where("space_id", spaceID).
		Delete()
	if err != nil {
		response.InternalError(r, err)
		return
	}
	response.Ok(r, g.Map{"ok": true})
}
