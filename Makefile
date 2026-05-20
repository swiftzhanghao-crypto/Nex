.PHONY: dev dev-all dev-server build test lint backup

# 开发：前后端并行（API 模式需在 .env 设置 VITE_API_MODE=true）
dev-all:
	npm run dev:all

dev-server:
	npm run dev:server

dev:
	npm run dev

build:
	npm run build

test:
	npm test

lint:
	npm run lint

backup:
	npm run db:backup

# 备选：Go 后端（非生产路径）
dev-go:
	cd backend && DB_PATH=../data/app.db go run ./cmd/server/
