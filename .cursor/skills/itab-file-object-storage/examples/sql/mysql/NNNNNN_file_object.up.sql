-- file_object: 通用文件对象元数据（业务表仅引用 id）
--
-- 本文件为技能样板，文件名前缀 NNNNNN 为版本号占位；
-- 复制到 server/manifest/migrate/mysql/ 时，按当前最大版本号递增，
-- 且与 sqlite/ 下同内容文件使用相同版本号。
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
