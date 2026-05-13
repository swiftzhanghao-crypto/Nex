package boot

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gfile"
)

var migrationFileRe = regexp.MustCompile(`^(\d{6})_.*\.up\.sql$`)

func RunMigrations(ctx context.Context) error {
	db := g.DB()
	link := g.Cfg().MustGet(ctx, "database.default.link").String()
	subdir := "sqlite"
	if strings.Contains(link, "mysql:") {
		subdir = "mysql"
	}
	root, err := os.Getwd()
	if err != nil {
		return err
	}
	dir := filepath.Join(root, "manifest", "migrate", subdir)
	if !gfile.Exists(dir) {
		return fmt.Errorf("migrate dir not found: %s", dir)
	}
	if err := ensureSchemaMigrations(ctx, db, subdir == "mysql"); err != nil {
		return err
	}
	applied, err := loadAppliedVersions(ctx, db)
	if err != nil {
		return err
	}
	files, err := collectMigrationFiles(dir)
	if err != nil {
		return err
	}
	for _, mf := range files {
		if applied[mf.version] {
			continue
		}
		sqlBytes := gfile.GetBytes(mf.path)
		if len(sqlBytes) == 0 {
			return fmt.Errorf("empty migration: %s", mf.path)
		}
		if err := db.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
			if _, err := tx.Exec(string(sqlBytes)); err != nil {
				return err
			}
			if _, err := tx.Exec(`INSERT INTO schema_migrations (version, dirty) VALUES (?, 0)`, mf.version); err != nil {
				return err
			}
			return nil
		}); err != nil {
			return fmt.Errorf("apply %s: %w", mf.path, err)
		}
		g.Log().Infof(ctx, "migration applied: %s (%d)", filepath.Base(mf.path), mf.version)
	}
	return nil
}

func ensureSchemaMigrations(ctx context.Context, db gdb.DB, mysql bool) error {
	var ddl string
	if mysql {
		ddl = `CREATE TABLE IF NOT EXISTS schema_migrations (
  version bigint NOT NULL,
  dirty tinyint(1) NOT NULL,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
	} else {
		ddl = `CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER NOT NULL PRIMARY KEY,
  dirty INTEGER NOT NULL DEFAULT 0
)`
	}
	_, err := db.Exec(ctx, ddl)
	return err
}

func loadAppliedVersions(ctx context.Context, db gdb.DB) (map[int64]bool, error) {
	out := make(map[int64]bool)
	rows, err := db.Model("schema_migrations").Ctx(ctx).Fields("version").All()
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		out[row["version"].Int64()] = true
	}
	return out, nil
}

type migrationFile struct {
	version int64
	path    string
}

func collectMigrationFiles(dir string) ([]migrationFile, error) {
	ents, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	var list []migrationFile
	for _, ent := range ents {
		if ent.IsDir() {
			continue
		}
		name := ent.Name()
		m := migrationFileRe.FindStringSubmatch(name)
		if len(m) != 2 {
			continue
		}
		v, err := strconv.ParseInt(m[1], 10, 64)
		if err != nil {
			continue
		}
		list = append(list, migrationFile{version: v, path: filepath.Join(dir, name)})
	}
	sort.Slice(list, func(i, j int) bool { return list[i].version < list[j].version })
	return list, nil
}
