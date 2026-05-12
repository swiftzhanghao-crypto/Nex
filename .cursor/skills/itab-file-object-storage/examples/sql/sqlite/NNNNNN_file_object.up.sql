-- file_object: 通用文件对象元数据（业务表仅引用 id）
--
-- 本文件为技能样板，文件名前缀 NNNNNN 为版本号占位；
-- 复制到 server/manifest/migrate/sqlite/ 时，按当前最大版本号递增，
-- 且与 mysql/ 下同内容文件使用相同版本号，详见
-- .cursor/skills/itab-file-object-storage/references/database-schema.md。
--
-- status: 0=pending 1=ready 2=deleted
-- biz_scope: 业务域标签（如 customer_attach / customer_photo），权限分派键
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
