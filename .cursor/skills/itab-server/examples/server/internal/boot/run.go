package boot

import (
	"context"
	"os"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gfile"
)

// Run 启动前：test/prod 环境变量强校验、确保 SQLite 数据目录、执行版本化迁移（与 it-ai-base 约定对齐的精简实现）。
func Run(ctx context.Context) error {
	ValidateRequiredEnv(ctx)
	if err := ensureSqliteParentDir(ctx); err != nil {
		return err
	}
	if err := RunMigrations(ctx); err != nil {
		return err
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
