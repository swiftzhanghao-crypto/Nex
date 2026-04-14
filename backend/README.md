# NEX 业务平台 — Go 后端

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Go | 1.22+ | 后端语言 |
| Gin | 1.10 | HTTP 框架 |
| go-sqlite3 | 1.14 | SQLite 驱动（需要 CGO） |
| golang-jwt/v5 | 5.2 | JWT 认证 |
| x/crypto/scrypt | — | 密码哈希（兼容 Node.js） |
| gin-contrib/cors | 1.7 | 跨域支持 |

## 目录结构

```
backend/
├── cmd/server/main.go          # 入口：CORS、路由注册、静态文件托管
├── internal/
│   ├── config/database.go      # SQLite 连接 + Schema（15 表 + 13 索引）
│   ├── middleware/auth.go      # JWT 签发/验证 + scrypt 密码哈希
│   ├── rbac/rbac.go            # RBAC 权限矩阵（6 角色 × 50+ 操作）
│   ├── handler/                # 路由处理器
│   │   ├── auth.go             # POST /login, GET /me
│   │   ├── user.go             # 用户 + 部门 + 角色 CRUD
│   │   ├── order.go            # 订单 CRUD + 审批 + 状态流转
│   │   ├── customer.go         # 客户 CRUD
│   │   ├── product.go          # 产品 CRUD + 元数据
│   │   ├── channel.go          # 渠道 CRUD
│   │   ├── opportunity.go      # 商机 CRUD + 阶段校验
│   │   ├── finance.go          # 合同/回款/发票/业绩/授权/交付/审计
│   │   └── helpers.go          # 分页、ID 生成、审计日志等工具
│   └── seed/seed.go            # 种子数据（8 用户 + 5 部门 + 6 角色）
├── go.mod
├── go.sum
└── README.md
```

## 开发

```bash
# 安装依赖
go mod tidy

# 启动开发服务器（使用共享数据库）
DB_PATH=../data/app.db go run ./cmd/server/

# 编译为二进制
CGO_ENABLED=1 go build -o nex-server ./cmd/server/

# 运行编译后的二进制
DB_PATH=../data/app.db ./nex-server
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 监听端口 | `3001` |
| `DB_PATH` | SQLite 数据库路径 | `./data/app.db` |
| `JWT_SECRET` | JWT 签名密钥 | 开发用默认值（生产环境必须设置） |
| `CORS_ORIGINS` | 允许的跨域源（逗号分隔） | `localhost:5173,localhost:4173` |
| `GIN_MODE` | Gin 运行模式（`debug` / `release`） | `debug` |
| `STATIC_DIR` | 前端静态文件目录（设置后自动托管） | `./dist` |

## 密码哈希兼容性

后端使用 scrypt 算法，参数与 Node.js `crypto.scryptSync` 默认值一致：

| 参数 | 值 |
|------|-----|
| N (CPU/内存代价) | 16384 |
| r (块大小) | 8 |
| p (并行度) | 1 |
| 密钥长度 | 64 字节 |
| 盐 | 16 字节随机值的 hex 字符串（作为原始字节传入 scrypt） |
| 存储格式 | `{saltHex}:{derivedHex}` |

同时兼容 SHA-256 明文哈希格式（无盐分隔符的旧格式），用于向后兼容。

## API 端点

### 认证（无需 Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录（邮箱 + 密码） |

### 用户（需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/me` | 当前用户信息 |
| GET | `/api/users` | 用户列表 |
| POST | `/api/users` | 创建用户 |
| PUT | `/api/users/:id` | 更新用户 |
| DELETE | `/api/users/:id` | 删除用户 |
| GET | `/api/users/meta/departments` | 部门列表 |
| GET | `/api/users/meta/roles` | 角色列表 |
| POST | `/api/users/meta/roles` | 创建角色 |
| PUT | `/api/users/meta/roles/:id` | 更新角色 |
| DELETE | `/api/users/meta/roles/:id` | 删除角色 |

### 业务数据（需认证 + RBAC）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST/PUT/DELETE | `/api/orders[/:id]` | 订单 CRUD |
| POST | `/api/orders/:id/approve` | 审批订单 |
| POST | `/api/orders/:id/submit` | 提交订单 |
| GET/POST/PUT/DELETE | `/api/customers[/:id]` | 客户 CRUD |
| GET/POST/PUT/DELETE | `/api/products[/:id]` | 产品 CRUD |
| GET/POST/PUT/DELETE | `/api/channels[/:id]` | 渠道 CRUD |
| GET/POST/PUT/DELETE | `/api/opportunities[/:id]` | 商机 CRUD |

### 财务（需认证 + RBAC）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST/PUT/DELETE | `/api/finance/contracts[/:id]` | 合同 |
| GET/POST/PUT/DELETE | `/api/finance/remittances[/:id]` | 回款 |
| GET/POST/PUT/DELETE | `/api/finance/invoices[/:id]` | 发票 |
| GET | `/api/finance/performances` | 业绩列表 |
| GET/POST | `/api/finance/authorizations[/:id]` | 授权 |
| GET/POST | `/api/finance/delivery-infos[/:id]` | 交付信息 |
| GET | `/api/finance/audit-logs` | 审计日志 |
