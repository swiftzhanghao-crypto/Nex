# NEX 业务平台

面向 WPS 内部销售与商务团队的综合管理系统，覆盖线索获取、商机跟进、订单创建与审批、备货交付到客户档案管理的全业务链路。

---

## 架构概览

项目采用**前后端分离**架构：

```
业务平台/
├── frontend/          # React 前端 SPA
├── backend/           # Go 后端 API 服务
├── data/              # 共享数据（SQLite 数据库）
├── docs/              # 项目文档
└── Makefile           # 构建脚本
```

| 层级 | 技术栈 | 说明 |
|------|--------|------|
| **前端** | React 19 + TypeScript 5.8 + Vite 7 + Tailwind CSS 3 | SPA 应用，HashRouter 路由 |
| **后端** | Go 1.22 + Gin + go-sqlite3 + JWT | RESTful API 服务 |
| **数据库** | SQLite (WAL 模式) | 轻量级嵌入式数据库，15 张业务表 |
| **认证** | JWT + scrypt 密码哈希 | 7 天有效期，RBAC 权限控制 |

---

## 快速启动

### 前置依赖

- **Node.js** >= 18
- **Go** >= 1.22（需开启 CGO：`CGO_ENABLED=1`）

### 1. 启动后端

```bash
cd backend
go mod tidy
DB_PATH=../data/app.db go run ./cmd/server/
# 后端运行在 http://localhost:3001
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
# 前端运行在 http://localhost:5173，API 自动代理到 :3001
```

### 3. 访问系统

打开 `http://localhost:5173`，使用任意用户邮箱 + 密码 `123456` 登录。

| 用户 | 邮箱 | 角色 |
|------|------|------|
| 张伟 | zhangwei@wps.cn | 管理员 |
| 李娜 | lina@wps.cn | 销售经理 |
| 王强 | wangqiang@wps.cn | 商务经理 |
| 赵敏 | zhaomin@wps.cn | 技术工程师 |

---

## 项目结构

### 前端 `frontend/`

```
frontend/
├── index.html              # 入口 HTML（Tailwind CDN + 全局样式）
├── index.tsx               # React 挂载入口
├── App.tsx                 # HashRouter 路由定义 + AppProvider
├── types.ts                # 全局 TypeScript 类型定义
├── vite.config.ts          # Vite 配置（含 API 代理）
├── components/             # 业务组件（按模块分组）
│   ├── layout/             # 布局：顶栏、侧边栏、标签页
│   ├── order/              # 订单管理（17 个组件）
│   ├── product/            # 产品管理（15 个组件）
│   ├── crm/                # 客户关系管理
│   ├── channel/            # 渠道管理
│   ├── performance/        # 绩效管理
│   ├── operations/         # 运营中心
│   ├── system/             # 系统配置（用户/角色/权限）
│   └── common/             # 通用组件
├── contexts/AppContext.tsx  # 全局状态管理
├── hooks/                  # 自定义 Hooks（权限/主题）
├── services/api.ts         # API 客户端（fetch + JWT）
└── data/staticData.ts      # 静态参考数据
```

### 后端 `backend/`

```
backend/
├── cmd/server/main.go       # 服务入口
├── internal/
│   ├── config/database.go   # SQLite 连接与 Schema 定义（15 张表）
│   ├── middleware/auth.go   # JWT 认证 + scrypt 密码哈希
│   ├── rbac/rbac.go         # RBAC 权限矩阵（50+ 权限点）
│   ├── handler/             # API 处理器
│   │   ├── auth.go          # POST /login, GET /me
│   │   ├── user.go          # 用户 CRUD + 角色管理
│   │   ├── order.go         # 订单 CRUD + 审批 + 状态流转
│   │   ├── customer.go      # 客户 CRUD
│   │   ├── product.go       # 产品 CRUD
│   │   ├── channel.go       # 渠道 CRUD
│   │   ├── opportunity.go   # 商机 CRUD
│   │   ├── finance.go       # 合同/回款/发票/业绩/授权/交付/审计
│   │   └── helpers.go       # 工具函数
│   └── seed/seed.go         # 数据库种子数据
├── go.mod / go.sum
└── README.md
```

---

## API 端点

所有 API 均以 `/api` 为前缀，需 JWT 认证（除登录外）。

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/auth/login` | 用户登录 |
| `GET` | `/api/auth/me` | 当前用户信息 |
| `GET/POST/PUT/DELETE` | `/api/users` | 用户管理 |
| `GET/POST/PUT/DELETE` | `/api/users/meta/roles` | 角色管理 |
| `GET/POST/PUT/DELETE` | `/api/orders` | 订单管理 |
| `POST` | `/api/orders/:id/approve` | 订单审批 |
| `POST` | `/api/orders/:id/submit` | 订单提交 |
| `GET/POST/PUT/DELETE` | `/api/customers` | 客户管理 |
| `GET/POST/PUT/DELETE` | `/api/products` | 产品管理 |
| `GET/POST/PUT/DELETE` | `/api/channels` | 渠道管理 |
| `GET/POST/PUT/DELETE` | `/api/opportunities` | 商机管理 |
| `GET/POST/PUT/DELETE` | `/api/finance/contracts` | 合同管理 |
| `GET/POST/PUT/DELETE` | `/api/finance/remittances` | 回款管理 |
| `GET/POST/PUT/DELETE` | `/api/finance/invoices` | 发票管理 |
| `GET` | `/api/finance/performances` | 业绩查询 |
| `GET/POST` | `/api/finance/authorizations` | 授权管理 |
| `GET/POST` | `/api/finance/delivery-infos` | 交付信息 |
| `GET` | `/api/finance/audit-logs` | 审计日志 |

---

## 数据库

SQLite 数据库位于 `data/app.db`，包含 15 张业务表：

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户 | id, name, email, role, department_id |
| `departments` | 部门 | id, name, parent_id |
| `roles` | 角色 | id, name, permissions (JSON), is_system |
| `customers` | 客户 | id, company_name, contacts (JSON), billing_info (JSON) |
| `products` | 产品 | id, name, category, skus (JSON), composition (JSON) |
| `channels` | 渠道 | id, name, type, level, region |
| `opportunities` | 商机 | id, name, customer_id, stage, probability |
| `orders` | 订单 | id, customer_id, status, total, items (JSON), approval (JSON) |
| `contracts` | 合同 | id, code, name, verify_status, amount |
| `remittances` | 回款 | id, type, remitter_name, amount |
| `invoices` | 发票 | id, invoice_title, amount, status |
| `performances` | 业绩 | id, order_id, sales_performance |
| `authorizations` | 授权 | id, auth_code, licensee, product_name |
| `delivery_infos` | 交付信息 | id, delivery_type, order_id, licensee |
| `audit_logs` | 审计日志 | id, user_id, action, resource, detail |

---

## 权限体系

### RBAC 角色

| 角色 | 说明 | 系统内置 |
|------|------|----------|
| Admin | 管理员，全部权限 | 是 |
| Sales | 销售经理 | 否 |
| Business | 商务经理 | 否 |
| Technical | 技术工程师 | 否 |
| Executive | 高管（只读） | 否 |
| Commerce | 电商运营 | 否 |

### 权限矩阵

后端通过 `rbac.go` 中的权限矩阵控制 API 访问，前端通过 `usePermission` Hook 控制界面显示。完整权限清单详见 `功能权限清单.md`。

---

## 构建与部署

### 构建

```bash
# 构建前端
cd frontend && npm run build

# 构建后端（需要 CGO）
cd backend && CGO_ENABLED=1 go build -o nex-server ./cmd/server/
```

### 生产部署

将前端 `frontend/dist/` 产物放入后端可访问目录，Go 后端会自动托管静态文件：

```bash
DB_PATH=./data/app.db STATIC_DIR=./dist GIN_MODE=release ./nex-server
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 后端监听端口 | `3001` |
| `DB_PATH` | SQLite 数据库路径 | `./data/app.db` |
| `JWT_SECRET` | JWT 签名密钥 | 开发用默认值（生产环境必须设置） |
| `CORS_ORIGINS` | 允许的跨域源（逗号分隔） | `localhost:5173,4173` |
| `GIN_MODE` | Gin 运行模式 | `debug` |
| `STATIC_DIR` | 前端静态文件目录 | `./dist` |
| `VITE_API_URL` | 前端 API 地址 | `/api`（通过 Vite 代理） |

---

## 脚本命令

### 前端 `frontend/`

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（含 API 代理） |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | TypeScript 类型检查 |

### 后端 `backend/`

| 命令 | 说明 |
|------|------|
| `go mod tidy` | 下载依赖 |
| `go run ./cmd/server/` | 启动开发服务器 |
| `go build -o nex-server ./cmd/server/` | 编译二进制 |

### Makefile

| 命令 | 说明 |
|------|------|
| `make dev-frontend` | 启动前端开发服务器 |
| `make dev-backend` | 启动后端开发服务器 |
| `make build` | 构建前后端 |
| `make run-prod` | 生产模式运行 |

---

## 文档目录

```
docs/
├── 产品说明文档.md          # 功能模块、数据模型完整说明
├── 设计规范.md              # UI 组件与视觉设计规范
├── 项目结构说明.md          # 前后端详细结构与组件清单
├── 更新日志/                # 每日更新记录
└── 测试报告/                # 功能测试报告与截图
```

| 文档 | 说明 |
|------|------|
| `README.md`（本文件） | 项目总览、架构、快速启动 |
| `backend/README.md` | Go 后端开发指南 |
| `docs/设计规范.md` | 色彩、字体、组件、动画等 UI 规范 |
| `docs/项目结构说明.md` | 前后端详细文件清单与组件状态标记 |
| `功能权限清单.md` | 四级权限树完整定义（99 个权限点） |

---

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^19 | UI 框架 |
| TypeScript | ~5.8 | 类型安全 |
| Vite | ^7 | 构建工具 |
| React Router | ^7 | Hash 路由 |
| Tailwind CSS | ^3 | 原子化 CSS |
| Recharts | ^3 | 数据图表 |
| Lucide React | ^0.554 | 图标库 |
| @tanstack/react-virtual | ^3 | 虚拟列表 |
| react-markdown | ^10 | Markdown 渲染 |
| Zod | ^4 | 数据校验 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Go | 1.22+ | 后端语言 |
| Gin | 1.10 | HTTP 框架 |
| go-sqlite3 | 1.14 | SQLite 驱动（CGO） |
| golang-jwt | 5.x | JWT 认证 |
| x/crypto (scrypt) | — | 密码哈希 |
| gin-contrib/cors | 1.7 | 跨域支持 |
