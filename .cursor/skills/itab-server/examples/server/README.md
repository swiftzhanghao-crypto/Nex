---
version: 2026-04-27
---

# itab-server 新项目骨架（examples/server/）

本目录是 **规范级骨架**：所有文件都是主项目 [`server/`](../../../../server/) 下真实文件的 **1:1 快照**，可直接整目录复制到新 Go / GoFrame 后端项目作为起点。

**不是** 示例、**不是** 简化版；任何裁剪都视为偏离契约。演进时本目录与 [`server/`](../../../../server/) 同步更新，且在 `version` 行 bump 日期。

## 必须复制的文件清单

| 源（本目录内相对路径） | 目标（新项目内路径） | 说明 |
|---|---|---|
| `main.go` | `server/main.go` | 入口；必须 `boot.ApplyGFEnv()` 先行 |
| `internal/boot/config_env.go` | `server/internal/boot/config_env.go` | GF_ENV 映射 + `${VAR}` 展开 + test/prod 强校验 |
| `internal/boot/run.go` | `server/internal/boot/run.go` | `Run = Validate → ensureSqlite → Migrate` |
| `internal/boot/migrate.go` | `server/internal/boot/migrate.go` | 版本化 SQL 幂等执行 |
| `internal/boot/sqlite_link.go` | `server/internal/boot/sqlite_link.go` | SQLite link 解析工具 |
| `internal/cmd/cmd.go` | `server/internal/cmd/cmd.go` | `mainFunc` 首行必须 `boot.Run(ctx)` |
| `manifest/config/config.dev.yaml` | `server/manifest/config/config.dev.yaml` | SQLite + 本地 S3；无 `${VAR}` |
| `manifest/config/config.test.yaml` | `server/manifest/config/config.test.yaml` | MySQL + MinIO；敏感项必用 `${VAR}` |
| `manifest/config/config.prod.yaml` | `server/manifest/config/config.prod.yaml` | 同 test，`logger.level` 与 bucket 命名不同 |

## 复制后必做的三件事

1. **替换模块路径**：本目录 .go 文件中的 `it-ai-base/server/...` 全局替换为新项目的 module path（对应新项目 `server/go.mod` 的 `module` 行）。
2. **建迁移目录**：`server/manifest/migrate/sqlite/` 与 `.../mysql/` 两目录必须存在（可先放 `.gitkeep`），否则 `RunMigrations` 启动即报 `migrate dir not found`。
3. **添加 baseline 注释**：在 `server/internal/boot/config_env.go` 文件头加一行：
   ```go
   // baseline: itab-server examples v2026-04-27
   ```
   每次随本目录同步更新时，**务必**也 bump 这个日期。后续 code review 可用它对抗漂移。

## 三环境启动命令（验收）

### dev — 开箱即用（SQLite）

```powershell
# PowerShell
cd server
go run .
```

预期：`./data/sqlite/ledger.db` 自动建；`:8080` 监听。

### test — 需要 MySQL 与 DATABASE_DSN

```powershell
$env:GF_ENV = "test"
$env:DATABASE_DSN = "mysql:root:123456@tcp(127.0.0.1:3306)/it_ai_base?charset=utf8mb4&parseTime=true&loc=Local"
cd server
go run .
```

预期：`schema_migrations` 幂等建表；`:8080` 监听。

### test — 故意不给 DATABASE_DSN（验证强校验）

```powershell
$env:GF_ENV = "test"
Remove-Item Env:DATABASE_DSN -ErrorAction SilentlyContinue
cd server
go run .
```

预期：**立即 Fatal**，信息形如：

```
[FATA] GF_ENV=test 缺失必需环境变量: DATABASE_DSN
    Stack:
    1.  .../boot.ValidateRequiredEnv
        .../server/internal/boot/config_env.go:89
    2.  .../boot.Run
        .../server/internal/boot/run.go:13
```

如果没有 Fatal 而是继续执行，说明 [`config_env.go`](internal/boot/config_env.go) 或 [`run.go`](internal/boot/run.go) 已偏离本骨架——对 diff 定位。

### prod — 同 test

部署平台注入 `GF_ENV=prod` + `DATABASE_DSN` + `STORAGE_*`。

## Drift 自检（强烈建议每次 PR 做一次）

```bash
# 对比本目录与主项目同名文件
diff -r \
  .cursor/skills/itab-server/examples/server/internal/boot/ \
  server/internal/boot/
diff \
  .cursor/skills/itab-server/examples/server/main.go \
  server/main.go
diff -r \
  .cursor/skills/itab-server/examples/server/manifest/config/ \
  server/manifest/config/
```

**预期差异（可接受）**：

- `server/internal/boot/config_env.go` 文件头比 examples 多 4 行 baseline 注释（见本 README「复制后必做」第 3 条）

**不可接受的差异**：函数签名、调用顺序、校验逻辑、yaml 结构性内容。

处理原则：

- 主项目代码先改了但忘记同步 examples → 同步本目录并 bump `version`
- examples 先改了但主项目还没跟进 → 把主项目跟上

**不允许**长期差异存在。

## 为什么不放 go.mod

本目录是主项目的 **文档快照**，不是独立编译单元。依赖版本跟随主项目 [`server/go.mod`](../../../../server/go.mod)。这样避免两套依赖版本漂移的老问题。

IDE / gopls 可能提示这些 .go 文件"不在任何 go module"；这是预期的，忽略即可。

## 结构导航

- [main.go](main.go)
- [internal/boot/config_env.go](internal/boot/config_env.go) — **核心契约**
- [internal/boot/run.go](internal/boot/run.go)
- [internal/boot/migrate.go](internal/boot/migrate.go)
- [internal/boot/sqlite_link.go](internal/boot/sqlite_link.go)
- [internal/cmd/cmd.go](internal/cmd/cmd.go)
- [manifest/config/config.dev.yaml](manifest/config/config.dev.yaml)
- [manifest/config/config.test.yaml](manifest/config/config.test.yaml)
- [manifest/config/config.prod.yaml](manifest/config/config.prod.yaml)

契约条款与故障复盘见上级目录：

- [../../references/contracts.md](../../references/contracts.md)
- [../../references/bootstrap-wiring.md](../../references/bootstrap-wiring.md)
- [../../references/env-and-config.md](../../references/env-and-config.md)
- [../../troubleshooting.md](../../troubleshooting.md)
