# file-object-storage 数据库结构

本文件给出 **`file_object`** 与**业务关联表**在 SQLite / MySQL 双方言下的 DDL 模板。双方言**同一版本号、语义一致**，存放规则见 [itab-db-versioned-migrations/SKILL.md](../../itab-db-versioned-migrations/SKILL.md)。

可直接复制的样板文件：

- [sql/sqlite/NNNNNN_file_object.up.sql](../examples/sql/sqlite/NNNNNN_file_object.up.sql)
- [sql/mysql/NNNNNN_file_object.up.sql](../examples/sql/mysql/NNNNNN_file_object.up.sql)
- [sql/sqlite/NNNNNN_customer_file.up.sql](../examples/sql/sqlite/NNNNNN_customer_file.up.sql)
- [sql/mysql/NNNNNN_customer_file.up.sql](../examples/sql/mysql/NNNNNN_customer_file.up.sql)

> **版本号占位**：样板文件名前缀为 `NNNNNN`。复制时请按目标仓库 `server/manifest/migrate/{sqlite,mysql}/` 下**最大版本号递增**决定实际编号；两个方言用同一个编号。

---

## 1. `file_object`（全局共享元数据表）

### 语义共识（双方言一致）

- 业务表**永远只引用 `file_object.id`**；`bucket/object_key` 不对外暴露。
- `status=0 pending`（已创建预签、等待 commit）/ `status=1 ready`（已落位）/ `status=2 deleted`（软删）。
- `UNIQUE(bucket, object_key)`：同一物理对象**不**允许被两条元数据记录指向不同状态；去重通过 `sha256` 决策，物理复用以业务按需扩展。
- `deleted_at` 仅作软删标记；对象层物理清理由生命周期任务负责。

### MySQL 参考 DDL

```sql
CREATE TABLE IF NOT EXISTS file_object (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  bucket VARCHAR(128) NOT NULL COMMENT '桶名',
  object_key VARCHAR(512) NOT NULL COMMENT 'S3 key；不对外暴露',
  original_name VARCHAR(512) NOT NULL COMMENT '原始文件名；展示用',
  content_type VARCHAR(128) NOT NULL DEFAULT '' COMMENT 'MIME',
  size_bytes BIGINT NOT NULL DEFAULT 0 COMMENT '字节数；pending 态可为 0',
  sha256 CHAR(64) NOT NULL DEFAULT '' COMMENT 'commit 后回填',
  storage_class VARCHAR(32) NOT NULL DEFAULT '' COMMENT '预留：冷热/加密',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '0=pending 1=ready 2=deleted',
  biz_scope VARCHAR(32) NOT NULL COMMENT '业务域；权限分派键',
  owner_user_id BIGINT NOT NULL DEFAULT 0 COMMENT '上传者',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_file_object_bucket_key (bucket, object_key),
  KEY idx_file_object_sha256 (sha256),
  KEY idx_file_object_owner_created (owner_user_id, created_at),
  KEY idx_file_object_scope_status (biz_scope, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用文件对象元数据';
```

### SQLite 参考 DDL

```sql
-- file_object: 通用文件对象元数据（业务表仅引用 id）
-- status: 0=pending 1=ready 2=deleted
CREATE TABLE IF NOT EXISTS file_object (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket VARCHAR(128) NOT NULL,
  object_key VARCHAR(512) NOT NULL,
  original_name VARCHAR(512) NOT NULL,
  content_type VARCHAR(128) NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  sha256 CHAR(64) NOT NULL DEFAULT '',
  storage_class VARCHAR(32) NOT NULL DEFAULT '',
  status INTEGER NOT NULL DEFAULT 0,
  biz_scope VARCHAR(32) NOT NULL,
  owner_user_id INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_file_object_bucket_key
  ON file_object (bucket, object_key);
CREATE INDEX IF NOT EXISTS idx_file_object_sha256
  ON file_object (sha256);
CREATE INDEX IF NOT EXISTS idx_file_object_owner_created
  ON file_object (owner_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_file_object_scope_status
  ON file_object (biz_scope, status);
```

---

## 2. 业务关联：客户 ↔ 文件（多对多）

以"客户资料附件 / 客户图片"为例。若业务侧是**一对一**（如 `avatar`），**不需要**此表，直接在业务表加 `avatar_file_id BIGINT NULL`。

### MySQL 参考 DDL

```sql
CREATE TABLE IF NOT EXISTS customer_file (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL COMMENT '客户 id',
  file_id BIGINT NOT NULL COMMENT '引用 file_object.id',
  category VARCHAR(32) NOT NULL COMMENT 'attachment/photo/contract/...',
  sort_order INT NOT NULL DEFAULT 0,
  remark VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_customer_file (customer_id, file_id, category),
  KEY idx_customer_file_list (customer_id, category, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户-文件 关联';
```

### SQLite 参考 DDL

```sql
-- customer_file: 客户-文件 关联；与 file_object 解耦，便于多对多
CREATE TABLE IF NOT EXISTS customer_file (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  file_id INTEGER NOT NULL,
  category VARCHAR(32) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  remark VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_customer_file
  ON customer_file (customer_id, file_id, category);
CREATE INDEX IF NOT EXISTS idx_customer_file_list
  ON customer_file (customer_id, category, sort_order);
```

---

## 3. 单文件字段（轻量替代）

一对一场景直接在业务表加列，**不建关联表**。示例（MySQL 增量，`ALTER` 做版本化变更）：

```sql
-- MySQL
ALTER TABLE customer
  ADD COLUMN avatar_file_id BIGINT NULL COMMENT '引用 file_object.id；为空表示无头像';
CREATE INDEX idx_customer_avatar_file ON customer (avatar_file_id);
```

```sql
-- SQLite
ALTER TABLE customer ADD COLUMN avatar_file_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_customer_avatar_file ON customer (avatar_file_id);
```

---

## 4. 外键策略

- **MySQL**：是否加 `FOREIGN KEY` 视项目风格统一；本仓库现有表未强制外键，建议**仅用索引 + 应用层校验**，避免物删对象时的级联痛点。
- **SQLite**：默认不强制外键，行为以 `PRAGMA foreign_keys` 为准；保持与 MySQL 一致即可。

---

## 5. 历史库一次性基线

对已有数据库接入本能力：

1. 在 `schema_migrations` 里追加 `file_object` 的版本号（与迁移文件同号）；若通过 `migrate.Up()` / `boot.RunMigrations` 执行，已自动登记。
2. 若历史业务表里已有 `file_url` / `image_url` 这类字段要迁移到 `file_object.id`：
   - 新增 `file_object` 行（`status=ready`，按已存在的 bucket/key 回填）。
   - 新增或回填业务关联（`customer_file` 或 `xxx_file_id`）。
   - 保留旧列一个版本周期，代码读双写改造完成后再做 `DROP COLUMN`（分两次版本迁移）。
