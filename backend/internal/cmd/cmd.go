package cmd

import (
	"context"
	"strings"

	"nex-backend/internal/boot"
	aictrl "nex-backend/internal/controller/ai"
	authctrl "nex-backend/internal/controller/auth"
	channelctrl "nex-backend/internal/controller/channel"
	crmctrl "nex-backend/internal/controller/crm"
	customerctrl "nex-backend/internal/controller/customer"
	financectrl "nex-backend/internal/controller/finance"
	opportunityctrl "nex-backend/internal/controller/opportunity"
	orderctrl "nex-backend/internal/controller/order"
	productctrl "nex-backend/internal/controller/product"
	spacectrl "nex-backend/internal/controller/space"
	userctrl "nex-backend/internal/controller/user"
	wpsctrl "nex-backend/internal/controller/wps"
	"nex-backend/internal/middleware"
	"nex-backend/internal/service/rbac"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"
)

var Main = gcmd.Command{
	Name:  "main",
	Usage: "main",
	Brief: "NexOrder business platform HTTP server",
	Func:  mainFunc,
}

func mainFunc(ctx context.Context, _ *gcmd.Parser) error {
	if err := boot.Run(ctx); err != nil {
		return err
	}
	prefix := strings.TrimSpace(g.Cfg().MustGet(ctx, "server.pathPrefix").String())
	s := g.Server()

	auth := authctrl.New()
	user := userctrl.New()
	order := orderctrl.New()
	customer := customerctrl.New()
	product := productctrl.New()
	channel := channelctrl.New()
	opportunity := opportunityctrl.New()
	finance := financectrl.New()
	wps := wpsctrl.New()
	crm := crmctrl.New()
	space := spacectrl.New()
	aiCtrl := aictrl.New()

	s.Group(prefix, func(group *ghttp.RouterGroup) {
		group.Middleware(ghttp.MiddlewareCORS)

		group.Group("/api", func(api *ghttp.RouterGroup) {
			api.GET("/health", func(r *ghttp.Request) {
				r.Response.WriteJson(g.Map{"status": "ok"})
			})

			// ── Auth (public) ──
			api.Group("/auth", func(ag *ghttp.RouterGroup) {
				ag.POST("/login", auth.Login)
				ag.POST("/logout", auth.Logout)
			})

			// ── WPS SSO (public - no JWT required) ──
			api.Group("/auth/wps", func(wg *ghttp.RouterGroup) {
				wg.GET("/status", wps.Status)
				wg.GET("/login", wps.Login)
				wg.GET("/callback", wps.Callback)
				wg.POST("/logout", wps.Logout)
			})

			// ── CRM OAuth (public - login uses JWT from query) ──
			api.GET("/crm/xsy/login", crm.Login)
			api.GET("/crm/xsy/callback", crm.Callback)

			// ── AI Status (public) ──
			api.GET("/ai/status", aiCtrl.Status)

			// ── All routes below require authentication ──
			api.Middleware(middleware.Auth)

			api.GET("/auth/me", auth.Me)
			api.POST("/auth/impersonate", auth.Impersonate)

			// ── CRM (authenticated) ──
			api.Group("/crm/xsy", func(cx *ghttp.RouterGroup) {
				cx.GET("/status", crm.Status)
				cx.GET("/customers", crm.Customers)
				cx.POST("/sync-customers", crm.SyncCustomers)
				cx.POST("/unbind", crm.Unbind)
			})

			// ── AI (authenticated) ──
			api.Group("/ai", func(ag *ghttp.RouterGroup) {
				ag.POST("/generate", aiCtrl.Generate)
				ag.POST("/generate-json", aiCtrl.GenerateJSON)
				ag.POST("/category-suggest", aiCtrl.CategorySuggest)
			})

			// ── Users ──
			api.Group("/users", func(ug *ghttp.RouterGroup) {
				ug.Middleware(rbac.Check("user", "list"))
				ug.GET("/", user.List)
				ug.PUT("/order", user.ReorderUsers)
				ug.GET("/meta/departments", user.Departments)
				ug.GET("/meta/roles", user.Roles)
				ug.PUT("/meta/roles-order", user.ReorderRoles)
				ug.POST("/meta/roles", user.CreateRole)
				ug.PUT("/meta/roles/{id}", user.UpdateRole)
				ug.POST("/meta/roles/{id}/copy", user.CopyRole)
				ug.DELETE("/meta/roles/{id}", user.DeleteRole)
				ug.GET("/{id}", user.Detail)
				ug.PUT("/{id}", user.Update)
			})

			// ── Orders ──
			api.Group("/orders", func(og *ghttp.RouterGroup) {
				og.GET("/", order.List)
				og.GET("/sub-units/list", order.List)
				og.POST("/", order.Create)
				og.GET("/{id}", order.Detail)
				og.PUT("/{id}", order.Update)
				og.POST("/{id}/approve", order.Approve)
				og.POST("/{id}/submit", order.Submit)
				og.DELETE("/{id}", order.Delete)
				og.GET("/{id}/logs", order.Logs)
			})

			// ── Customers ──
			api.Group("/customers", func(cg *ghttp.RouterGroup) {
				cg.GET("/", customer.List)
				cg.POST("/", customer.Create)
				cg.GET("/{id}", customer.Detail)
				cg.PUT("/{id}", customer.Update)
				cg.DELETE("/{id}", customer.Delete)
			})

			// ── Products ──
			api.Group("/products", func(pg *ghttp.RouterGroup) {
				pg.GET("/", product.List)
				pg.GET("/meta/channels", product.MetaChannels)
				pg.GET("/meta/opportunities", product.MetaOpportunities)
				pg.POST("/", product.Create)
				pg.GET("/{id}", product.Detail)
				pg.PUT("/{id}", product.Update)
				pg.DELETE("/{id}", product.Delete)
			})

			// ── Channels ──
			api.Group("/channels", func(chg *ghttp.RouterGroup) {
				chg.GET("/", channel.List)
				chg.POST("/", channel.Create)
				chg.GET("/{id}", channel.Detail)
				chg.PUT("/{id}", channel.Update)
				chg.GET("/{id}/users", channel.Users)
				chg.DELETE("/{id}", channel.Delete)
			})

			// ── Opportunities ──
			api.Group("/opportunities", func(opg *ghttp.RouterGroup) {
				opg.GET("/", opportunity.List)
				opg.POST("/", opportunity.Create)
				opg.GET("/{id}", opportunity.Detail)
				opg.PUT("/{id}", opportunity.Update)
				opg.DELETE("/{id}", opportunity.Delete)
			})

			// ── Spaces ──
			api.Group("/spaces", func(sg *ghttp.RouterGroup) {
				sg.GET("/", space.List)
				sg.POST("/", space.Create)
				sg.GET("/{id}", space.Detail)
				sg.PUT("/{id}", space.Update)
				sg.DELETE("/{id}", space.Delete)
				sg.GET("/{id}/roles", space.ListRoles)
				sg.POST("/{id}/roles", space.CreateRole)
				sg.PUT("/{id}/roles/{roleId}", space.UpdateRole)
				sg.DELETE("/{id}/roles/{roleId}", space.DeleteRole)
				sg.GET("/{id}/members", space.ListMembers)
				sg.POST("/{id}/members", space.AddMember)
				sg.PUT("/{id}/members/{memberId}", space.UpdateMember)
				sg.DELETE("/{id}/members/{memberId}", space.RemoveMember)
			})

			// ── Finance: Contracts ──
			api.Group("/finance/contracts", func(fg *ghttp.RouterGroup) {
				fg.GET("/", finance.ContractList)
				fg.POST("/", finance.ContractCreate)
				fg.GET("/{id}", finance.ContractDetail)
				fg.PUT("/{id}", finance.ContractUpdate)
				fg.DELETE("/{id}", finance.ContractDelete)
			})

			// ── Finance: Remittances ──
			api.Group("/finance/remittances", func(fg *ghttp.RouterGroup) {
				fg.GET("/", finance.RemittanceList)
				fg.POST("/", finance.RemittanceCreate)
				fg.GET("/{id}", finance.RemittanceDetail)
				fg.PUT("/{id}", finance.RemittanceUpdate)
				fg.DELETE("/{id}", finance.RemittanceDelete)
			})

			// ── Finance: Invoices ──
			api.Group("/finance/invoices", func(fg *ghttp.RouterGroup) {
				fg.GET("/", finance.InvoiceList)
				fg.POST("/", finance.InvoiceCreate)
				fg.GET("/{id}", finance.InvoiceDetail)
				fg.PUT("/{id}", finance.InvoiceUpdate)
				fg.DELETE("/{id}", finance.InvoiceDelete)
			})

			// ── Finance: Performances ──
			api.Group("/finance/performances", func(fg *ghttp.RouterGroup) {
				fg.GET("/", finance.PerformanceList)
				fg.GET("/{id}", finance.PerformanceDetail)
			})

			// ── Finance: Authorizations ──
			api.Group("/finance/authorizations", func(fg *ghttp.RouterGroup) {
				fg.GET("/", finance.AuthorizationList)
				fg.POST("/", finance.AuthorizationCreate)
				fg.GET("/{id}", finance.AuthorizationDetail)
			})

			// ── Finance: Delivery Infos ──
			api.Group("/finance/delivery-infos", func(fg *ghttp.RouterGroup) {
				fg.GET("/", finance.DeliveryList)
				fg.POST("/", finance.DeliveryCreate)
				fg.GET("/{id}", finance.DeliveryDetail)
			})

			// ── Finance: Audit Logs ──
			api.Group("/finance/audit-logs", func(fg *ghttp.RouterGroup) {
				fg.GET("/", finance.AuditLogList)
			})
		})
	})

	g.Log().Infof(ctx, "")
	g.Log().Infof(ctx, "  NexOrder GoFrame API Server")
	g.Log().Infof(ctx, "  Modules: auth, wps-sso, users, orders, customers, products,")
	g.Log().Infof(ctx, "           channels, opportunities, finance, crm, spaces, ai")
	g.Log().Infof(ctx, "  [dev] Default login: any user email + password \"123456\"")
	g.Log().Infof(ctx, "")

	s.Run()
	return nil
}
