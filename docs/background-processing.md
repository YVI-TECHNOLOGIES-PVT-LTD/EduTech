# EduTrack Background Processing Platform

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## Overview
The `@edutrack/api` backend provides a centralized `JobService` abstraction layer for executing long-running asynchronous tasks (email, SMS, push notifications, report generation, data imports, audit processing). Business services MUST enqueue jobs through `JobService` without importing queue providers directly.

## Queue Governance & Specifications

| Queue Name | Owner | Priority | Concurrency | Max Retries | Backoff (Ms) | Timeout (Ms) | Dead-Letter Queue (DLQ) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `email-queue` | Communication Service | High | 5 | 3 | 5000 | 30000 | `email-dlq` |
| `sms-queue` | Notification Service | High | 5 | 3 | 5000 | 15000 | `sms-dlq` |
| `push-queue` | Notification Service | Medium | 10 | 3 | 3000 | 15000 | `push-dlq` |
| `report-queue` | Analytics Service | Low | 2 | 2 | 10000 | 120000 | `report-dlq` |
| `export-queue` | Data Service | Low | 2 | 2 | 10000 | 120000 | `export-dlq` |
