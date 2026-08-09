# 多阶段构建：编译 Go 二进制
FROM golang:1.22-alpine AS builder

WORKDIR /app

# 复制 go.mod/go.sum 并下载依赖
COPY go.mod go.sum ./
RUN go mod download

# 复制源码并编译
COPY . .
RUN CGO_ENABLED=0 go build -o /app/server ./cmd/server

# 运行阶段：最小化镜像
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app

# 复制编译产物
COPY --from=builder /app/server /app/server
COPY --from=builder /app/.env.example /app/.env.example

# 创建上传目录
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["/app/server"]
