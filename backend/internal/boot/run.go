package boot

import (
	"context"
	"os"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gfile"
)

func Run(ctx context.Context) error {
	ValidateRequiredEnv(ctx)
	if err := ensureSqliteParentDir(ctx); err != nil {
		return err
	}
	if err := RunMigrations(ctx); err != nil {
		return err
	}
	if err := SeedDatabase(ctx); err != nil {
		g.Log().Warningf(ctx, "seed: %v", err)
	}
	return nil
}

func ensureSqliteParentDir(ctx context.Context) error {
	link := g.Cfg().MustGet(ctx, "database.default.link").String()
	path, ok := sqliteFilePathFromLink(link)
	if !ok {
		return nil
	}
	dir := gfile.Dir(path)
	if dir == "" || dir == "." {
		return nil
	}
	return os.MkdirAll(dir, 0o755)
}
