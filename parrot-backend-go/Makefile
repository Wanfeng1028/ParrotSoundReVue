.PHONY: all server dubbing-service build gen run-gateway run-dubbing docker-up docker-down tidy vet

# 编译两个二进制
build: server dubbing-service

server:
	go build -ldflags="-s -w" -o ./server ./cmd/server

dubbing-service:
	go build -ldflags="-s -w" -o ./dubbing-service ./cmd/dubbing-service

# Kitex 代码生成（需要先安装 thriftgo 和 kitex 工具）
gen:
	kitex -module parrot-backend-go idl/dubbing.thrift

# 本地运行（需要先启动 PostgreSQL 和 Redis）
run-gateway:
	go run ./cmd/server

run-dubbing:
	go run ./cmd/dubbing-service

# Docker Compose 一键启动全部服务
docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down

# Go 工具
tidy:
	go mod tidy

vet:
	go vet ./...
