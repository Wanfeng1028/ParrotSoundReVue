# 多阶段构建：编译网关和三个微服务的二进制
FROM golang:1.22-alpine AS builder

WORKDIR /app

# 复制 go.mod/go.sum 并下载依赖
COPY go.mod go.sum ./
RUN go mod download

# 复制源码并编译
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/server ./cmd/server
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/dubbing-service ./cmd/dubbing-service
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/voice-service ./cmd/voice-service
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/user-service ./cmd/user-service

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

# ===== voice-service 运行镜像 =====
FROM alpine:3.19 AS voice-service

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app
COPY --from=builder /app/voice-service /app/voice-service

EXPOSE 8889
CMD ["/app/voice-service"]

# ===== user-service 运行镜像 =====
FROM alpine:3.19 AS user-service

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app
COPY --from=builder /app/user-service /app/user-service

EXPOSE 8890
CMD ["/app/user-service"]
