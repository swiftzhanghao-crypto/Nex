package user

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	v1 "nex-backend/api/user/v1"
	authctrl "nex-backend/internal/controller/auth"
	"nex-backend/internal/middleware"
	authsvc "nex-backend/internal/service/auth"
	"nex-backend/internal/service/rbac"

	"nex-backend/internal/pkg/pagination"
	"nex-backend/internal/pkg/response"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

type Controller struct{}

func New() *Controller { return &Controller{} }

func (c *Controller) List(r *ghttp.Request) {
	ctx := r.Context()
	pg := pagination.ParseFromRequest(r)
	search := r.GetQuery("search").String()
	userType := r.GetQuery("userType").String()
	status := r.GetQuery("status").String()
	role := r.GetQuery("role").String()

	m := g.DB().Model("users").Ctx(ctx)
	if search != "" {
		m = m.Where("name LIKE ? OR email LIKE ? OR account_id LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if userType != "" {
		m = m.Where("user_type", userType)
	}
	if status != "" {
		m = m.Where("status", status)
	}
	if role != "" {
		m = m.Where("role LIKE ?", "%"+role+"%")
	}

	result, err := pagination.Query(m.Order("sort_order ASC, created_at DESC"), pg)
	if err != nil {
		response.InternalError(r, err)
		return
	}

	users := make([]v1.UserItem, 0, len(result.Rows))
	for _, row := range result.Rows {
		users = append(users, buildUserItem(row))
	}

	response.Ok(r, v1.UserListRes{
		Users:      users,
		Total:      result.Total,
		Page:       pg.Page,
		PageSize:   pg.Size,
		TotalPages: pagination.TotalPages(result.Total, pg.Size),
	})
}

func (c *Controller) Detail(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	row, err := g.DB().Model("users").Ctx(ctx).Where("id", id).One()
	if err != nil || row.IsEmpty() {
		response.NotFound(r, "用户不存在")
		return
	}
	response.Ok(r, authctrl.BuildUserProfile(row))
}

func (c *Controller) Update(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()
	currentUserID := middleware.GetUserID(r)
	currentRole := middleware.GetUserRole(r)

	isSelf := currentUserID == id
	isAdmin := rbac.HasRole(currentRole, "Admin")
	if !isSelf && !isAdmin {
		response.Forbidden(r, "只能修改本人信息，或需要管理员权限")
		return
	}

	var req v1.UserUpdateReq
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}

	data := g.Map{}
	if isAdmin {
		if req.Name != nil {
			data["name"] = *req.Name
		}
		if req.Email != nil {
			data["email"] = *req.Email
		}
		if req.Phone != nil {
			data["phone"] = *req.Phone
		}
		if req.Roles != nil {
			rolesJSON, _ := json.Marshal(req.Roles)
			data["role"] = string(rolesJSON)
		}
		if req.UserType != nil {
			data["user_type"] = *req.UserType
		}
		if req.Status != nil {
			data["status"] = *req.Status
		}
		if req.DepartmentID != nil {
			data["department_id"] = *req.DepartmentID
		}
		if req.ChannelID != nil {
			if *req.ChannelID == "" {
				data["channel_id"] = nil
			} else {
				data["channel_id"] = *req.ChannelID
			}
		}
	}
	if req.Avatar != nil {
		data["avatar"] = *req.Avatar
	}
	if req.MonthBadge != nil {
		data["month_badge"] = *req.MonthBadge
	}
	if req.Password != nil && *req.Password != "" {
		data["password_hash"] = authsvc.HashPassword(*req.Password)
	}

	if len(data) == 0 {
		response.BadRequest(r, "没有要更新的字段")
		return
	}
	data["updated_at"] = time.Now().Format("2006-01-02 15:04:05")

	_, err := g.DB().Model("users").Ctx(ctx).Where("id", id).Data(data).Update()
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row, _ := g.DB().Model("users").Ctx(ctx).Where("id", id).One()
	response.Ok(r, authctrl.BuildUserProfile(row))
}

func (c *Controller) ReorderUsers(r *ghttp.Request) {
	ctx := r.Context()
	var body struct {
		OrderedIds []string `json:"orderedIds"`
	}
	if err := r.Parse(&body); err != nil || len(body.OrderedIds) == 0 {
		response.BadRequest(r, "请提供 orderedIds")
		return
	}
	err := g.DB().Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		for i, id := range body.OrderedIds {
			if _, err := tx.Model("users").Ctx(ctx).Where("id", id).Data(g.Map{"sort_order": i}).Update(); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		response.InternalError(r, err)
		return
	}
	response.Ok(r, g.Map{"ok": true})
}

func (c *Controller) Departments(r *ghttp.Request) {
	ctx := r.Context()
	rows, _ := g.DB().Model("departments").Ctx(ctx).OrderAsc("name").All()
	depts := make([]v1.DepartmentItem, 0, len(rows))
	for _, row := range rows {
		d := v1.DepartmentItem{
			ID:   row["id"].String(),
			Name: row["name"].String(),
		}
		if v := row["description"].String(); v != "" {
			d.Description = &v
		}
		if v := row["parent_id"].String(); v != "" {
			d.ParentID = &v
		}
		depts = append(depts, d)
	}
	response.Ok(r, depts)
}

func (c *Controller) Roles(r *ghttp.Request) {
	ctx := r.Context()
	rows, _ := g.DB().Model("roles").Ctx(ctx).OrderAsc("sort_order").All()
	roles := make([]v1.RoleItem, 0, len(rows))
	for _, row := range rows {
		roles = append(roles, buildRoleItem(row))
	}
	response.Ok(r, roles)
}

func (c *Controller) CreateRole(r *ghttp.Request) {
	ctx := r.Context()
	var req v1.RoleCreateReq
	if err := r.Parse(&req); err != nil {
		response.BadRequest(r, err.Error())
		return
	}

	maxOrder, _ := g.DB().Model("roles").Ctx(ctx).Max("sort_order")
	permsJSON, _ := json.Marshal(req.Permissions)
	rowPermsJSON, _ := json.Marshal(req.RowPermissions)
	rowLogicJSON, _ := json.Marshal(req.RowLogic)
	colPermsJSON, _ := json.Marshal(req.ColumnPermissions)
	appPermsJSON, _ := json.Marshal(req.AppPermissions)

	_, err := g.DB().Exec(ctx,
		`INSERT INTO roles (id,name,description,permissions,is_system,row_permissions,row_logic,column_permissions,app_permissions,sort_order) VALUES (?,?,?,?,0,?,?,?,?,?)`,
		req.ID, req.Name, req.Description,
		string(permsJSON), string(rowPermsJSON), string(rowLogicJSON), string(colPermsJSON), string(appPermsJSON),
		int(maxOrder)+1,
	)
	if err != nil {
		response.InternalError(r, err)
		return
	}

	row, _ := g.DB().Model("roles").Ctx(ctx).Where("id", req.ID).One()
	response.Created(r, buildRoleItem(row))
}

func (c *Controller) UpdateRole(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	var req v1.RoleUpdateReq
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
		b, _ := json.Marshal(req.Permissions)
		data["permissions"] = string(b)
	}
	if req.RowPermissions != nil {
		b, _ := json.Marshal(req.RowPermissions)
		data["row_permissions"] = string(b)
	}
	if req.RowLogic != nil {
		b, _ := json.Marshal(req.RowLogic)
		data["row_logic"] = string(b)
	}
	if req.ColumnPermissions != nil {
		b, _ := json.Marshal(req.ColumnPermissions)
		data["column_permissions"] = string(b)
	}
	if req.AppPermissions != nil {
		b, _ := json.Marshal(req.AppPermissions)
		data["app_permissions"] = string(b)
	}

	if len(data) > 0 {
		g.DB().Model("roles").Ctx(ctx).Where("id", id).Data(data).Update()
	}

	row, _ := g.DB().Model("roles").Ctx(ctx).Where("id", id).One()
	if row.IsEmpty() {
		response.NotFound(r, "角色不存在")
		return
	}
	response.Ok(r, buildRoleItem(row))
}

func (c *Controller) CopyRole(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	src, _ := g.DB().Model("roles").Ctx(ctx).Where("id", id).One()
	if src.IsEmpty() {
		response.NotFound(r, "源角色不存在")
		return
	}

	newID := fmt.Sprintf("%s_copy_%d", id, time.Now().UnixMilli())
	maxOrder, _ := g.DB().Model("roles").Ctx(ctx).Max("sort_order")

	g.DB().Exec(ctx,
		`INSERT INTO roles (id,name,description,permissions,is_system,row_permissions,row_logic,column_permissions,app_permissions,sort_order) VALUES (?,?,?,?,0,?,?,?,?,?)`,
		newID, src["name"].String()+" (副本)", src["description"].String(),
		src["permissions"].String(), src["row_permissions"].String(), src["row_logic"].String(),
		src["column_permissions"].String(), src["app_permissions"].String(), int(maxOrder)+1,
	)

	row, _ := g.DB().Model("roles").Ctx(ctx).Where("id", newID).One()
	response.Created(r, buildRoleItem(row))
}

func (c *Controller) DeleteRole(r *ghttp.Request) {
	ctx := r.Context()
	id := r.Get("id").String()

	row, _ := g.DB().Model("roles").Ctx(ctx).Where("id", id).One()
	if row.IsEmpty() {
		response.NotFound(r, "角色不存在")
		return
	}
	if row["is_system"].Int() == 1 {
		response.Forbidden(r, "系统角色不可删除")
		return
	}

	g.DB().Model("roles").Ctx(ctx).Where("id", id).Delete()
	response.Ok(r, g.Map{"ok": true})
}

func (c *Controller) ReorderRoles(r *ghttp.Request) {
	ctx := r.Context()
	var body struct {
		OrderedIds []string `json:"orderedIds"`
	}
	if err := r.Parse(&body); err != nil || len(body.OrderedIds) == 0 {
		response.BadRequest(r, "请提供 orderedIds")
		return
	}
	err := g.DB().Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		for i, id := range body.OrderedIds {
			if _, err := tx.Model("roles").Ctx(ctx).Where("id", id).Data(g.Map{"sort_order": i}).Update(); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		response.InternalError(r, err)
		return
	}
	response.Ok(r, g.Map{"ok": true})
}

func buildUserItem(row map[string]*g.Var) v1.UserItem {
	item := v1.UserItem{
		ID:        row["id"].String(),
		AccountID: row["account_id"].String(),
		Name:      row["name"].String(),
		Email:     row["email"].String(),
		Phone:     row["phone"].String(),
		UserType:  row["user_type"].String(),
		Status:    row["status"].String(),
		SortOrder: row["sort_order"].Int(),
		CreatedAt: row["created_at"].String(),
		UpdatedAt: row["updated_at"].String(),
	}

	roleStr := row["role"].String()
	if strings.HasPrefix(roleStr, "[") {
		var arr []string
		json.Unmarshal([]byte(roleStr), &arr)
		item.Roles = arr
	} else {
		item.Roles = []string{roleStr}
	}

	if v := row["avatar"].String(); v != "" {
		item.Avatar = &v
	}
	if v := row["department_id"].String(); v != "" {
		item.DepartmentID = &v
	}
	if v := row["month_badge"].String(); v != "" {
		item.MonthBadge = &v
	}
	if v := row["channel_id"].String(); v != "" {
		item.ChannelID = &v
	}
	return item
}

func buildRoleItem(row map[string]*g.Var) v1.RoleItem {
	return v1.RoleItem{
		ID:                row["id"].String(),
		Name:              row["name"].String(),
		Description:       row["description"].String(),
		Permissions:       parseJSONField(row["permissions"].String(), "[]"),
		IsSystem:          row["is_system"].Int() == 1,
		RowPermissions:    parseJSONField(row["row_permissions"].String(), "[]"),
		RowLogic:          parseJSONField(row["row_logic"].String(), "{}"),
		ColumnPermissions: parseJSONField(row["column_permissions"].String(), "[]"),
		AppPermissions:    parseJSONField(row["app_permissions"].String(), "{}"),
		SortOrder:         row["sort_order"].Int(),
	}
}

func parseJSONField(s, fallback string) interface{} {
	if s == "" {
		s = fallback
	}
	var v interface{}
	if err := json.Unmarshal([]byte(s), &v); err != nil {
		return nil
	}
	return v
}
