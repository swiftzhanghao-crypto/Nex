# 环境选择与配置展开机制

本文回答两个问题：

1. `GF_ENV` 如何决定加载哪份 yaml？
2. yaml 里的 `${DATABASE_DSN}` 等占位符如何被**可靠**展开？为何不用 GoFrame 自带的 `AdapterFile.SetContent`？

## 1. GF_ENV → yaml 文件名映射

由 [`boot.ApplyGFEnv`](../examples/server/internal/boot/config_env.go) 执行：

| `GF_ENV` | 加载文件 | 数据库 | 对象存储 |
|---|---|---|---|
| 空 或 `dev` | `manifest/config/config.dev.yaml` | SQLite（`./data/sqlite/ledger.db`） | 本地 bbolt-store-s3（`./data/s3/`） |
| `test` | `manifest/config/config.test.yaml` | MySQL（由 `DATABASE_DSN` 注入） | MinIO（由 `STORAGE_*` 注入） |
| `prod` | `manifest/config/config.prod.yaml` | MySQL | MinIO |
| 其他（含拼写错误） | **不加载任何文件，直接 return** | — | — |

**"拼写错误即静默返回"的风险**：`GF_ENV=PROD`（大写）或 `GF_ENV=production` 都会导致 `ApplyGFEnv` 走 `default:` 分支什么都不做，后续 `g.Cfg()` 读到的是 GoFrame 默认 `config.yaml`（可能不存在或内容过期）。

**防御**：建议在部署平台的环境变量 schema 层面只允许枚举 `dev|test|prod`（例如 Docker Compose 写死、K8s ConfigMap 校验）。

## 2. `${VAR}` 展开：为何不用 GoFrame 自带机制

GoFrame `gcfg` 的配置文件里使用 `${VAR}` **不是**内置特性：

- GoFrame 有"查询时 env fallback"：`g.Cfg().Get("database.default.link")` 如果 key 在文件中**不存在**，会按 `DATABASE_DEFAULT_LINK` 去读 env。但 key **存在**（值是字面量 `${DATABASE_DSN}`）时，这条 fallback 不触发。
- GoFrame 支持 `AdapterFile.SetContent(content, filename)` 替换内存内容。实测在 `GF_GCFG_FILE=config.prod.yaml` 下，`SetContent("<expanded>", "config.prod.yaml")` 与后续 `g.Cfg().MustGet()` 的路径匹配**不稳定**，在某些 cwd 组合下 `MustGet` 仍然读到磁盘原文（见 [../troubleshooting.md](../troubleshooting.md#1-databasedsn-占位符未被展开)）。

## 3. 采用的可靠机制：AdapterContent 整体替换

[`loadConfigWithEnvExpanded`](../examples/server/internal/boot/config_env.go) 的实现分四步：

1. **读原文**：优先 `manifest/config/<filename>`，失败回退 GoFrame `AdapterFile.GetFilePath`
2. **展开**：`os.ExpandEnv(raw)` 把所有 `${VAR}` 用 `os.Getenv(VAR)` 替换；未设置的变量替换为空串
3. **建 adapter**：`gcfg.NewAdapterContent(expanded)` 创建一个**无磁盘依赖**的 content 型 adapter
4. **注入**：`g.Cfg().SetAdapter(adapter)` 整体替换默认 adapter

之后 `g.Cfg().MustGet()` 所有查询都走内存里这份展开后的内容，**绕开**所有磁盘/文件名/cwd 相关的歧义。

### 为什么顺序不能动

- ②→① 互换：会把 `${VAR}` 当作 yaml key 的一部分存进 adapter，查询时仍是字面量
- ③→② 互换：yaml 解析在 `NewAdapterContent` 内部进行，必须先拿到展开后的纯文本
- ④ 缺失：adapter 没被注册，`g.Cfg()` 继续走老的 `AdapterFile`

这四步就是 [`loadConfigWithEnvExpanded`](../examples/server/internal/boot/config_env.go) 的函数体，任何"我来把它精简一下"的冲动都会导致回归故障。

## 4. `os.ExpandEnv` 的两个坑

### 坑一：未设置的变量 → 空串

```yaml
link: "${DATABASE_DSN}"   # 若 env 未设置
# 展开后 →
link: ""
```

空串传给 MySQL 驱动会报 `invalid link configuration: ...`，错误信息对定位根因**没有帮助**。

**兜底**：[`ValidateRequiredEnv`](../examples/server/internal/boot/config_env.go) 在 test/prod 下检查：

- `DATABASE_DSN` 环境变量非空
- 展开后的 `database.default.link` **不以 `${` 开头**且**以 `mysql:` 开头**

任一不满足立即 `g.Log().Fatalf`。

**有意为之的空串**：`server.pathPrefix` 使用 `${PATH_PREFIX}`，未设置时展开为空串是**预期行为**（路由挂根路径）。此变量不加入 `ValidateRequiredEnv` 的强校验。

### 坑二：`$$` 不转义

`os.ExpandEnv` 遇到 `$$` 并不像 shell 那样转为 `$`。如果未来有 yaml 值需要字面量 `$`（罕见场景），要么改用 `os.Expand` 自定义 mapping，要么在 yaml 里用 `\u0024` 之类的绕开。目前 3 份 yaml 无此需求，不做处理。

## 5. `server.pathPrefix`：可选路由前缀

三份 yaml 的 `server` 段均含 `pathPrefix: "${PATH_PREFIX}"`。`cmd.mainFunc` 在 `boot.Run` 之后读取该值并传给 `s.Group(prefix, ...)`：

```go
prefix := strings.TrimSpace(g.Cfg().MustGet(ctx, "server.pathPrefix").String())
s.Group(prefix, func(group *ghttp.RouterGroup) { ... })
```

| `PATH_PREFIX` 环境变量 | 展开结果 | 路由效果 |
|---|---|---|
| 未设置 | 空串 `""` | 路由挂根路径（`/api/ledger` 等） |
| `/itab/ai-base-demo` | `/itab/ai-base-demo` | 路由前缀为 `/itab/ai-base-demo`（`/itab/ai-base-demo/api/ledger` 等） |

GoFrame 的 `s.Group("")` 等价于 `s.Group("/")`，行为正确。

## 6. dev 环境为何也走同一路径

即使 `config.dev.yaml` 没有任何 `${VAR}`，`ApplyGFEnv` 在 dev 下仍然执行完整的「读 → ExpandEnv → NewAdapterContent → SetAdapter」流程。好处：

- **路径单一**：三环境的配置加载流程完全一致，调试 / 日志位置可预测
- **对齐测试**：在 dev 下手动设置一个 `${VAR}` 做验证，行为与 prod 一致

## 7. 常见 FAQ

**Q：能不能把敏感配置放 Vault / 配置中心而不是 env？**
A：可以，但必须在 `ApplyGFEnv` 之前把值写回 `os.Setenv(...)`，使 `os.ExpandEnv` 能读到。或者实现一个新的 `loadConfigFromXxx`，但那超出本 skill 范围，需要同步更新 [contracts.md](contracts.md)。

**Q：`dev` 下我想临时切到 MySQL，怎么办？**
A：直接设置 `GF_ENV=test` + `DATABASE_DSN`，不要改 `config.dev.yaml`。`config.dev.yaml` 是"无 env 依赖"的契约，污染它会破坏 onboarding 体验。

**Q：能加一个 `.env` 文件自动加载？**
A：本技能目前不内置。如确需，在 `boot.ApplyGFEnv` 最前面加一行 `_ = godotenv.Load()` 即可，但需同步更新 [contracts.md](contracts.md) 并在 `server/go.mod` 加依赖。

## 8. 关联文档

- 调用顺序与漏接症状：[bootstrap-wiring.md](bootstrap-wiring.md)
- 函数契约：[contracts.md](contracts.md)
- 真实故障复盘：[../troubleshooting.md](../troubleshooting.md)
- 代码锚点：[../examples/server/internal/boot/config_env.go](../examples/server/internal/boot/config_env.go)
