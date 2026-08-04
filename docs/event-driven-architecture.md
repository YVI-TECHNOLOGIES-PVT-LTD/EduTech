# EduTrack Event-Driven Architecture

> **Document Version:** 1.0.0  
> **Owner:** EduTrack Platform Team  
> **Status:** Approved  
> **Last Updated:** 2026-07-29  

---

## Versioned Domain Events (`EventBus`)
Application services publish domain events using `EventBusService` (`apps/api/src/events/event-bus.service.ts`). Every event payload MUST include an explicit semantic version suffix:

- `AdmissionCreated.v1`
- `StudentEnrolled.v1`
- `FeePaid.v1`
- `AttendanceMarked.v1`
- `UserCreated.v1`
- `NotificationRequested.v1`

## Publishing Example
```typescript
await eventBus.publish('AdmissionCreated.v1', {
  enquiryId: 'enq-1001',
  studentName: 'John Doe',
  createdTime: new Date().toISOString()
});
```
