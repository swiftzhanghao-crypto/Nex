# WPS365 业务平台

面向销售与商务团队的综合管理系统：线索、商机、订单、产品、客户、渠道、财务与权限管理。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 19 + TypeScript + Vite 7 | 根目录 SPA，`HashRouter` |
| 后端 | Express 5 + TypeScript (`server/`) | 生产环境由 `tsx server/production.ts` 运行 |
| 数据库 | SQLite WAL (`data/app.db`) | 启动时自动迁移与 seed |
| 测试 | Vitest + Playwright | 单元/接口测试 + E2E |

> **说明**：仓库内另有 `backend/`（Go + Gin）备选实现，**当前生产部署使用 `server/`，请勿与 Go 后端混淆。**

## 快速开始

### 依赖

- Node.js >= 18

### 开发（API 模式，推荐）

```bash
cp .env.example .env
# 编辑 .env：VITE_API_MODE=true

npm install
npm run dev:all    # 同时启动 API :3001 与前端 :5173
```

浏览器打开 http://localhost:5173 ，测试账号：`zhangwei@wps.cn` / `123456`（开发环境）。

### 仅前端（Mock 数据）

```bash
# .env 中 VITE_API_MODE=false（默认）
npm run dev
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 仅 Vite 前端 |
| `npm run dev:server` | 仅 Express API |
| `npm run dev:all` | 前后端并行 |
| `npm run build` | 生产前端构建 |
| `npm run build:api` | API 模式构建（剥离 Mock 大包） |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Vitest 单元/接口测试 |
| `npm run test:coverage` | 测试 + 覆盖率（门控 70%） |
| `npm run test:e2e` | Playwright E2E |
| `npm run db:backup` | SQLite 备份 |
| `npm run db:seed` | 重新播种（慎用） |

## 项目结构

```
业务平台/
├── App.tsx / index.tsx     # 前端入口与路由
├── components/             # 业务组件（order、product、crm、system…）
├── contexts/               # Auth / UI / App 全局状态
├── services/               # API 客户端、错误上报、Web Vitals
├── server/                 # Express API（生产后端）
│   ├── routes/             # 按领域拆分的路由
│   ├── production.ts       # 生产入口（静态资源 + API）
│   └── validate.ts         # Zod 请求校验
├── data/                   # SQLite、staticData（Mock）、generators
├── tests/                  # Vitest 测试
├── e2e/                    # Playwright E2E
├── docs/                   # 产品与开发文档（见 docs/README.md）
├── scripts/                # 部署、备份脚本
└── CHANGELOG.md            # 版本变更摘要
```

## API 与文档

- 健康检查：`GET /api/health`（含 DB、内存）
- 指标：`GET /api/metrics`
- OpenAPI：`GET /api/docs`、`GET /api/docs/ui`（Swagger UI）

## 生产部署

生产服务器使用 `scripts/deploy-prod.ps1`（Windows + PuTTY），服务监听 **4567**，健康检查 `http://<host>:4567/api/health`。

详见 `.cursor/rules/deploy-to-prod.mdc` 与 `scripts/deploy-prod.ps1`。

## 环境变量

见 [.env.example](.env.example)。生产必须设置 `JWT_SECRET`（≥16 字符）。

## 文档索引

完整文档列表见 **[docs/README.md](docs/README.md)**。

| 文档 | 内容 |
|------|------|
| [CHANGELOG.md](CHANGELOG.md) | 近期工程化与功能变更 |
| [docs/业务上下文.md](docs/业务上下文.md) | 业务域说明 |
| [docs/设计规范.md](docs/设计规范.md) | UI 设计规范 |
| [docs/功能权限清单.md](docs/功能权限清单.md) | RBAC 权限树 |
| [docs/开放API-订单下单.md](docs/开放API-订单下单.md) | 订单开放接口说明 |
