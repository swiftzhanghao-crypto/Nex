import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'app.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

export function initSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      account_id    TEXT NOT NULL,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      phone         TEXT,
      password_hash TEXT NOT NULL DEFAULT '',
      role          TEXT NOT NULL DEFAULT 'Sales',
      user_type     TEXT NOT NULL DEFAULT 'Internal',
      status        TEXT NOT NULL DEFAULT 'Active',
      avatar        TEXT,
      department_id TEXT,
      month_badge   TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS departments (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      parent_id   TEXT,
      FOREIGN KEY (parent_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS roles (
      id                 TEXT PRIMARY KEY,
      name               TEXT NOT NULL,
      description        TEXT NOT NULL DEFAULT '',
      permissions        TEXT NOT NULL DEFAULT '[]',
      is_system          INTEGER NOT NULL DEFAULT 0,
      row_permissions    TEXT NOT NULL DEFAULT '[]',
      column_permissions TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS customers (
      id               TEXT PRIMARY KEY,
      company_name     TEXT NOT NULL,
      industry         TEXT NOT NULL,
      customer_type    TEXT NOT NULL,
      level            TEXT NOT NULL,
      region           TEXT NOT NULL,
      address          TEXT NOT NULL DEFAULT '',
      shipping_address TEXT NOT NULL DEFAULT '',
      status           TEXT NOT NULL DEFAULT 'Active',
      logo             TEXT,
      contacts         TEXT NOT NULL DEFAULT '[]',
      billing_info     TEXT,
      owner_id         TEXT,
      owner_name       TEXT,
      enterprises      TEXT NOT NULL DEFAULT '[]',
      next_follow_up   TEXT,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      category      TEXT NOT NULL,
      sub_category  TEXT,
      description   TEXT,
      status        TEXT NOT NULL DEFAULT 'OnShelf',
      tags          TEXT NOT NULL DEFAULT '[]',
      skus          TEXT NOT NULL DEFAULT '[]',
      composition   TEXT NOT NULL DEFAULT '[]',
      install_pkgs  TEXT NOT NULL DEFAULT '[]',
      package_id    TEXT,
      rights        TEXT NOT NULL DEFAULT '[]',
      license_tpl   TEXT
    );

    CREATE TABLE IF NOT EXISTS channels (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      type           TEXT NOT NULL,
      level          TEXT NOT NULL,
      contact_name   TEXT NOT NULL,
      contact_phone  TEXT NOT NULL,
      email          TEXT NOT NULL,
      region         TEXT NOT NULL,
      status         TEXT NOT NULL DEFAULT 'Active',
      agreement_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id                TEXT PRIMARY KEY,
      crm_id            TEXT,
      name              TEXT NOT NULL,
      customer_id       TEXT NOT NULL,
      customer_name     TEXT NOT NULL,
      product_type      TEXT,
      stage             TEXT NOT NULL DEFAULT '需求判断',
      probability       REAL NOT NULL DEFAULT 0,
      department        TEXT,
      amount            REAL,
      expected_revenue  REAL NOT NULL DEFAULT 0,
      final_user_rev    REAL,
      close_date        TEXT NOT NULL,
      owner_id          TEXT NOT NULL,
      owner_name        TEXT NOT NULL,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id                  TEXT PRIMARY KEY,
      customer_id         TEXT NOT NULL,
      customer_name       TEXT NOT NULL,
      customer_type       TEXT,
      customer_level      TEXT,
      customer_industry   TEXT,
      customer_region     TEXT,
      date                TEXT NOT NULL,
      status              TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
      total               REAL NOT NULL DEFAULT 0,
      items               TEXT NOT NULL DEFAULT '[]',
      source              TEXT NOT NULL DEFAULT 'Sales',
      buyer_type          TEXT NOT NULL DEFAULT 'Customer',
      buyer_name          TEXT,
      buyer_id            TEXT,
      shipping_address    TEXT,
      delivery_method     TEXT,
      is_paid             INTEGER NOT NULL DEFAULT 0,
      payment_date        TEXT,
      payment_method      TEXT,
      payment_terms       TEXT,
      payment_record      TEXT,
      approval            TEXT NOT NULL DEFAULT '{}',
      approval_records    TEXT NOT NULL DEFAULT '[]',
      sales_rep_id        TEXT,
      sales_rep_name      TEXT,
      biz_manager_id      TEXT,
      biz_manager_name    TEXT,
      invoice_info        TEXT,
      acceptance_info     TEXT,
      acceptance_config   TEXT,
      opportunity_id      TEXT,
      opportunity_name    TEXT,
      original_order_id   TEXT,
      refund_reason       TEXT,
      refund_amount       REAL,
      extra               TEXT NOT NULL DEFAULT '{}',
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id              TEXT PRIMARY KEY,
      code            TEXT NOT NULL,
      name            TEXT NOT NULL,
      external_code   TEXT,
      contract_type   TEXT NOT NULL,
      party_a         TEXT,
      party_b         TEXT,
      verify_status   TEXT NOT NULL DEFAULT 'PENDING',
      verify_remark   TEXT,
      amount          REAL,
      sign_date       TEXT,
      order_id        TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS remittances (
      id                  TEXT PRIMARY KEY,
      erp_doc_no          TEXT,
      bank_transaction_no TEXT,
      type                TEXT NOT NULL,
      remitter_name       TEXT NOT NULL,
      remitter_account    TEXT,
      payment_method      TEXT NOT NULL,
      amount              REAL NOT NULL,
      receiver_name       TEXT NOT NULL,
      receiver_account    TEXT,
      payment_time        TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id            TEXT PRIMARY KEY,
      invoice_title TEXT NOT NULL,
      amount        REAL NOT NULL,
      apply_time    TEXT NOT NULL,
      apply_type    TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'PENDING',
      order_id      TEXT,
      tax_id        TEXT,
      remark        TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL,
      user_name   TEXT NOT NULL,
      action      TEXT NOT NULL,
      resource    TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      detail      TEXT,
      ip          TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_date     ON orders(date);
    CREATE INDEX IF NOT EXISTS idx_customers_type  ON customers(customer_type);
    CREATE INDEX IF NOT EXISTS idx_audit_resource  ON audit_logs(resource, resource_id);
  `);
}
