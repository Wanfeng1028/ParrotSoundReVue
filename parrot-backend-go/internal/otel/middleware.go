package otel

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// HTTPMiddleware Hertz OpenTelemetry 中间件
// 为每个 HTTP 请求创建一个 server span，记录 method、url、status code
// 链路通过 W3C TraceContext 头跨服务传播（Kitex 侧由 tracing.NewClientSuite 接续）
func HTTPMiddleware() app.HandlerFunc {
	tracer := otel.GetTracerProvider().Tracer("parrot-gateway")
	return func(ctx context.Context, c *app.RequestContext) {
		method := string(c.Method())
		path := string(c.URI().Path())

		// 从请求头提取上游 trace context（若有）
		ctx = otel.GetTextMapPropagator().Extract(ctx, &headerCarrier{c: c})

		ctx, span := tracer.Start(ctx, method+" "+path,
			trace.WithSpanKind(trace.SpanKindServer),
			trace.WithAttributes(
				attribute.String("http.method", method),
				attribute.String("http.target", path),
			),
		)
		defer span.End()

		c.Next(ctx)

		statusCode := c.Response.StatusCode()
		span.SetAttributes(attribute.Int("http.status_code", statusCode))
		if statusCode >= 500 {
			span.SetAttributes(attribute.Bool("error", true))
		}
	}
}

// headerCarrier 适配 OpenTelemetry TextMapCarrier 到 Hertz 请求头
type headerCarrier struct {
	c *app.RequestContext
}

func (h *headerCarrier) Get(key string) string {
	return string(h.c.GetHeader(key))
}

func (h *headerCarrier) Set(key, value string) {
	h.c.Request.Header.Set(key, value)
}

func (h *headerCarrier) Keys() []string {
	return nil
}
