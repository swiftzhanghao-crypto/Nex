# 实现决策背景（implementation-notes）

本文档记录"为什么这样实现"的**主动决策**，避免后续维护者误以为现状是"被迫妥协"而尝试切换方案。

契约性条款（必须遵守的硬约束）不在这里，见 [contracts.md](contracts.md)。

## 1. 为什么用进程内 `g.DB()` 而非 `golang-migrate` 的 Go API / CLI

**主动选择**，不是 CGO 被迫。理由按优先级：

1. **零额外依赖**。`golang-migrate/migrate/v4` + `database/mysql` 子驱动会拖进 5~8 个额外间接依赖（自带的 `mysql` / `pq` 驱动版本与 GoFrame 的 driver 版本不一致，曾踩过"同 DSN 两种连接池行为"的坑）。进程内实现仅需 GoFrame 本体 + `regexp` / `sort`，约 120 行 Go，**零新增依赖**
2. **SQLite 驱动链统一**。GoFrame 的 `contrib/drivers/sqlite` 走的是 `modernc.org/sqlite`（pure Go，无 CGO）；而 `golang-migrate` 的 `database/sqlite3` 走 `mattn/go-sqlite3`（CGO）。若同时引入，两份驱动并存，SQLite 文件锁行为不一致，Windows 上 CI 易卡死
3. **启动期集成更干净**。进程内实现直接读 `g.Cfg().MustGet(ctx, "database.default.link")` 分支方言；而 CLI 方案需要在 `Dockerfile` / CI 脚本里再挑一次 DSN，容易与 yaml 里的配置失同步
4. **命名与状态表约定保留了前向兼容**。文件名 `000001_xxx.up.sql` 与 `schema_migrations` 表结构都严格按 `golang-migrate` 的格式；若未来有必要切回 `golang-migrate`，既有迁移文件与状态表可无缝承接

**已放弃的诱惑**：

- "MySQL 用 golang-migrate、SQLite 用自写"：**否**。两方言分叉会让 `ensureSchemaMigrations` / 已应用版本加载 / 文件扫描各写两遍，测试面翻倍。现实现用 `mysql bool` 参数切换 DDL 这一处差异即可
- "把 CLI 作为备选方案保留在文档里"：**否**。保留即诱导；一旦文档里有 `migrate -path ... up`，Dockerfile 作者就会加 `RUN apt install migrate`。**本项目只有一种运行方式**

## 2. 为什么不执行 `.down.sql`

共享数据库环境下**自动 down 是危险动作**——一次误回滚可能清空生产表。决策：

- `.down.sql` **可以**提交（作审计 / 人工回滚凭证 / 对 SQL review 友好）
- `RunMigrations` **不识别、不执行**（正则 `^(\d{6})_.*\.up\.sql$` 把 down 过滤掉）
- 需要回滚时：DBA 手工读对应 `.down.sql`、review 后人工执行，同时手工 `DELETE FROM schema_migrations WHERE version = ?`

**代价**：本项目没有"一键本地回滚"体验。这是**刻意**的；PR 评审里应偏好"新增补偿性迁移"而不是"回滚"。

## 3. 业务代码禁止 DDL

历史漂移（见 [../../itab-server/troubleshooting.md](../../itab-server/troubleshooting.md)）里曾出现：

- `migrate.go` 里临时加 `DROP TABLE ledger_entry` 做调试
- 业务 `Init` 里 `CREATE TABLE IF NOT EXISTS` 做"懒建表"

两种都是**禁止**模式。硬规则：

- `CREATE TABLE` / `ALTER TABLE` / `DROP TABLE` / `CREATE INDEX` / `ALTER INDEX` / `DROP INDEX` 只能出现在 `server/manifest/migrate/{sqlite,mysql}/` 下的 `.up.sql` 里
- 调试期脏写必须在 PR 合并前清掉；code review 第一关是 `rg "DROP TABLE|DROP INDEX" server/internal/` 零命中
- `migrate.go` 本身（除 `schema_migrations` 的 `CREATE TABLE IF NOT EXISTS` 外）**不应**包含任何业务表 DDL

## 4. 基线接入（对已有数据库首次启用本迁移方案）

**场景 A：空库**。什么都不做；首次启动 `RunMigrations` 会自动建 `schema_migrations` + 应用 `000001 → 000NNN` 全部。

**场景 B：已有数据 + 已有表，首次接入**。步骤：

1. 用 `mysqldump --no-data` / `.schema` 等方式把当前库的 DDL 导出
2. 按导出结果写一份 `server/manifest/migrate/sqlite/000001_baseline.up.sql` 与对应 `mysql/000001_baseline.up.sql`
3. **首次启动前**手工在目标库执行：

   ```sql
   CREATE TABLE IF NOT EXISTS schema_migrations (
     version bigint NOT NULL,
     dirty tinyint(1) NOT NULL,
     PRIMARY KEY (version)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

   INSERT INTO schema_migrations (version, dirty) VALUES (1, 0);
   ```

   （SQLite 同理，DDL 换成 SQLite 版本）

4. 启动应用；`RunMigrations` 看到 `version=1` 已 applied，跳过 `000001_baseline.up.sql`，从 `000002` 开始继续

**踩过的坑**：

- 跳过步骤 3 → `000001_baseline.up.sql` 会被当作新迁移执行，对已有表 `CREATE TABLE` 失败（MySQL 报 `Table 'xxx' already exists`，SQLite 若 DDL 不含 `IF NOT EXISTS` 也会 Fatal）
- 步骤 3 插错版本号（例如 `INSERT ... VALUES (0, 0)`）→ `000001` 会被误认未应用，仍然执行，同上

**建议的保险**：所有 `000001_baseline.up.sql` 内部 DDL 都加 `IF NOT EXISTS`；即使 `schema_migrations` 没对齐，最坏情况也只是"什么都没做"而不是 Fatal。

## 5. 与 `gf gen dao` 的顺序

固定顺序，不可颠倒：

1. 写 `server/manifest/migrate/{sqlite,mysql}/000NNN_*.up.sql`
2. 本地 / CI 启动一次应用（或手工对目标库执行迁移），让 `schema_migrations` 与业务表真正存在
3. 运行 `gf gen dao` 生成 / 更新 `internal/dao/`、`internal/model/entity/`、`internal/model/do/`
4. 编写业务 `service` 消费生成物
5. 提交 SQL + Go 生成物 + 业务代码作为**同一个 PR**

**反模式**：先写 `service` 引用不存在的字段，再补 `.up.sql`。结果是本地能编译（`entity` 里假装有字段）但生产库缺列，运行时报 `Unknown column`。
