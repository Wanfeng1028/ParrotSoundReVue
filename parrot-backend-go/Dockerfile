# 多阶段构建：编译网关和 dubbing-service 两个二进制
FROM golang:1.22-alpine AS builder

WORKDIR /app

# 复制 go.mod/go.sum 并下载依赖
COPY go.mod go.sum ./
RUN go mod download

# 复制源码并编译
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/server ./cmd/server
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/dubbing-service ./cmd/dubbing-service

# ===== 网关运行镜像 =====
FROM alpine:3.19 AS gateway

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app
COPY --from=builder /app/server /app/server
COPY --from=builder /app/.env.example /app/.env.example
RUN mkdir -p /app/uploads

EXPOSE 3000
CMD ["/app/server"]

# ===== dubbing-service 运行镜像 =====
FROM alpine:3.19 AS dubbing-service

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app
COPY --from=builder /app/dubbing-service /app/dubbing-service

EXPOSE 8888
CMD ["/app/dubbing-service"]
