# EduTrack Job Retry & Idempotency Policy

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## Retry Governance & Exponential Backoff
1. **Max Retries**: Each queue enforces a strict maximum retry attempt count (`maxRetries`). Infinite retries are strictly FORBIDDEN.
2. **Exponential Backoff**: Failed jobs undergo delayed re-execution (`backoffMs`).
3. **Dead-Letter Queue (DLQ)**: Jobs failing beyond maximum retry attempts are moved to dedicated dead-letter queues (`email-dlq`, `sms-dlq`, `report-dlq`) for operational inspection.
4. **Idempotent Job Execution**: All background workers MUST be safe to re-execute without creating duplicate database records or side effects.
