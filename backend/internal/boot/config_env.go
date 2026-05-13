// baseline: itab-server examples v2026-04-27
package boot

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gcfg"
	"github.com/gogf/gf/v2/os/gfile"
)

const (
	envGFEnv       = "GF_ENV"
	envDatabaseDSN = "DATABASE_DSN"
)

func ApplyGFEnv() {
	env := strings.TrimSpace(os.Getenv(envGFEnv))
	if env == "" {
		env = "dev"
	}
	var filename string
	switch env {
	case "dev":
		filename = "config.dev.yaml"
	case "test":
		filename = "config.test.yaml"
	case "prod":
		filename = "config.prod.yaml"
	default:
		return
	}
	if err := loadConfigWithEnvExpanded(filename); err != nil {
		panic(fmt.Errorf("load config %s: %w", filename, err))
	}
}

func loadConfigWithEnvExpanded(filename string) error {
	raw := readConfigFile(filename)
	if raw == "" {
		return fmt.Errorf("config file not found or empty: %s", filename)
	}
	expanded := os.ExpandEnv(raw)
	adapter, err := gcfg.NewAdapterContent(expanded)
	if err != nil {
		return err
	}
	g.Cfg().SetAdapter(adapter)
	return nil
}

func readConfigFile(filename string) string {
	primary := filepath.Join("manifest", "config", filename)
	if gfile.Exists(primary) {
		return gfile.GetContents(primary)
	}
	if adapter, ok := g.Cfg().GetAdapter().(*gcfg.AdapterFile); ok {
		if p, err := adapter.GetFilePath(filename); err == nil && p != "" {
			return gfile.GetContents(p)
		}
	}
	return ""
}

func ValidateRequiredEnv(ctx context.Context) {
	env := strings.TrimSpace(os.Getenv(envGFEnv))
	if env != "test" && env != "prod" {
		return
	}
	required := []string{envDatabaseDSN}
	var missing []string
	for _, k := range required {
		if strings.TrimSpace(os.Getenv(k)) == "" {
			missing = append(missing, k)
		}
	}
	if len(missing) > 0 {
		g.Log().Fatalf(ctx, "GF_ENV=%s 缺失必需环境变量: %s", env, strings.Join(missing, ", "))
	}
	link := g.Cfg().MustGet(ctx, "database.default.link").String()
	if strings.Contains(link, "${") || !strings.HasPrefix(link, "mysql:") {
		g.Log().Fatalf(ctx, "GF_ENV=%s database.default.link 不合法: %q", env, link)
	}
}
