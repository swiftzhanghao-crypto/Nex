-- customer_file: 客户-文件 关联表
--
-- 业务一对多 / 多对多时用关联表；一对一（如 avatar_file_id）直接在业务表加列，不用此表。
-- 版本号前缀 NNNNNN 为占位；复制后请与 sqlite/ 下同名文件使用同一版本号。
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
