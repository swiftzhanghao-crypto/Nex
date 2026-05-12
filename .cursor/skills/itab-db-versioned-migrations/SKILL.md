---
name: itab-db-versioned-migrations
description: >-
  it-ai-base 数据库版本化迁移：`manifest/migrate/{sqlite,mysql}/` 双目录、同版本号、`schema_migrations`
  簿记、进程内 `RunMigrations` 引擎（`g.DB()` + 事务；两方言共用执行路径，不引入 `golang-migrate` 依赖）。
  借用 golang-migrate 的仅为 `000001_xxx.up.sql` 文件命名与 `schema_migrations` 表两项约定。
  Use when 数据库迁移、初始化迁移目录、新增 .up.sql、schema_migrations、RunMigrations、
  业务表 DDL 变更、基线接入已有库、gf gen dao 与迁移顺序、MySQL / SQLite 双方言演进。
  启动接线（何时调用 `RunMigrations`）见 .cursor/skills/itab-server/SKILL.md。
---

# 数据库版本化迁移（`manifest/migrate/`）

本 skill 规定：迁移文件**放哪里**、**叫什么名**、**怎么应用**、**不准干什么**。

**启动接线**（`boot.Run` 里何时调用 `RunMigrations`、`ValidateRequiredEnv` / `ensureSqliteParentDir` 与之的先后）交给 [itab-server/SKILL.md](../itab-server/SKILL.md) 的「强制契约（MUST）」与 [itab-server/references/bootstrap-wiring.md](../itab-server/references/bootstrap-wiring.md) 管辖；本 skill 不重复。

## 强制契约（MUST）

1. **落盘**：迁移 SQL 仅放于 `server/manifest/migrate/sqlite/` 与 `server/manifest/migrate/mysql/`；两方言目录**同时存在**（至少一个 `.gitkeep`）
2. **文件名**：正则 `^(\d{6})_.*\.up\.sql$`；6 位递增；同一业务变更两方言**同版本号、语义一致**
3. **执行引擎**：`server/internal/boot/migrate.go` 内进程内执行，MySQL / SQLite **共用**同一 `RunMigrations`；差异仅两处——迁移子目录选择（`mysql` / `sqlite`）与 `schema_migrations` DDL
4. **事务契约**：每条迁移在**一次事务**内执行 SQL 与 `INSERT INTO schema_migrations (version, dirty) VALUES (?, 0)`；`dirty` 硬编码 0
5. **`.down.sql`**：可提交作审计 / 人工回滚凭证；**`RunMigrations` 不识别、不执行**
6. **业务代码禁 DDL**：`CREATE / ALTER / DROP TABLE / INDEX` 只能出现在 `manifest/migrate/*.up.sql`；`migrate.go` 本身除 `schema_migrations` 的 `CREATE TABLE IF NOT EXISTS` 外不得含业务 DDL
7. **依赖禁令**：`server/go.mod` 不得引入 `github.com/golang-migrate/migrate`（任何版本 / 子包）
8. **命令行模式不采用**：全项目不用 `migrate` 二进制 / CLI；不在 Dockerfile / CI 里安装；迁移随应用进程启动自动执行

## 新项目骨架（可整目录复制）

完整可复制的最小骨架位于 [examples/](examples/)，含 `internal/boot/migrate.go` + `manifest/migrate/{sqlite,mysql}/000001_ledger.up.sql`。流程见 [examples/README.md](examples/README.md)：

- 复制清单（每个必须被复制的文件及其最终路径）
- 复制后必做三件事（替换 module path、建两方言目录、加 baseline 注释）
- 三环境启动与验收命令
- Drift 自检 diff

## 索引

| 主题 | 文档 |
|------|------|
| 契约清单（落盘 / 命名 / DDL / 事务 / 依赖禁令） | [references/contracts.md](references/contracts.md) |
| 决策背景（为何进程内 / 为何不执行 down / 基线接入步骤 / 与 `gf gen dao` 顺序） | [references/implementation-notes.md](references/implementation-notes.md) |
| 新项目骨架（整目录复制） | [examples/README.md](examples/README.md) |
| 启动接线（何时调用 `RunMigrations`） | [../itab-server/references/bootstrap-wiring.md](../itab-server/references/bootstrap-wiring.md) |
| 历史故障复盘（调试期 `DROP TABLE` 漂移） | [../itab-server/troubleshooting.md](../itab-server/troubleshooting.md) |
| Go / GoFrame 实现约定 | [../goframe-v2/SKILL.md](../goframe-v2/SKILL.md) |

## 漂移防护

- [examples/README.md](examples/README.md) 顶部 `version` 行是当前基线日期
- 主项目 [`server/internal/boot/migrate.go`](../../../server/internal/boot/migrate.go) 文件头含 `// baseline: itab-db-versioned-migrations examples vYYYY-MM-DD` 注释
- 每次修改 `server/internal/boot/migrate.go` 或本目录 `examples/`，**两边都要 bump**；PR 时执行 [examples/README.md](examples/README.md#drift-自检强烈建议每次-pr-做一次) 的 drift diff
- 业务演进产生的新增 `000002_*.up.sql` / `000003_*.up.sql` **只加到主项目**；`examples/` 的 `000001_ledger.up.sql` 保持为"新项目起点的最小可运行基线"，不跟随业务演进
