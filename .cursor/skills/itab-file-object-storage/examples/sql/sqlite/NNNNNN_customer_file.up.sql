-- customer_file: 客户-文件 关联表
--
-- 业务一对多 / 多对多时用关联表；一对一（如 avatar_file_id）直接在业务表加列，不用此表。
-- 版本号前缀 NNNNNN 为占位；复制后请与 mysql/ 下同名文件使用同一版本号。
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
