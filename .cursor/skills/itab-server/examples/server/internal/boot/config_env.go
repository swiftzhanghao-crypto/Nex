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

// ApplyGFEnv 根据 GF_ENV 选择 manifest/config/config.{env}.yaml，
// 读取原文后用 os.ExpandEnv 展开 ${VAR} 占位符，
// 通过 gcfg.NewAdapterContent 注入到 g.Cfg()，保证所有后续读取走展开后的内存内容。
// 未设置 GF_ENV 视为 dev；dev 下即使 yaml 无占位符也走同一路径，保持行为一致。
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

// loadConfigWithEnvExpanded 读取配置文件原文 → os.ExpandEnv → 注入为 AdapterContent。
// 优先走 cwd 下的 manifest/config/<filename>；失败再回退到 GoFrame AdapterFile 的搜索路径。
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

// ValidateRequiredEnv 在 test/prod 环境下强校验必需的环境变量及 DSN 合法性。
// 任一缺失或非法 → Fatal 并列出清单。dev 环境跳过。
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
