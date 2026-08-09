package otel

import (
	"context"
	"log"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

// InitTracer 初始化 OpenTelemetry TracerProvider，通过 OTLP HTTP 上报到 Jaeger（4318 端口）
// 返回的 TracerProvider 需在服务退出时调用 Shutdown() 刷新缓冲区
func InitTracer(serviceName, otlpEndpoint string) (*sdktrace.TracerProvider, error) {
	// OTLP HTTP exporter，指向 Jaeger 的 OTLP 接收端口
	exporter, err := otlptracehttp.New(context.Background(),
		otlptracehttp.WithEndpoint(otlpEndpoint),
		otlptracehttp.WithInsecure(), // 内网通信，不走 TLS
	)
	if err != nil {
		return nil, err
	}

	// 资源标识：服务名
	res, err := resource.New(context.Background(),
		resource.WithAttributes(semconv.ServiceName(serviceName)),
	)
	if err != nil {
		return nil, err
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter), // 批量上报，性能更好
		sdktrace.WithResource(res),
		// 采样率：开发环境全量采样，生产环境可调整
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(1.0))),
	)

	// 注册全局 TracerProvider 和 W3C TraceContext 传播器
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	log.Printf("[otel] TracerProvider 已初始化，service=%s, endpoint=%s", serviceName, otlpEndpoint)
	return tp, nil
}

// Shutdown 优雅关闭 TracerProvider，刷新剩余 span
func Shutdown(tp *sdktrace.TracerProvider) {
	if tp == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := tp.Shutdown(ctx); err != nil {
		log.Printf("[otel] TracerProvider 关闭失败: %v", err)
	}
}
