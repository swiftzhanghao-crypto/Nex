-- 000001_initial_schema.up.sql (MySQL)
-- Equivalent schema for MySQL dialect

CREATE TABLE IF NOT EXISTS `users` (
  `id`            VARCHAR(64) NOT NULL PRIMARY KEY,
  `account_id`    VARCHAR(64) NOT NULL,
  `name`          VARCHAR(128) NOT NULL,
  `email`         VARCHAR(256) NOT NULL UNIQUE,
  `phone`         VARCHAR(32),
  `password_hash` VARCHAR(256) NOT NULL DEFAULT '',
  `role`          TEXT NOT NULL,
  `user_type`     VARCHAR(32) NOT NULL DEFAULT 'Internal',
  `status`        VARCHAR(32) NOT NULL DEFAULT 'Active',
  `avatar`        TEXT,
  `department_id` VARCHAR(64),
  `month_badge`   VARCHAR(64),
  `wps_user_id`   VARCHAR(128),
  `sort_order`    INT NOT NULL DEFAULT 0,
  `channel_id`    VARCHAR(64),
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_users_wps_user_id` (`wps_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `departments` (
  `id`          VARCHAR(64) NOT NULL PRIMARY KEY,
  `name`        VARCHAR(128) NOT NULL,
  `description` TEXT,
  `parent_id`   VARCHAR(64),
  FOREIGN KEY (`parent_id`) REFERENCES `departments`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `roles` (
  `id`                 VARCHAR(64) NOT NULL PRIMARY KEY,
  `name`               VARCHAR(128) NOT NULL,
  `description`        TEXT NOT NULL,
  `permissions`        JSON NOT NULL,
  `is_system`          TINYINT(1) NOT NULL DEFAULT 0,
  `row_permissions`    JSON NOT NULL,
  `row_logic`          JSON NOT NULL,
  `column_permissions` JSON NOT NULL,
  `app_permissions`    JSON NOT NULL,
  `sort_order`         INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `customers` (
  `id`               VARCHAR(64) NOT NULL PRIMARY KEY,
  `company_name`     VARCHAR(256) NOT NULL,
  `industry`         VARCHAR(128) NOT NULL,
  `customer_type`    VARCHAR(64) NOT NULL,
  `level`            VARCHAR(64) NOT NULL,
  `region`           VARCHAR(128) NOT NULL,
  `address`          TEXT NOT NULL,
  `shipping_address` TEXT NOT NULL,
  `status`           VARCHAR(32) NOT NULL DEFAULT 'Active',
  `logo`             TEXT,
  `contacts`         JSON NOT NULL,
  `billing_info`     JSON,
  `owner_id`         VARCHAR(64),
  `owner_name`       VARCHAR(128),
  `enterprises`      JSON NOT NULL,
  `next_follow_up`   DATETIME,
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `products` (
  `id`            VARCHAR(64) NOT NULL PRIMARY KEY,
  `name`          VARCHAR(256) NOT NULL,
  `category`      VARCHAR(128) NOT NULL,
  `sub_category`  VARCHAR(128),
  `description`   TEXT,
  `status`        VARCHAR(32) NOT NULL DEFAULT 'OnShelf',
  `tags`          JSON NOT NULL,
  `skus`          JSON NOT NULL,
  `composition`   JSON NOT NULL,
  `install_pkgs`  JSON NOT NULL,
  `package_id`    VARCHAR(64),
  `rights`        JSON NOT NULL,
  `license_tpl`   TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `channels` (
  `id`             VARCHAR(64) NOT NULL PRIMARY KEY,
  `name`           VARCHAR(256) NOT NULL,
  `type`           VARCHAR(64) NOT NULL,
  `level`          VARCHAR(64) NOT NULL,
  `contact_name`   VARCHAR(128) NOT NULL,
  `contact_phone`  VARCHAR(32) NOT NULL,
  `email`          VARCHAR(256) NOT NULL,
  `region`         VARCHAR(128) NOT NULL,
  `status`         VARCHAR(32) NOT NULL DEFAULT 'Active',
  `agreement_date` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `opportunities` (
  `id`                VARCHAR(64) NOT NULL PRIMARY KEY,
  `crm_id`            VARCHAR(64),
  `name`              VARCHAR(256) NOT NULL,
  `customer_id`       VARCHAR(64) NOT NULL,
  `customer_name`     VARCHAR(256) NOT NULL,
  `product_type`      VARCHAR(128),
  `products`          JSON,
  `stage`             VARCHAR(64) NOT NULL DEFAULT '需求判断',
  `probability`       DECIMAL(5,2) NOT NULL DEFAULT 0,
  `department`        VARCHAR(128),
  `amount`            DECIMAL(15,2),
  `expected_revenue`  DECIMAL(15,2) NOT NULL DEFAULT 0,
  `final_user_rev`    DECIMAL(15,2),
  `close_date`        DATE NOT NULL,
  `owner_id`          VARCHAR(64) NOT NULL,
  `owner_name`        VARCHAR(128) NOT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orders` (
  `id`                  VARCHAR(64) NOT NULL PRIMARY KEY,
  `customer_id`         VARCHAR(64) NOT NULL,
  `customer_name`       VARCHAR(256) NOT NULL,
  `customer_type`       VARCHAR(64),
  `customer_level`      VARCHAR(64),
  `customer_industry`   VARCHAR(128),
  `customer_region`     VARCHAR(128),
  `date`                DATE NOT NULL,
  `status`              VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL',
  `total`               DECIMAL(15,2) NOT NULL DEFAULT 0,
  `items`               JSON NOT NULL,
  `source`              VARCHAR(64) NOT NULL DEFAULT 'Sales',
  `buyer_type`          VARCHAR(64) NOT NULL DEFAULT 'Customer',
  `buyer_name`          VARCHAR(256),
  `buyer_id`            VARCHAR(64),
  `shipping_address`    TEXT,
  `delivery_method`     VARCHAR(64),
  `is_paid`             TINYINT(1) NOT NULL DEFAULT 0,
  `payment_date`        DATETIME,
  `payment_method`      VARCHAR(64),
  `payment_terms`       VARCHAR(128),
  `payment_record`      JSON,
  `approval`            JSON NOT NULL,
  `approval_records`    JSON NOT NULL,
  `sales_rep_id`        VARCHAR(64),
  `sales_rep_name`      VARCHAR(128),
  `biz_manager_id`      VARCHAR(64),
  `biz_manager_name`    VARCHAR(128),
  `invoice_info`        JSON,
  `acceptance_info`     JSON,
  `acceptance_config`   JSON,
  `opportunity_id`      VARCHAR(64),
  `opportunity_name`    VARCHAR(256),
  `original_order_id`   VARCHAR(64),
  `refund_reason`       TEXT,
  `refund_amount`       DECIMAL(15,2),
  `order_remark`        TEXT,
  `extra`               JSON NOT NULL,
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `contracts` (
  `id`              VARCHAR(64) NOT NULL PRIMARY KEY,
  `code`            VARCHAR(128) NOT NULL,
  `name`            VARCHAR(256) NOT NULL,
  `external_code`   VARCHAR(128),
  `contract_type`   VARCHAR(64) NOT NULL,
  `party_a`         VARCHAR(256),
  `party_b`         VARCHAR(256),
  `verify_status`   VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `verify_remark`   TEXT,
  `amount`          DECIMAL(15,2),
  `sign_date`       DATE,
  `order_id`        VARCHAR(64),
  `customer_id`     VARCHAR(64),
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `remittances` (
  `id`                  VARCHAR(64) NOT NULL PRIMARY KEY,
  `erp_doc_no`          VARCHAR(128),
  `bank_transaction_no` VARCHAR(128),
  `type`                VARCHAR(64) NOT NULL,
  `remitter_name`       VARCHAR(256) NOT NULL,
  `remitter_account`    VARCHAR(128),
  `payment_method`      VARCHAR(64) NOT NULL,
  `amount`              DECIMAL(15,2) NOT NULL,
  `receiver_name`       VARCHAR(256) NOT NULL,
  `receiver_account`    VARCHAR(128),
  `payment_time`        DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invoices` (
  `id`            VARCHAR(64) NOT NULL PRIMARY KEY,
  `invoice_title` VARCHAR(256) NOT NULL,
  `amount`        DECIMAL(15,2) NOT NULL,
  `apply_time`    DATETIME NOT NULL,
  `apply_type`    VARCHAR(64) NOT NULL,
  `status`        VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `order_id`      VARCHAR(64),
  `tax_id`        VARCHAR(128),
  `remark`        TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `performances` (
  `id`                         VARCHAR(64) NOT NULL PRIMARY KEY,
  `order_id`                   VARCHAR(64) NOT NULL,
  `acceptance_detail_id`       VARCHAR(64) NOT NULL,
  `order_status`               VARCHAR(32) NOT NULL,
  `detail_amount_subtotal`     DECIMAL(15,2) NOT NULL DEFAULT 0,
  `acceptance_ratio`           DECIMAL(5,2) NOT NULL DEFAULT 100,
  `deferral_ratio`             DECIMAL(5,2) NOT NULL DEFAULT 0,
  `post_contract_status`       VARCHAR(64) NOT NULL DEFAULT '不适用',
  `discount`                   VARCHAR(32) NOT NULL DEFAULT '-',
  `cost_amount`                DECIMAL(15,2) NOT NULL DEFAULT 0,
  `sales_performance`          DECIMAL(15,2) NOT NULL DEFAULT 0,
  `weighted_sales_performance` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `project_weight_coeff`       DECIMAL(5,2) NOT NULL DEFAULT 1,
  `product_weight_coeff_sub`   DECIMAL(5,2) NOT NULL DEFAULT 1,
  `product_weight_coeff_auth`  DECIMAL(5,2) NOT NULL DEFAULT 1,
  `service_type`               VARCHAR(64) NOT NULL DEFAULT '授权',
  `owner`                      VARCHAR(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `authorizations` (
  `id`                  VARCHAR(64) NOT NULL PRIMARY KEY,
  `auth_code`           VARCHAR(128) NOT NULL,
  `order_id`            VARCHAR(64) NOT NULL,
  `licensee`            VARCHAR(256) NOT NULL,
  `customer_name`       VARCHAR(256) NOT NULL,
  `customer_id`         VARCHAR(64) NOT NULL,
  `product_name`        VARCHAR(256) NOT NULL,
  `product_code`        VARCHAR(128) NOT NULL,
  `auth_start_date`     DATE NOT NULL,
  `auth_end_date`       DATE NOT NULL,
  `service_start_date`  DATE,
  `service_end_date`    DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `delivery_infos` (
  `id`                  VARCHAR(64) NOT NULL PRIMARY KEY,
  `delivery_type`       VARCHAR(64) NOT NULL,
  `order_id`            VARCHAR(64) NOT NULL,
  `quantity`            INT NOT NULL DEFAULT 0,
  `auth_type`           VARCHAR(64) NOT NULL,
  `licensee`            VARCHAR(256) NOT NULL,
  `customer_name`       VARCHAR(256) NOT NULL,
  `customer_id`         VARCHAR(64) NOT NULL,
  `auth_code`           VARCHAR(128),
  `auth_duration`       VARCHAR(64),
  `auth_start_date`     DATE,
  `auth_end_date`       DATE,
  `service_start_date`  DATE,
  `service_end_date`    DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id`     VARCHAR(64) NOT NULL,
  `user_name`   VARCHAR(128) NOT NULL,
  `action`      VARCHAR(64) NOT NULL,
  `resource`    VARCHAR(64) NOT NULL,
  `resource_id` VARCHAR(64) NOT NULL,
  `detail`      TEXT,
  `ip`          VARCHAR(45),
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `spaces` (
  `id`              VARCHAR(64) NOT NULL PRIMARY KEY,
  `name`            VARCHAR(128) NOT NULL,
  `description`     TEXT NOT NULL,
  `icon`            VARCHAR(32) NOT NULL DEFAULT 'Box',
  `perm_tree`       JSON NOT NULL,
  `resource_config` JSON NOT NULL,
  `column_config`   JSON NOT NULL,
  `sort_order`      INT NOT NULL DEFAULT 0,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `space_roles` (
  `id`                 VARCHAR(64) NOT NULL PRIMARY KEY,
  `space_id`           VARCHAR(64) NOT NULL,
  `name`               VARCHAR(128) NOT NULL,
  `description`        TEXT NOT NULL,
  `permissions`        JSON NOT NULL,
  `row_permissions`    JSON NOT NULL,
  `row_logic`          JSON NOT NULL,
  `column_permissions` JSON NOT NULL,
  `sort_order`         INT NOT NULL DEFAULT 0,
  FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `space_members` (
  `id`         VARCHAR(64) NOT NULL PRIMARY KEY,
  `space_id`   VARCHAR(64) NOT NULL,
  `user_id`    VARCHAR(64) NOT NULL,
  `role_id`    VARCHAR(64) NOT NULL,
  `is_admin`   TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uniq_space_user` (`space_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `crm_xsy_tokens` (
  `id`            BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id`       VARCHAR(64) NOT NULL,
  `access_token`  TEXT NOT NULL,
  `token_type`    VARCHAR(32) NOT NULL DEFAULT 'Bearer',
  `expires_in`    INT NOT NULL DEFAULT 7200,
  `expires_at`    DATETIME NOT NULL,
  `scope`         VARCHAR(128),
  `tenant_id`     VARCHAR(128),
  `instance_uri`  VARCHAR(512),
  `client_id`     VARCHAR(128),
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_crm_xsy_tokens_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sso_sessions` (
  `sid`                   VARCHAR(128) NOT NULL PRIMARY KEY,
  `user_id`               VARCHAR(64) NOT NULL,
  `wps_user_id`           VARCHAR(128),
  `wps_access_token`      TEXT,
  `wps_refresh_token`     TEXT,
  `wps_token_expires_at`  DATETIME,
  `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at`            DATETIME NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes
CREATE INDEX `idx_orders_customer` ON `orders`(`customer_id`);
CREATE INDEX `idx_orders_status`   ON `orders`(`status`);
CREATE INDEX `idx_orders_date`     ON `orders`(`date`);
CREATE INDEX `idx_customers_type`  ON `customers`(`customer_type`);
CREATE INDEX `idx_audit_resource`  ON `audit_logs`(`resource`, `resource_id`);
CREATE INDEX `idx_contracts_order`  ON `contracts`(`order_id`);
CREATE INDEX `idx_contracts_status` ON `contracts`(`verify_status`);
CREATE INDEX `idx_opportunities_customer` ON `opportunities`(`customer_id`);
CREATE INDEX `idx_opportunities_stage`    ON `opportunities`(`stage`);
CREATE INDEX `idx_performances_order`     ON `performances`(`order_id`);
CREATE INDEX `idx_authorizations_customer` ON `authorizations`(`customer_id`);
CREATE INDEX `idx_delivery_customer`      ON `delivery_infos`(`customer_id`);
CREATE INDEX `idx_invoices_order`         ON `invoices`(`order_id`);
CREATE INDEX `idx_sso_sessions_user`    ON `sso_sessions`(`user_id`);
CREATE INDEX `idx_sso_sessions_expires` ON `sso_sessions`(`expires_at`);
CREATE INDEX `idx_space_roles_space`   ON `space_roles`(`space_id`);
CREATE INDEX `idx_space_members_space` ON `space_members`(`space_id`);
CREATE INDEX `idx_space_members_user`  ON `space_members`(`user_id`);
