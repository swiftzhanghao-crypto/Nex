---
version: 2026-04-24
---

# itab-db-versioned-migrations 新项目骨架（examples/）

本目录是 **规范级骨架**：所有文件都是主项目 [`server/`](../../../../server/) 下真实文件的 **1:1 快照**，可直接整目录复制到新 Go / GoFrame 后端项目作为起点。

**不是** 示例、**不是** 简化版；任何裁剪都视为偏离契约。演进时本目录与 [`server/`](../../../../server/) 同步更新，且在 `version` 行 bump 日期。

## 必须复制的文件清单

| 源（本目录内相对路径） | 目标（新项目内路径） | 说明 |
|---|---|---|
| `internal/boot/migrate.go` | `server/internal/boot/migrate.go` | 进程内迁移引擎；`RunMigrations` + `ensureSchemaMigrations` + 两方言 DDL |
| `manifest/migrate/sqlite/000001_ledger.up.sql` | `server/manifest/migrate/sqlite/000001_ledger.up.sql` | SQLite 方言的业务样例 SQL（新项目按需替换表名） |
| `manifest/migrate/mysql/000001_ledger.up.sql` | `server/manifest/migrate/mysql/000001_ledger.up.sql` | MySQL 方言的业务样例 SQL；与 sqlite 同版本号、**语义一致** |

迁移引擎 `RunMigrations` 的接线（`boot.Run` 的调用顺序、与 `ApplyGFEnv` / `ValidateRequiredEnv` 的关系）不在本 skill 职责内，见 [itab-server/references/bootstrap-wiring.md](../../itab-server/references/bootstrap-wiring.md)。

## 复制后必做的三件事

1. **替换模块路径**：`internal/boot/migrate.go` 内的 `it-ai-base/server/...` 视新项目 module path 调整；本文件无显式 import 需改，但后续新增迁移相关 Go 代码请保持一致。
2. **两方言目录必须同时存在**：`server/manifest/migrate/sqlite/` 与 `server/manifest/migrate/mysql/` 都必须有实体目录（至少放一份 `000001_*.up.sql` 或 `.gitkeep`），否则切换环境时 `RunMigrations` 会立即返回 `migrate dir not found`。
3. **添加 baseline 注释**：在 `server/internal/boot/migrate.go` 文件头加：
   ```go
   // baseline: itab-db-versioned-migrations examples v2026-04-24
   ```
   每次随本目录同步更新时，**务必**也 bump 这个日期。后续 code review 可用它对抗漂移。

## 迁移文件命名约定（硬契约）

- 正则：`^(\d{6})_.*\.up\.sql$`（见 [internal/boot/migrate.go:18](internal/boot/migrate.go)）
- 版本号前缀 6 位递增，从 `000001` 开始
- 同一业务变更须在 `sqlite/` 与 `mysql/` 各加**同一版本号**的一组文件；两方言 SQL 语法可不同，**语义须一致**
- `.down.sql` 可提交作审计 / 人工回滚凭证，但 **`RunMigrations` 不会执行**；生产回滚走手工 SQL

细节见 [../references/contracts.md](../references/contracts.md)。

## 三环境启动命令（验收）

### dev — SQLite，首次启动自动建 `schema_migrations` + 应用所有 `.up.sql`

```powershell
cd server
go run .
```

预期日志：

```
migration applied: 000001_ledger.up.sql (1)
```

第二次启动预期：无 `migration applied` 日志（幂等）。

### test — MySQL，首次启动同上

```powershell
$env:GF_ENV = "test"
$env:DATABASE_DSN = "mysql:root:123456@tcp(127.0.0.1:3306)/it_ai_base?charset=utf8mb4&parseTime=true&loc=Local"
cd server
go run .
```

预期：MySQL 实例内出现 `schema_migrations` 表（`bigint / tinyint(1) / InnoDB / utf8mb4`），`ledger_entry` 业务表按 `mysql/000001_ledger.up.sql` 建好。

### 验证迁移目录缺失的 Fatal

```powershell
# 故意把 sqlite 目录移走
Rename-Item server\manifest\migrate\sqlite server\manifest\migrate\sqlite.bak
cd server
go run .
```

预期 Fatal：

```
migrate dir not found: .../server/manifest/migrate/sqlite
```

如果没有 Fatal 而是静默继续，说明 [`migrate.go`](internal/boot/migrate.go) 已偏离本骨架——对 diff 定位。测试完记得改回目录名。

### prod — 同 test

部署平台注入 `GF_ENV=prod` + `DATABASE_DSN`；CI / 发布流程里**不需要**安装 `migrate` 二进制，迁移随应用进程启动自动执行。

## Drift 自检（强烈建议每次 PR 做一次）

```bash
diff \
  .cursor/skills/itab-db-versioned-migrations/examples/internal/boot/migrate.go \
  server/internal/boot/migrate.go

diff -r \
  .cursor/skills/itab-db-versioned-migrations/examples/manifest/migrate/ \
  server/manifest/migrate/
```

**预期差异（可接受）**：

- `server/internal/boot/migrate.go` 文件头比 examples 多 4 行 baseline 注释（见本 README「复制后必做」第 3 条）
- `server/manifest/migrate/{sqlite,mysql}/` 下可能新增了 `000002_*.up.sql`、`000003_*.up.sql`... 这些是业务演进，是预期的

**不可接受的差异**：

- `migrate.go` 中函数签名、文件名正则、`schema_migrations` DDL、`INSERT schema_migrations` SQL 语句被改
- 仓内出现 `github.com/golang-migrate/migrate` 依赖
- `examples/manifest/migrate/` 下的两份 `000001_ledger.up.sql` 与主项目同版本号不一致（版本号 `000001` 是**公共基线**，不可分叉）

处理原则：

- 主项目 `migrate.go` 先改了但忘记同步 examples → 同步本目录并 bump `version`
- examples 先改了但主项目还没跟进 → 把主项目跟上
- 业务新增 `000002_*.up.sql`：**只加到主项目**，examples 的 `000001` 保持为"新项目起点的最小可运行基线"

## 为什么不放 go.mod

本目录是主项目的 **文档快照**，不是独立编译单元。依赖版本跟随主项目 [`server/go.mod`](../../../../server/go.mod)（GoFrame + sqlite/mysql driver，**不含** `github.com/golang-migrate/migrate`）。

IDE / gopls 可能提示 `migrate.go` "不在任何 go module"；这是预期的，忽略即可。

## 结构导航

- [internal/boot/migrate.go](internal/boot/migrate.go) — **核心契约**（进程内迁移引擎）
- [manifest/migrate/sqlite/000001_ledger.up.sql](manifest/migrate/sqlite/000001_ledger.up.sql)
- [manifest/migrate/mysql/000001_ledger.up.sql](manifest/migrate/mysql/000001_ledger.up.sql)

契约条款与决策背景见上级目录：

- [../references/contracts.md](../references/contracts.md)
- [../references/implementation-notes.md](../references/implementation-notes.md)

相关故障复盘（历史 `DROP TABLE` 漂移事件）已收录于：

- [../../itab-server/troubleshooting.md](../../itab-server/troubleshooting.md)
