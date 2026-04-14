.PHONY: dev dev-frontend dev-backend build build-frontend build-backend clean

# 开发模式
dev: dev-backend dev-frontend

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && DB_PATH=../data/app.db go run ./cmd/server/ &

# 构建
build: build-frontend build-backend

build-frontend:
	cd frontend && npm run build

build-backend:
	cd backend && CGO_ENABLED=1 go build -o ../dist/nex-server ./cmd/server/

# 生产模式运行
run-prod:
	cd dist && DB_PATH=../data/app.db STATIC_DIR=. GIN_MODE=release ./nex-server

# 清理
clean:
	rm -rf frontend/dist dist/nex-server
