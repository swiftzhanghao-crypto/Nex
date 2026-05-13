package boot

import (
	"context"
	"encoding/json"

	authsvc "nex-backend/internal/service/auth"

	"github.com/gogf/gf/v2/frame/g"
)

func SeedDatabase(ctx context.Context) error {
	db := g.DB()
	count, err := db.Model("users").Ctx(ctx).Count()
	if err != nil {
		return err
	}
	if count > 0 {
		g.Log().Info(ctx, "[seed] Database already has data, skipping seed.")
		return nil
	}
	g.Log().Info(ctx, "[seed] Seeding database...")
	defaultPwd := authsvc.HashPassword("123456")

	type seedUser struct {
		ID, AccountID, Name, Email, Phone, Role, UserType, Status, DeptID string
	}
	users := []seedUser{
		{"u1", "10000001", "张伟", "zhangwei@wps.cn", "13800000001", `["Admin"]`, "Internal", "Active", "root"},
		{"u2", "10000002", "李娜", "lina@wps.cn", "13800000002", `["Sales"]`, "Internal", "Active", "c2-d1-r1-t1"},
		{"u3", "10000003", "王强", "wangqiang@wps.cn", "13800000003", `["Business"]`, "Internal", "Active", "c3-d1"},
		{"u4", "10000004", "赵敏", "zhaomin@wps.cn", "13800000004", `["Technical"]`, "Internal", "Active", "root"},
		{"u5", "10000005", "孙涛", "suntao@wps.cn", "13800000005", `["Technical"]`, "Internal", "Active", "root"},
		{"u6", "10000006", "周琳", "zhoulin@wps.cn", "13800000006", `["Sales"]`, "Internal", "Active", "c2-d1-r1-t1"},
		{"u7", "10000007", "吴鹏", "wupeng@wps.cn", "13800000007", `["Business"]`, "Internal", "Active", "c3-d1"},
		{"u8", "10000008", "郑华", "zhenghua@wps.cn", "13800000008", `["Executive"]`, "Internal", "Active", "root"},
	}
	for _, u := range users {
		_, err := db.Exec(ctx,
			`INSERT INTO users (id,account_id,name,email,phone,password_hash,role,user_type,status,department_id) VALUES (?,?,?,?,?,?,?,?,?,?)`,
			u.ID, u.AccountID, u.Name, u.Email, u.Phone, defaultPwd, u.Role, u.UserType, u.Status, u.DeptID)
		if err != nil {
			return err
		}
	}

	type seedDept struct {
		ID, Name, Desc string
		ParentID       *string
	}
	depts := []seedDept{
		{"root", "总部", "公司总部", nil},
		{"c2-d1-r1-t1", "销售部", "负责产品销售", strPtr("root")},
		{"c3-d1", "商务部", "负责商务合作", strPtr("root")},
	}
	for _, d := range depts {
		_, err := db.Exec(ctx,
			`INSERT INTO departments (id,name,description,parent_id) VALUES (?,?,?,?)`,
			d.ID, d.Name, d.Desc, d.ParentID)
		if err != nil {
			return err
		}
	}

	type seedRole struct {
		ID, Name, Desc string
		Perms          []string
		IsSystem       bool
		SortOrder      int
	}
	roles := []seedRole{
		{"Admin", "管理员", "系统管理员", adminPerms(), true, 0},
		{"Sales", "销售经理", "销售团队", salesPerms(), false, 1},
		{"Business", "商务经理", "商务合作", businessPerms(), false, 2},
		{"Technical", "技术工程师", "技术支持", techPerms(), false, 3},
		{"Executive", "高管", "高层查看", execPerms(), false, 4},
		{"Commerce", "电商运营", "电商渠道运营", commercePerms(), false, 5},
	}
	for _, r := range roles {
		permsJSON, _ := json.Marshal(r.Perms)
		isSystem := 0
		if r.IsSystem {
			isSystem = 1
		}
		_, err := db.Exec(ctx,
			`INSERT INTO roles (id,name,description,permissions,is_system,row_permissions,column_permissions,sort_order) VALUES (?,?,?,?,?,?,?,?)`,
			r.ID, r.Name, r.Desc, string(permsJSON), isSystem, "[]", "[]", r.SortOrder)
		if err != nil {
			return err
		}
	}

	g.Log().Infof(ctx, "[seed] Done. users=%d depts=%d roles=%d", len(users), len(depts), len(roles))
	return nil
}

func strPtr(s string) *string { return &s }

func adminPerms() []string {
	return []string{
		"user:list", "user:read", "user:update", "user:impersonate",
		"role:create", "role:update", "role:delete", "role:copy",
		"order:list", "order:read", "order:create", "order:update", "order:delete", "order:approve", "order:submit",
		"customer:list", "customer:read", "customer:create", "customer:update", "customer:delete",
		"product:list", "product:read", "product:create", "product:update", "product:delete",
		"channel:list", "channel:read", "channel:create", "channel:update", "channel:delete",
		"contract:list", "contract:read", "contract:create", "contract:update", "contract:delete",
		"remittance:list", "remittance:read", "remittance:create", "remittance:update", "remittance:delete",
		"invoice:list", "invoice:read", "invoice:create", "invoice:update", "invoice:delete",
		"performance:list", "performance:read",
		"authorization:list", "authorization:read", "authorization:create",
		"delivery:list", "delivery:read", "delivery:create",
		"auditlog:list",
		"opportunity:list", "opportunity:read", "opportunity:create", "opportunity:update", "opportunity:delete",
	}
}

func salesPerms() []string {
	return []string{
		"user:list", "user:read",
		"order:list", "order:read", "order:create", "order:update", "order:delete", "order:submit",
		"customer:list", "customer:read", "customer:create", "customer:update", "customer:delete",
		"product:list", "product:read",
		"channel:list", "channel:read",
		"contract:list", "contract:read",
		"invoice:list", "invoice:read",
		"performance:list", "performance:read",
		"authorization:list", "authorization:read",
		"delivery:list", "delivery:read",
		"opportunity:list", "opportunity:read", "opportunity:create", "opportunity:update", "opportunity:delete",
	}
}

func businessPerms() []string {
	return []string{
		"user:list", "user:read",
		"order:list", "order:read", "order:create", "order:update", "order:approve", "order:submit",
		"customer:list", "customer:read", "customer:create", "customer:update", "customer:delete",
		"product:list", "product:read",
		"channel:list", "channel:read",
		"contract:list", "contract:read", "contract:create", "contract:update", "contract:delete",
		"remittance:list", "remittance:read", "remittance:create", "remittance:update", "remittance:delete",
		"invoice:list", "invoice:read", "invoice:create", "invoice:update", "invoice:delete",
		"performance:list", "performance:read",
		"authorization:list", "authorization:read", "authorization:create",
		"delivery:list", "delivery:read", "delivery:create",
		"auditlog:list",
		"opportunity:list", "opportunity:read", "opportunity:create", "opportunity:update", "opportunity:delete",
	}
}

func techPerms() []string {
	return []string{
		"user:list", "user:read",
		"product:list", "product:read",
		"authorization:list", "authorization:read",
		"delivery:list", "delivery:read",
	}
}

func execPerms() []string {
	return []string{
		"user:list", "user:read",
		"order:list", "order:read",
		"customer:list", "customer:read",
		"product:list", "product:read",
		"channel:list", "channel:read",
		"contract:list", "contract:read",
		"remittance:list", "remittance:read",
		"invoice:list", "invoice:read",
		"performance:list", "performance:read",
		"authorization:list", "authorization:read",
		"delivery:list", "delivery:read",
		"opportunity:list", "opportunity:read",
	}
}

func commercePerms() []string {
	return []string{
		"user:list", "user:read",
		"order:list", "order:read", "order:approve",
		"customer:list", "customer:read",
		"product:list", "product:read",
		"channel:list", "channel:read",
		"contract:list", "contract:read", "contract:create", "contract:update",
		"remittance:list", "remittance:read",
		"invoice:list", "invoice:read",
		"performance:list", "performance:read",
		"authorization:list", "authorization:read",
		"delivery:list", "delivery:read",
		"opportunity:list", "opportunity:read",
	}
}
