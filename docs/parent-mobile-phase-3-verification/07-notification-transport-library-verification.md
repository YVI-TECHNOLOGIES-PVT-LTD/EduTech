# EduTrack ERP — Parent Mobile App

# Phase 3 Verification Report: 07 — Notifications, Transport & Library Verification

## 1. Executive Summary

This report evaluates the notification architecture, real-time WebSocket bindings, and auxiliary campus services (Transport and Library) across both mobile and backend codebases.

---

## 2. Notification Center & WebSocket Audit

| Capability               | Implementation File            | Backend Route / Contract               | Status                                  | Verification Findings                                                         |
| ------------------------ | ------------------------------ | -------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| Notifications Listing    | `notifications.api.ts`         | `GET /v1/notifications`                | **VERIFIED — REAL BACKEND INTEGRATION** | Returns itemized notifications from PostgreSQL `notifications` table.         |
| Unread Counter           | `notifications.api.ts`         | `GET /v1/notifications/unread-count`   | **VERIFIED — REAL BACKEND INTEGRATION** | Backed by `notification.routes.ts`. Dynamically updates tab badges.           |
| Mark Single Read         | `notifications.api.ts`         | `PATCH /v1/notifications/:id/read`     | **VERIFIED — REAL BACKEND INTEGRATION** | Updates `is_read = true` and `read_at = now()`.                               |
| Mark All Read            | `notifications.api.ts`         | `POST /v1/notifications/mark-all-read` | **VERIFIED — REAL BACKEND INTEGRATION** | Bulk updates all unread notifications for authenticated parent.               |
| WebSocket Connection     | `NotificationSocketManager`    | `${ENV.WS_URL}?token=${token}`         | **VERIFIED — REAL BACKEND INTEGRATION** | Transmits authenticated JWT token; listens for `notification.created` events. |
| Push Notification Tokens | `push-notification.service.ts` | Expo Push Token API                    | **PARTIALLY INTEGRATED**                | Client extracts Expo token; backend APNS/FCM production relay not configured. |

---

## 3. Campus Transport Verification

### A. Mobile Implementation

- File: `apps/mobile_app/app/(main)/transport/index.tsx`
- Endpoint Called: `transportApi.getStudentTransport(studentId)` -> `GET /v1/students/:id/transport`

### B. Backend Audit: `TransportProvisioner.ts`

Location: `apps/backend/src/modules/admission/services/enrollment/provisioning/TransportProvisioner.ts`

```typescript
export class TransportProvisioner {
  public async provision(studentId: string, applicationId: string): Promise<void> {
    const { data: appDetails, error: appErr } = await supabase
      .from('admissions_applications')
      .select('lead_id, leads(remarks)')
      .eq('application_id', applicationId)
      .maybeSingle();

    if (appErr) throw appErr;

    const { error } = await supabase.from('student_transport_allocation').insert({
      student_id: studentId,
      route_id: null,
      status: 'Allocated',
    });

    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
  }
}
```

### C. Analysis:

1. **Provisioning Utility, NOT Parent Query Service**: `TransportProvisioner` is strictly an internal enrollment script triggered when an admission lead is converted into a student. It inserts an initial row into `student_transport_allocation`.
2. **No Query Controller or Endpoint**: There is **no controller, route handler, or GET endpoint** in `apps/backend/` that allows a parent to query route numbers, bus numbers, driver names, phone numbers, or stop times for their enrolled ward.
3. **Verdict**: **UI ONLY**. The transport screen renders an attractive mockup layout if an allocation object is provided, but falls back to an honest empty state in production because the backend query endpoint does not exist.

---

## 4. Campus Library Verification

### A. Mobile Implementation

- File: `apps/mobile_app/app/(main)/library/index.tsx`
- Endpoint Called: `libraryApi.getStudentLibrary(studentId)` -> `GET /v1/students/:id/library`

### B. Backend Audit: `LibraryProvisioner.ts`

Location: `apps/backend/src/modules/admission/services/enrollment/provisioning/LibraryProvisioner.ts`

```typescript
export class LibraryProvisioner {
  public async provision(studentId: string, admissionNumber: string): Promise<void> {
    const { error } = await supabase.from('student_library_accounts').insert({
      student_id: studentId,
      library_card_number: `LIB-${admissionNumber}`,
      status: 'Active',
    });

    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
  }
}
```

### C. Analysis:

1. **Provisioning Utility Only**: Like `TransportProvisioner`, `LibraryProvisioner` is an internal enrollment script that inserts a record into `student_library_accounts`.
2. **No Query API**: There is **no backend controller or route** for `/v1/students/:id/library` or `/v1/students/:id/library/history`.
3. **No Issued Books Tracker in Backend**: The backend has no book catalog, checkout table, or due date calculator for student book borrowing.
4. **Verdict**: **UI ONLY**. The library screen is a frontend mockup with defensive empty states.

---

## 5. Summary Verdict

| Feature                           | Verdict                                 | Notes                                                                 |
| --------------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Notifications Listing & Read Sync | **VERIFIED — REAL BACKEND INTEGRATION** | Authoritative REST routes and WebSocket listener                      |
| Real-time WebSocket Auth          | **VERIFIED — REAL BACKEND INTEGRATION** | JWT token authentication and reconnection backoff                     |
| Push Notification Gateway         | **PARTIALLY INTEGRATED**                | Client token acquisition exists; production FCM relay pending         |
| Campus Transport Module           | **UI ONLY**                             | `TransportProvisioner` is an internal provisioning script, not an API |
| Campus Library Module             | **UI ONLY**                             | `LibraryProvisioner` is an internal provisioning script, not an API   |
