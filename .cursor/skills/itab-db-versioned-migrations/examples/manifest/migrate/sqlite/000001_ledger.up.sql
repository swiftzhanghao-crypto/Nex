-- 简单记账：收入 / 支出，金额用分（整数）避免浮点误差
CREATE TABLE IF NOT EXISTS ledger_entry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind VARCHAR(16) NOT NULL,
  amount_cents INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  occurred_on DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ledger_entry_occurred ON ledger_entry (occurred_on DESC, id DESC);
