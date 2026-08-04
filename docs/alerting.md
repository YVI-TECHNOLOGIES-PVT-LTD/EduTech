# EduTrack Alerting Standards & Severity Levels

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## Alert Severity Levels

| Severity Level | Operational Impact | Response Target | Trigger Examples |
| :--- | :--- | :---: | :--- |
| **Critical (P1)** | Platform down / Database connection loss | Immediate (< 15 mins) | Database connection failures, HTTP 500 error rate > 10% |
| **High (P2)** | Feature degraded / Worker offline | < 1 hour | Worker runtime offline, Queue depth > 1000, Cache hit rate < 50% |
| **Medium (P3)** | Non-blocking degradation | < 4 hours | High API latency (> 500ms), Cache hit rate < 70% |
| **Low (P4)** | Maintenance alert / DLQ item | Next business day | Item placed in Dead-Letter Queue (DLQ), Cache invalidation warning |
