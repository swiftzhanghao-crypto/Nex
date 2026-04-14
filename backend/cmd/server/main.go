package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"nex-backend/internal/config"
	"nex-backend/internal/handler"
	"nex-backend/internal/seed"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	config.InitSchema()
	seed.SeedDatabase()

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	allowedOrigins := []string{
		"http://localhost:4173", "http://localhost:5173",
		"http://127.0.0.1:4173", "http://127.0.0.1:5173",
	}
	if envOrigins := os.Getenv("CORS_ORIGINS"); envOrigins != "" {
		allowedOrigins = strings.Split(envOrigins, ",")
		for i := range allowedOrigins {
			allowedOrigins[i] = strings.TrimSpace(allowedOrigins[i])
		}
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Use(func(c *gin.Context) {
		log.Printf("[%s] %s %s", time.Now().Format(time.RFC3339), c.Request.Method, c.Request.URL.Path)
		c.Next()
	})

	api := r.Group("/api")
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now().Format(time.RFC3339)})
	})

	handler.RegisterAuthRoutes(api.Group("/auth"))
	handler.RegisterUserRoutes(api)
	handler.RegisterOrderRoutes(api)
	handler.RegisterCustomerRoutes(api)
	handler.RegisterProductRoutes(api)
	handler.RegisterFinanceRoutes(api)
	handler.RegisterChannelRoutes(api)
	handler.RegisterOpportunityRoutes(api)

	// Serve frontend static files in production
	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		staticDir = filepath.Join(".", "dist")
	}
	if info, err := os.Stat(staticDir); err == nil && info.IsDir() {
		r.NoRoute(func(c *gin.Context) {
			if strings.HasPrefix(c.Request.URL.Path, "/api/") {
				c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
				return
			}
			filePath := filepath.Join(staticDir, c.Request.URL.Path)
			if _, err := os.Stat(filePath); err == nil {
				c.File(filePath)
				return
			}
			c.File(filepath.Join(staticDir, "index.html"))
		})
		log.Printf("静态文件目录: %s", staticDir)
	}

	fmt.Printf("\n  API Server running at http://localhost:%s\n", port)
	fmt.Printf("  Endpoints:\n")
	fmt.Printf("     POST   /api/auth/login\n")
	fmt.Printf("     GET    /api/auth/me\n")
	fmt.Printf("     CRUD   /api/users\n")
	fmt.Printf("     CRUD   /api/orders          + POST /:id/approve, POST /:id/submit\n")
	fmt.Printf("     CRUD   /api/customers\n")
	fmt.Printf("     CRUD   /api/products\n")
	fmt.Printf("     CRUD   /api/channels\n")
	fmt.Printf("     CRUD   /api/opportunities\n")
	fmt.Printf("     CRUD   /api/finance/contracts\n")
	fmt.Printf("     CRUD   /api/finance/remittances\n")
	fmt.Printf("     CRUD   /api/finance/invoices\n")
	fmt.Printf("     GET    /api/finance/performances\n")
	fmt.Printf("     GET    /api/finance/authorizations\n")
	fmt.Printf("     GET    /api/finance/delivery-infos\n")
	fmt.Printf("     GET    /api/finance/audit-logs\n")
	fmt.Printf("\n  Default login: any user email + password \"123456\"\n\n")

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("启动服务器失败: %v", err)
	}
}
