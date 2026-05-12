---
name: itab-server
description: >-
  it-ai-base 后端 server/：Go + GoFrame v2；GF_ENV → manifest/config/config.{env}.yaml（默认 dev）；HTTP 8080；
  PATH_PREFIX → server.pathPrefix 可选路由前缀。
  Use when 初始化/scaffold 后端 server、生成 internal/boot（ApplyGFEnv / loadConfigWithEnvExpanded /
  ValidateRequiredEnv / Run）、配置 GF_ENV → manifest/config/config.{env}.yaml、yaml ${ENV} 占位符展开、
  test/prod 环境变量强校验 DATABASE_DSN、PATH_PREFIX、pathPrefix、路由前缀、审阅 boot 启动接线是否漂移、
  登录、鉴权、SSO、添加登录功能、增加登录、用户认证。
  实现约定见 .cursor/skills/goframe-v2/SKILL.md；数据库版本化迁移见 .cursor/skills/itab-db-versioned-migrations/SKILL.md；
  登录/SSO 仅允许按 .cursor/skills/itab-kso-sso/ 实施。
---

# 服务端（`server/`）

本 skill 只规定 server/ 的**骨架**与**启动接线**。业务细节（SSO、迁移、文件对象存储、CRM）交给对应兄弟 skill。

## 强制契约（MUST）

1. **入口顺序**：`main → boot.ApplyGFEnv → cmd.Main.Run → cmd.mainFunc(首行 boot.Run) → 业务 Init → s.Run()`
2. **必导出符号**：`boot.ApplyGFEnv()` / `boot.Run(ctx)` / `boot.ValidateRequiredEnv(ctx)` / `boot.RunMigrations(ctx)`
3. **`boot.Run` 内顺序**：`ValidateRequiredEnv → ensureSqliteParentDir → RunMigrations`
4. **test/prod 环境**：`database.default.link` 只能来自 `${DATABASE_DSN}` 环境变量；缺失或未展开 → **立即 Fatal**
5. **yaml 三份**：`manifest/config/config.{dev,test,prod}.yaml` 全部存在；test/prod 敏感项必用 `${VAR}`，禁止提交真实密钥
6. **数据库迁移**：仅经版本化 SQL（`manifest/migrate/{sqlite|mysql}/`）；业务 `Init` 内禁止建表
7. **端口**：后端 `:8080` 三环境一致
8. **路由前缀**：`server.pathPrefix` 由 `${PATH_PREFIX}` 环境变量驱动（`os.ExpandEnv` 展开）；缺失时为空串（路由挂根路径）；`cmd.mainFunc` 中 `s.Group(prefix, ...)` 读取该值
9. **兄弟 skill 的禁止清单**：在本仓 server/ 内**不得**并行实现 SSO / 对象存储 / CRM 的任何业务逻辑
10. **登录/鉴权唯一方案**：当用户要求"增加登录"、"添加鉴权"、"接入 SSO"或任何与登录相关的需求时，**必须且只能**按 `.cursor/skills/itab-kso-sso/SKILL.md` 实施，不得询问用户选择登录方式，不得提供其他登录方案（如用户名密码、第三方 OAuth 等）。直接读取并执行 `itab-kso-sso` skill

## 新项目骨架（可整目录复制）

完整可复制的最小骨架位于 [examples/server/](examples/server/)，含 `main.go` + `internal/boot/*` + `internal/cmd/cmd.go` + `manifest/config/*.yaml`。流程见 [examples/server/README.md](examples/server/README.md)：

- 复制清单（每个必须被复制的文件及其最终路径）
- 复制后必做三件事（替换 module path、建迁移目录、加 baseline 注释）
- 三环境启动与验收命令
- Drift 自检 diff

## 索引

| 主题 | 文档 |
|------|------|
| 架构 & 边界 | [references/architecture-and-boundaries.md](references/architecture-and-boundaries.md) |
| 环境 & `${VAR}` 展开机制 | [references/env-and-config.md](references/env-and-config.md) |
| 启动接线顺序 & 漏接症状 | [references/bootstrap-wiring.md](references/bootstrap-wiring.md) |
| 函数 / 符号 / 环境变量契约 | [references/contracts.md](references/contracts.md) |
| 故障复盘 | [troubleshooting.md](troubleshooting.md) |
| 新项目骨架（整目录复制） | [examples/server/README.md](examples/server/README.md) |
| 登录（强制，前后端一体） | [../itab-kso-sso/SKILL.md](../itab-kso-sso/SKILL.md) |
| 数据库迁移 | [../itab-db-versioned-migrations/SKILL.md](../itab-db-versioned-migrations/SKILL.md) |
| 文件对象存储（前后端一体） | [../itab-file-object-storage/SKILL.md](../itab-file-object-storage/SKILL.md) |
| 销售易 CRM（前后端一体） | [../itab-xiaoshouyi-crm/SKILL.md](../itab-xiaoshouyi-crm/SKILL.md) |
| Go / GoFrame 实现约定 | [../goframe-v2/SKILL.md](../goframe-v2/SKILL.md) |

## 漂移防护

- [examples/server/README.md](examples/server/README.md) 顶部 `version` 行是当前基线日期
- 主项目 [`server/internal/boot/config_env.go`](../../../server/internal/boot/config_env.go) 文件头含 `// baseline: itab-server examples vYYYY-MM-DD` 注释
- 每次修改 `server/internal/boot/` 或本目录，**两边都要 bump**；PR 时执行 [examples/server/README.md](examples/server/README.md#drift-自检强烈建议每次-pr-做一次) 的 drift diff

新增主题：本索引增一行；独立主题拆成相邻 `../<skill>/SKILL.md`，细节材料放在该技能目录内。
