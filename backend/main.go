package main

import (
	_ "github.com/gogf/gf/contrib/drivers/mysql/v2"
	_ "github.com/gogf/gf/contrib/drivers/sqlite/v2"

	"github.com/gogf/gf/v2/os/gctx"

	"nex-backend/internal/boot"
	"nex-backend/internal/cmd"
)

func main() {
	boot.ApplyGFEnv()
	cmd.Main.Run(gctx.New())
}
