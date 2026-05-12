CREATE TABLE IF NOT EXISTS ledger_entry (
  id BIGINT NOT NULL AUTO_INCREMENT,
  kind VARCHAR(16) NOT NULL COMMENT 'income or expense',
  amount_cents BIGINT NOT NULL COMMENT 'amount in minor units (cents)',
  note VARCHAR(512) NOT NULL DEFAULT '',
  occurred_on DATE NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_ledger_entry_occurred (occurred_on, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
