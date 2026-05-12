package cmd

import (
	"context"
	"strings"

	"it-ai-base/server/internal/boot"
	ledgerctrl "it-ai-base/server/internal/controller/ledger"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"
)

var Main = gcmd.Command{
	Name:  "main",
	Usage: "main",
	Brief: "it-ai-base ledger HTTP server",
	Func:  mainFunc,
}

func mainFunc(ctx context.Context, _ *gcmd.Parser) error {
	if err := boot.Run(ctx); err != nil {
		return err
	}
	prefix := strings.TrimSpace(g.Cfg().MustGet(ctx, "server.pathPrefix").String())
	s := g.Server()
	s.Group(prefix, func(group *ghttp.RouterGroup) {
		group.Middleware(ghttp.MiddlewareCORS)
		c := ledgerctrl.New()
		group.GET("/api/ledger", c.List)
		group.POST("/api/ledger", c.Create)
		group.DELETE("/api/ledger/{id}", c.Delete)
	})
	s.Run()
	return nil
}
