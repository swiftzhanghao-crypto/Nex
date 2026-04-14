package seed

import (
	"encoding/json"
	"log"

	"nex-backend/internal/config"
	"nex-backend/internal/middleware"
)

type user struct {
	ID, AccountID, Name, Email, Phone, Role, UserType, Status string
	DepartmentID                                               string
}

type department struct {
	ID, Name, Description, ParentID string
}

type role struct {
	ID, Name, Description string
	Permissions           []string
	IsSystem              bool
}

func SeedDatabase() {
	db := config.GetDB()

	var count int
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count > 0 {
		log.Println("[seed] 数据库已有数据，跳过种子数据。")
		return
	}

	log.Println("[seed] 开始播种数据库...")
	defaultPwd := middleware.HashPassword("123456")

	users := []user{
		{"u1", "A001", "张伟", "zhangwei@wps.cn", "13800138001", "Admin", "Internal", "Active", "dept1"},
		{"u2", "A002", "李娜", "lina@wps.cn", "13800138002", "Sales", "Internal", "Active", "dept2"},
		{"u3", "A003", "王强", "wangqiang@wps.cn", "13800138003", "Business", "Internal", "Active", "dept3"},
		{"u4", "A004", "赵敏", "zhaomin@wps.cn", "13800138004", "Technical", "Internal", "Active", "dept4"},
		{"u5", "A005", "孙涛", "suntao@wps.cn", "13800138005", "Technical", "Internal", "Active", "dept4"},
		{"u6", "A006", "周琳", "zhoulin@wps.cn", "13800138006", "Sales", "Internal", "Active", "dept2"},
		{"u7", "A007", "吴鹏", "wupeng@wps.cn", "13800138007", "Business", "Internal", "Active", "dept3"},
		{"u8", "A008", "郑华", "zhenghua@wps.cn", "13800138008", "Business", "Internal", "Active", "dept3"},
	}

	insertUser, _ := db.Prepare(`INSERT INTO users (id, account_id, name, email, phone, password_hash, role, user_type, status, department_id) VALUES (?,?,?,?,?,?,?,?,?,?)`)
	for _, u := range users {
		insertUser.Exec(u.ID, u.AccountID, u.Name, u.Email, u.Phone, defaultPwd, u.Role, u.UserType, u.Status, u.DepartmentID)
	}

	depts := []department{
		{"dept1", "管理层", "公司管理层", ""},
		{"dept2", "销售部", "负责产品销售", ""},
		{"dept3", "商务部", "负责商务合作", ""},
		{"dept4", "技术部", "负责技术支持", ""},
		{"dept5", "产品部", "负责产品规划", ""},
	}

	insertDept, _ := db.Prepare(`INSERT INTO departments (id, name, description, parent_id) VALUES (?,?,?,?)`)
	for _, d := range depts {
		var parentID interface{}
		if d.ParentID != "" {
			parentID = d.ParentID
		}
		insertDept.Exec(d.ID, d.Name, d.Description, parentID)
	}

	roles := []role{
		{"Admin", "管理员", "系统管理员，拥有所有权限", []string{
			"user:list", "user:read", "user:update", "role:create", "role:update", "role:delete", "role:copy",
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
		}, true},
		{"Sales", "销售经理", "销售团队管理", []string{
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
		}, false},
		{"Business", "商务经理", "商务合作管理", []string{
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
		}, false},
		{"Technical", "技术工程师", "技术支持和实施", []string{
			"user:list", "user:read",
			"product:list", "product:read",
			"authorization:list", "authorization:read",
			"delivery:list", "delivery:read",
		}, false},
		{"Executive", "高管", "高层管理查看", []string{
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
		}, false},
		{"Commerce", "电商运营", "电商渠道运营管理", []string{
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
		}, false},
	}

	insertRole, _ := db.Prepare(`INSERT INTO roles (id, name, description, permissions, is_system, row_permissions, column_permissions) VALUES (?,?,?,?,?,?,?)`)
	for _, r := range roles {
		permsJSON, _ := json.Marshal(r.Permissions)
		isSystem := 0
		if r.IsSystem {
			isSystem = 1
		}
		insertRole.Exec(r.ID, r.Name, r.Description, string(permsJSON), isSystem, "[]", "[]")
	}

	log.Printf("[seed] 完成。用户: %d, 部门: %d, 角色: %d", len(users), len(depts), len(roles))
	log.Println("[seed] 提示: 生成的业务数据(客户/订单/商机等)请通过已有数据库或运行 TypeScript 种子脚本获取。")
}
