# EduTrack Observability & Operational Excellence Platform

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## 1. Overview & Architecture
The `@edutrack/api` backend incorporates a unified Observability Platform comprising structured JSON logging, distributed tracing propagation (`X-Request-Id`, `X-Correlation-Id`), operational metrics collection, and health probes.

```text
API / Workers / Scheduler
  └── LoggerService (Structured JSON + Sensitive Field Redaction)
      └── MetricsService (Request Latency, Error Rates, Queue Depths)
          └── Operational Probes (/health, /health/live, /health/ready)
```

## 2. Distributed Tracing Propagation
Every incoming HTTP request, background job, and domain event propagates trace metadata:
- `requestId`: Unique request execution identifier.
- `correlationId`: Distributed workflow transaction ID.
- `traceId` / `spanId`: OpenTelemetry compatible trace boundaries.
