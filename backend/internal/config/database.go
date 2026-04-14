package config

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"sync"

	_ "github.com/mattn/go-sqlite3"
)

var (
	db   *sql.DB
	once sync.Once
)

func GetDB() *sql.DB {
	once.Do(func() {
		dbPath := os.Getenv("DB_PATH")
		if dbPath == "" {
			exe, _ := os.Executable()
			dbPath = filepath.Join(filepath.Dir(exe), "..", "data", "app.db")
			if _, err := os.Stat(dbPath); os.IsNotExist(err) {
				dbPath = filepath.Join(".", "data", "app.db")
			}
		}
		var err error
		db, err = sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_foreign_keys=ON")
		if err != nil {
			log.Fatalf("打开数据库失败: %v", err)
		}
		db.SetMaxOpenConns(4)
		log.Printf("数据库已连接: %s", dbPath)
	})
	return db
}

func InitSchema() {
	d := GetDB()
	schema := `
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
		column_permissions TEXT NOT NULL DEFAULT '[]',
		sort_order         INTEGER NOT NULL DEFAULT 0
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
		customer_id     TEXT,
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
	CREATE TABLE IF NOT EXISTS performances (
		id                         TEXT PRIMARY KEY,
		order_id                   TEXT NOT NULL,
		acceptance_detail_id       TEXT NOT NULL,
		order_status               TEXT NOT NULL,
		detail_amount_subtotal     REAL NOT NULL DEFAULT 0,
		acceptance_ratio           REAL NOT NULL DEFAULT 100,
		deferral_ratio             REAL NOT NULL DEFAULT 0,
		post_contract_status       TEXT NOT NULL DEFAULT '不适用',
		discount                   TEXT NOT NULL DEFAULT '-',
		cost_amount                REAL NOT NULL DEFAULT 0,
		sales_performance          REAL NOT NULL DEFAULT 0,
		weighted_sales_performance REAL NOT NULL DEFAULT 0,
		project_weight_coeff       REAL NOT NULL DEFAULT 1,
		product_weight_coeff_sub   REAL NOT NULL DEFAULT 1,
		product_weight_coeff_auth  REAL NOT NULL DEFAULT 1,
		service_type               TEXT NOT NULL DEFAULT '授权',
		owner                      TEXT NOT NULL
	);
	CREATE TABLE IF NOT EXISTS authorizations (
		id                  TEXT PRIMARY KEY,
		auth_code           TEXT NOT NULL,
		order_id            TEXT NOT NULL,
		licensee            TEXT NOT NULL,
		customer_name       TEXT NOT NULL,
		customer_id         TEXT NOT NULL,
		product_name        TEXT NOT NULL,
		product_code        TEXT NOT NULL,
		auth_start_date     TEXT NOT NULL,
		auth_end_date       TEXT NOT NULL,
		service_start_date  TEXT,
		service_end_date    TEXT
	);
	CREATE TABLE IF NOT EXISTS delivery_infos (
		id                  TEXT PRIMARY KEY,
		delivery_type       TEXT NOT NULL,
		order_id            TEXT NOT NULL,
		quantity            INTEGER NOT NULL DEFAULT 0,
		auth_type           TEXT NOT NULL,
		licensee            TEXT NOT NULL,
		customer_name       TEXT NOT NULL,
		customer_id         TEXT NOT NULL,
		auth_code           TEXT,
		auth_duration       TEXT,
		auth_start_date     TEXT,
		auth_end_date       TEXT,
		service_start_date  TEXT,
		service_end_date    TEXT
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
	CREATE INDEX IF NOT EXISTS idx_contracts_order  ON contracts(order_id);
	CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(verify_status);
	CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer_id);
	CREATE INDEX IF NOT EXISTS idx_opportunities_stage    ON opportunities(stage);
	CREATE INDEX IF NOT EXISTS idx_performances_order     ON performances(order_id);
	CREATE INDEX IF NOT EXISTS idx_authorizations_customer ON authorizations(customer_id);
	CREATE INDEX IF NOT EXISTS idx_delivery_customer      ON delivery_infos(customer_id);
	CREATE INDEX IF NOT EXISTS idx_invoices_order         ON invoices(order_id);
	`
	_, err := d.Exec(schema)
	if err != nil {
		log.Fatalf("初始化数据库 schema 失败: %v", err)
	}

	// 自动迁移：为已有数据库的 roles 表补充 sort_order 列
	d.Exec("ALTER TABLE roles ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0")

	log.Println("数据库 schema 初始化完成")
}
