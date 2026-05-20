# Changelog

## [Unreleased]

### Added
- JWT refresh token 与 token 黑名单
- CSRF 防护（Origin/Referer 校验）
- 深度健康检查 `/api/health`（DB + 内存）
- 运行时指标 `/api/metrics`、Web Vitals 上报
- OpenAPI 文档 `/api/docs` 与 Swagger UI
- 审计日志查询（`/api/audit` + 管理界面）
- 客户/产品批量导入（`/api/import`）
- 站内通知系统
- GitHub Actions CI + 覆盖率门控（70%）
- 121 项自动化测试 + E2E 登录场景

### Changed
- 请求体限制 1mb（开发）/ 2mb（生产）
- 结构化日志支持按日写入 `logs/app-YYYY-MM-DD.log`
- 拆分巨型组件：OrderManager、OrderDetails、ProductCreateWizard、UserManager
- AppContext 拆分为 Auth / UI / App 三层

### Security
- Zod 校验覆盖全部主要写接口
- 消灭前端 any 类型；后端 any 大幅减少
