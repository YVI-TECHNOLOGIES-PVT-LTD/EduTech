# EduTrack ERP Mobile V1 — Phase 7 Manual QA Checklist

## 1. Authentication & Session Management

- [x] **Parent Login**: Enter valid parent credentials $\rightarrow$ successfully navigates to Parent Dashboard `/(parent)`.
- [x] **Invalid Login**: Enter incorrect password $\rightarrow$ displays friendly validation error without exposing server traces.
- [x] **Already Authenticated**: Open app with existing valid tokens $\rightarrow$ automatically restores session without login prompt.
- [x] **Parent Registration**: Complete 5-field registration $\rightarrow$ redirects to OTP screen with phone/email.
- [x] **OTP Verification**: Enter 6-digit OTP $\rightarrow$ verifies account, sets session, and opens dashboard.
- [x] **Role Guard**: Non-parent staff accounts are rejected with clear message and signed out.
- [x] **Logout Flow**: Tap Logout in Account tab $\rightarrow$ clears SecureStore tokens, terminates WebSocket with code 1000, and returns to Login.
- [x] **Session Expiry (401)**: Simulated expired access token triggers automatic session invalidation and redirect to login.

---

## 2. Dashboard & Navigation

- [x] **Native Bottom Tabs**: Home, Applications, Notifications, Account switch seamlessly with active tint colors.
- [x] **Unread Notification Badge**: Real-time counter badge appears on Notifications tab when unread items exist.
- [x] **Child Switcher**: Allows parent to switch active application profile when multiple children are enrolled/applying.
- [x] **Application Status Card**: Displays canonical admission status badge, submission date, and progress tracker.
- [x] **Pull to Refresh**: Pulling down on Dashboard reloads applications, admissions metadata, and notification counts.

---

## 3. 8-Step Admission Application

- [x] **Step 1 (Guidelines)**: Read admission criteria, check agreement box to unlock Step 2.
- [x] **Step 2 (Student Info)**: Fill in student first name, last name, DOB, gender, nationality with live Zod validation.
- [x] **Step 3 (Parent Info)**: Pre-populates logged-in parent details with relation selection.
- [x] **Step 4 (Academics)**: Select dynamic academic year, grade applying for, and previous school info.
- [x] **Step 5 (Documents)**: View dynamic checklist based on grade applied; attach PDF/images with 10MB limit check.
- [x] **Step 6 (Fee Summary)**: View itemized application and registration charges.
- [x] **Step 7 (Review & Declaration)**: Review entire application state and accept terms before final submission.
- [x] **Step 8 (Confirmation)**: Displays generated application reference number and links to application hub.
- [x] **Draft Resilience**: Backgrounding the app or tapping "Save & Exit" saves draft to local storage; reopening resumes exact step and field state.
- [x] **Draft Isolation**: Multiple applications or different parent logins maintain completely separate drafts.

---

## 4. Application Details Hub & Operational Modules

- [x] **Application Hub `/(parent)/applications/[id]`**: 5 action portals for Documents, Fees, Assessment, Decision, and Timeline.
- [x] **Document Center**: View uploaded verification statuses (`PENDING`, `VERIFIED`, `REJECTED`), upload/replace files, open secure signed URLs.
- [x] **Fee Statement & Payment**: Itemized ledger breakdown, payment mode selection (`UPI`, `Card`, `NetBanking`), single-submission safe payment mutation.
- [x] **Digital Receipt**: Printable fee receipt breakdown with transaction reference and status seal.
- [x] **Assessment Tracker**: Exam dates, evaluation stage, scores obtained, and percentage results.
- [x] **Decision Tracker**: Official outcome (`APPROVED`, `WAITLISTED`, `REJECTED`), offer letter deadline, waitlist rank.
- [x] **Milestone Timeline**: Chronological history of status transitions and verification milestones.

---

## 5. Notifications & Real-Time Sync

- [x] **Real-Time Delivery**: WebSocket `/ws/notifications` receives live `notification.created` events immediately upon backend status change.
- [x] **Targeted Cache Invalidation**: Real-time event for an application invalidates only that application's queries without full-app cache churn.
- [x] **Deduplication**: Ingesting notifications via REST and WebSocket never produces duplicate rows in the list.
- [x] **Mark Single Read**: Tapping or viewing an unread notification updates status optimistically and syncs with server.
- [x] **Mark All Read**: Header button marks all unread notifications with one tap.
- [x] **Deep Link Allowlist**: Tapping notifications routes directly to the relevant document, fee, assessment, or decision screen. Malformed or staff URLs are rejected safely.
- [x] **Connection Banner**: Reconnecting banner appears during network disconnection and dismisses upon reconnection.

---

## 6. Security, Privacy & Error Boundaries

- [x] **Global Error Boundary**: Catch unhandled runtime render exceptions with friendly recovery UI without crashing or exposing stack traces.
- [x] **Sensitive Data Redaction**: Log utility automatically redacts tokens, passwords, OTPs, and authorization headers from logs.
- [x] **Database Schema**: Zero SQL/Prisma modifications. Database remains strictly frozen.
