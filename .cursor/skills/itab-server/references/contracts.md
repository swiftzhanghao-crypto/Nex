# itab-server 契约清单（MUST）

本文档是**机器可校验**的契约集：函数签名、调用顺序、环境变量、文件位置。任一条款被违反，视为偏离本技能，CI / code review 应拒绝。

**不要把"注释微调"当作改契约**；真正的契约以函数签名 + 调用顺序为准。

## 1. 必须导出的 Go 符号

所有符号位于 `server/internal/boot` 包，对应 [examples/server/internal/boot/](../examples/server/internal/boot/)。

| 符号 | 签名 | 约束 | 源 |
|---|---|---|---|
| `boot.ApplyGFEnv` | `func ApplyGFEnv()` | 无参数，无返回值；失败 panic。必须在 `g.Cfg()` 第一次被读前调用（即 `main` 里 `gctx.New()` 之前） | [examples/server/internal/boot/config_env.go](../examples/server/internal/boot/config_env.go) |
| `boot.Run` | `func Run(ctx context.Context) error` | 必须在 `cmd.mainFunc` 首行调用，早于任何业务 `Init` 与 `s.Run()` | [examples/server/internal/boot/run.go](../examples/server/internal/boot/run.go) |
| `boot.ValidateRequiredEnv` | `func ValidateRequiredEnv(ctx context.Context)` | 必须是 `boot.Run` 的**第一行**；dev 环境跳过；test/prod 缺失变量立即 `g.Log().Fatalf`（不得降级为 warn / return err） | [examples/server/internal/boot/config_env.go](../examples/server/internal/boot/config_env.go) |
| `boot.RunMigrations` | `func RunMigrations(ctx context.Context) error` | 必须在 `boot.Run` 内、`ValidateRequiredEnv` 与 `ensureSqliteParentDir` 之后调用 | [examples/server/internal/boot/migrate.go](../examples/server/internal/boot/migrate.go) |

### 非导出但结构强制的内部函数

| 符号 | 角色 | 不得被合并/绕过的原因 |
|---|---|---|
| `loadConfigWithEnvExpanded(filename) error` | 读 yaml → `os.ExpandEnv` → `gcfg.NewAdapterContent` → `g.Cfg().SetAdapter` | 这四步顺序任意合并都会踩 `AdapterFile.SetContent` 不命中的坑（见 [../troubleshooting.md](../troubleshooting.md#1-databasedsn-占位符未被展开)） |
| `readConfigFile(filename) string` | 先 cwd 下 `manifest/config/<file>`；再回退 GoFrame AdapterFile 的搜索路径 | 容器里 cwd 未必是 `server/`；回退路径保证健壮 |
| `ensureSqliteParentDir(ctx) error` | dev 下解析 `sqlite::@file(./data/sqlite/ledger.db)` 并创建父目录 | 漏此步骤 dev 首次启动会报 `unable to open database file` |

## 2. 调用顺序（MUST）

```
main
 └─ boot.ApplyGFEnv()                       ← ①
 └─ cmd.Main.Run(gctx.New())                ← ②
     └─ cmd.mainFunc
         └─ boot.Run(ctx)                    ← ③ 首行，不得有任何业务代码先于它
             ├─ ValidateRequiredEnv(ctx)     ← ③.1
             ├─ ensureSqliteParentDir(ctx)   ← ③.2
             └─ RunMigrations(ctx)           ← ③.3
         └─ prefix = g.Cfg() "server.pathPrefix"
         └─ s.Group(prefix, ...) 路由注册
         └─ s.Run()
```

**禁止**：

- 把 `ApplyGFEnv` 合并到 `boot.Run`（它必须更早；`boot.Run` 入参 `ctx` 已由 GoFrame 构造，而 `g.Cfg()` 可能在构造 `ctx` 过程中被访问）
- 把 `ValidateRequiredEnv` 移到 `RunMigrations` 之后（错误会被 MySQL 驱动层吞掉 / 误报）
- 把 `boot.Run` 降级为不返回错误（迁移失败必须阻断启动）

## 3. 必需环境变量

| 变量 | 角色 | dev | test | prod | 校验规则 |
|---|---|---|---|---|---|
| `GF_ENV` | 选择 yaml 文件 | 空或 `dev` | `test` | `prod` | 空等同 `dev` |
| `DATABASE_DSN` | 替换 yaml 中 `database.default.link` 的 `${DATABASE_DSN}` | 不用 | **必需** | **必需** | 必须以 `mysql:` 开头；test/prod 下 `database.default.link` 展开后仍含 `${` 将 Fatal |
| `PATH_PREFIX` | 路由组前缀，替换 yaml 中 `server.pathPrefix` 的 `${PATH_PREFIX}` | 可选 | 可选 | 可选 | 缺失时 `os.ExpandEnv` 展开为空串，路由挂根路径；设置时须以 `/` 开头（例如 `/itab/ai-base-demo`） |

### 扩展环境变量的唯一正确姿势

在 [examples/server/internal/boot/config_env.go](../examples/server/internal/boot/config_env.go) 的 `ValidateRequiredEnv` 内，向 `required` 切片追加一项：

```go
required := []string{envDatabaseDSN, "STORAGE_ENDPOINT", "STORAGE_ACCESS_KEY"}
```

同步到主项目 [`server/internal/boot/config_env.go`](../../../../server/internal/boot/config_env.go)，并 bump `examples/server/README.md` 的 `version` 与主项目文件头的 `baseline` 注释。

**禁止**：在别处新增环境变量校验；**禁止**把 `required` 的校验逻辑下放到具体 service 的 `Init`（那样会让"启动即 fail"的语义碎片化）。

## 4. 文件位置

| 路径（相对 cwd=`server/`） | 必需性 | 用途 |
|---|---|---|
| `manifest/config/config.dev.yaml` | MUST | dev 启动配置；除 `${PATH_PREFIX}` 外不含 `${VAR}` |
| `manifest/config/config.test.yaml` | MUST | test 启动配置；敏感项必须 `${VAR}` |
| `manifest/config/config.prod.yaml` | MUST | prod 启动配置；敏感项必须 `${VAR}` |
| `manifest/migrate/sqlite/` | MUST（目录） | dev 环境版本化 SQL |
| `manifest/migrate/mysql/` | MUST（目录） | test/prod 环境版本化 SQL |

**MUST NOT**：

- 把 `config.yaml`（无后缀）作为主配置（历史遗留；不再维护）
- 把真实密码 / 密钥 / token 提交到上述三份 yaml
- 在 `manifest/config/` 以外的位置读配置

## 5. 端口契约

| 用途 | 端口 | 约束 |
|---|---|---|
| 后端 HTTP | `:8080` | 三环境一致；改变需同步更新 [itab-client/SKILL.md](../../itab-client/SKILL.md) 与前端代理配置 |

## 6. 与兄弟 skill 的职责切分

| 主题 | 归属 skill | itab-server 的职责 |
|---|---|---|
| 登录 / SSO | [itab-kso-sso](../../itab-kso-sso/SKILL.md) | 只在 `cmd.mainFunc` 里按 SSO skill 要求调用 `Init` 与 `MiddlewareAuth` |
| 数据库迁移 | [itab-db-versioned-migrations](../../itab-db-versioned-migrations/SKILL.md) | 只负责 `RunMigrations` 触发；SQL 文件形态以迁移 skill 为准 |
| 文件对象存储 | [itab-file-object-storage](../../itab-file-object-storage/SKILL.md) | 只持有 `storage.default.*` 配置；具体上传 / presign 接口以存储 skill 为准 |
| 销售易 CRM | [itab-xiaoshouyi-crm](../../itab-xiaoshouyi-crm/SKILL.md) | 只持有 `crm.xiaoshouyi.*` 配置 |

**禁止**在 `server/internal/boot/` 中实现以上四类的任何业务逻辑。
