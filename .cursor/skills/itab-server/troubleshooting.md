# 故障复盘

本文件归档 itab-server 演进过程中踩过的真实坑。日志为原始保留（本仓无生产数据）。

每条故障的目标：**下次看到同样的错误信息，能在 60 秒内定位根因**。

## 1. `${DATABASE_DSN}` 占位符未被展开

### 现场

PowerShell 下设置了正确的环境变量：

```powershell
$env:GF_ENV = "prod"
$env:DATABASE_DSN = "mysql:root:123456@tcp(127.0.0.1:3306)/it_ai_base?charset=utf8mb4&parseTime=true&loc=Local"
go run .
```

`echo $env:DATABASE_DSN` 确认值已设置，但启动仍报：

```
2026-04-24T17:11:52.423+08:00 [FATA] {2cc8a4a70340a9181c12b827d177e56e} invalid link configuration: ${DATABASE_DSN}, shuold be pattern like: type:username:password@protocol(host:port)/dbname?param1=value1&...&paramN=valueN
1. invalid link configuration: ${DATABASE_DSN}, shuold be pattern like: ...
   1).  it-ai-base/server/internal/boot.RunMigrations
        D:/code/ksoft/it-ai-base/server/internal/boot/migrate.go:22
   2).  it-ai-base/server/internal/boot.Run
        D:/code/ksoft/it-ai-base/server/internal/boot/run.go:16
```

### 根因

彼时 `config_env.go` 的 `expandConfigEnv` 使用 GoFrame `AdapterFile.SetContent(expanded, filename)` 把展开后的内容塞回 adapter。但 `g.Cfg().MustGet()` 在 `GF_GCFG_FILE=config.prod.yaml` + cwd=`server/` 的组合下**没有命中**内存 content，继续读磁盘原文，于是 `${DATABASE_DSN}` 以字面量流入 MySQL 驱动。

### 修复

改为 `gcfg.NewAdapterContent(expanded)` + `g.Cfg().SetAdapter(adapter)`——把展开后的内容作为 content 型 adapter 整体替换 default adapter，绕开 AdapterFile 的路径/文件名匹配。

对应代码：[examples/server/internal/boot/config_env.go](examples/server/internal/boot/config_env.go) 的 `loadConfigWithEnvExpanded`。

### 快速诊断

看到 `invalid link configuration: ${DATABASE_DSN}`（注意字面量 `${`）：

1. 确认 env 已设：`echo $env:DATABASE_DSN`（PowerShell）或 `echo $DATABASE_DSN`（bash）
2. 若 env 已设但仍报错 → 几乎必然是 `ApplyGFEnv` 没被调用 / 或者用了不可靠的 SetContent 路径
3. 对照 [references/env-and-config.md §3](references/env-and-config.md#3-采用的可靠机制adaptercontent-整体替换) 的四步

## 2. `Unknown table 'xxx.ledger_entry'` — 调试残留 DROP 语句

### 现场

test 环境首次启动（MySQL 全新库）：

```
2026-04-24T17:13:48.393+08:00 [ERRO] {044ba3a61e40a918c021142b7c1eb37e} [ 21 ms] [default] [it_ai_base] [rows:0  ] drop table ledger_entry
Error: Error 1051 (42S02): Unknown table 'it_ai_base.ledger_entry'
Stack:
1.  it-ai-base/server/internal/boot.ensureSchemaMigrations
    D:/code/ksoft/it-ai-base/server/internal/boot/migrate.go:77

2026-04-24T17:13:48.393+08:00 [FATA] drop table ledger_entry: Error 1051 (42S02): Unknown table 'it_ai_base.ledger_entry'
```

### 根因

`migrate.go` 的 `ensureSchemaMigrations` 顶部残留了一段**调试期遗留**的 `DROP TABLE` 代码：

```go
var sqls []string = []string{
    "drop table ledger_entry",
    "drop table schema_migrations",
}
for _, sql := range sqls {
    _, err := db.Exec(ctx, sql)
    if err != nil {
        return err
    }
}
```

这段在调试期用来"每次启动清空"，但：

- 首次部署到全新库时，表根本不存在，直接 1051 错误
- 即便存在，也会**静默清空生产数据**

### 修复

删除整段 `DROP TABLE` 循环，保留后续的 `CREATE TABLE IF NOT EXISTS schema_migrations` 幂等 DDL。

对应代码：[examples/server/internal/boot/migrate.go](examples/server/internal/boot/migrate.go) 的 `ensureSchemaMigrations`。

### 快速诊断

看到 `1051 (42S02)` 且 SQL 是 `drop table *`：

1. `git log -p server/internal/boot/migrate.go` 找到是谁/什么时候加的调试代码
2. 删除它
3. **立刻**对比 `examples/server/internal/boot/migrate.go` 做 drift 检查；如有差异，说明 examples 没跟上，需要同步

## 3. 驱动层才报错 — 缺失 `DATABASE_DSN` 诊断路径长

### 现场（修复 1 之后、加 `ValidateRequiredEnv` 之前）

test 环境忘记设 `DATABASE_DSN`：

```
[FATA] invalid link configuration: , shuold be pattern like: type:username:password@protocol(host:port)/dbname?param1=value1&...
```

（注意：错误里 link 展开后是**空串**，被 MySQL 驱动当非法 DSN 报错。）

Stack 指向 gdb 驱动初始化，而非 `boot/config_env.go`。

### 根因

- `os.ExpandEnv` 展开未设置的变量会替换为空串，不抛错
- MySQL 驱动的错误信息不包含"哪个环境变量缺失"的提示
- 故障堆栈深入到第三方库，定位路径长

### 修复

在 `boot.Run` 首行加 `ValidateRequiredEnv(ctx)`：

- 显式检查 `DATABASE_DSN` env 非空
- 显式检查展开后的 `database.default.link` 不含 `${` 且以 `mysql:` 开头
- 任一不满足 → `g.Log().Fatalf` 并列出具体缺失的变量名

修复后，忘记设变量的报错变成：

```
2026-04-24T19:10:53.279+08:00 [FATA] {981a42448246a9183b07714da9c8eb76} GF_ENV=test 缺失必需环境变量: DATABASE_DSN
Stack:
1.  it-ai-base/server/internal/boot.ValidateRequiredEnv
    D:/code/ksoft/it-ai-base/server/internal/boot/config_env.go:89
2.  it-ai-base/server/internal/boot.Run
    D:/code/ksoft/it-ai-base/server/internal/boot/run.go:13
```

**信息密度："缺哪个" 直接写在错误消息里，Stack 顶层是我们自己的代码。**

对应代码：[examples/server/internal/boot/config_env.go](examples/server/internal/boot/config_env.go) 的 `ValidateRequiredEnv`。

### 快速诊断

看到 `GF_ENV=xxx 缺失必需环境变量: YYY`：

1. 设上对应环境变量即可
2. 若设了还报，先 `echo $env:YYY` 确认当前 shell session 有值（PowerShell env 不跨进程继承）
3. 容器场景：检查部署平台的 env / Secret 是否正确挂载到容器

## 当前基线

修复 1、2、3 后的稳定基线：

- **version**：2026-04-24（与 [examples/server/README.md](examples/server/README.md#version-header) 同步）
- **代码**：`server/internal/boot/` 与 [examples/server/internal/boot/](examples/server/internal/boot/) 全部一致
- **三环境冒烟**全部通过（dev 无 env / test 缺 DSN / test 正确 env 连 MySQL）

## 如何在这里追加新故障

每条故障保留如下结构，便于搜索：

```markdown
## N. <症状的一行摘要>

### 现场
<原始日志片段，不脱敏>

### 根因
<一段 3-5 行说明>

### 修复
<指向具体文件的代码锚点>

### 快速诊断
<症状 → 步骤 1, 2, 3>
```

**日期用 ISO-8601** 的 `YYYY-MM-DD`；故障编号递增不复用。
