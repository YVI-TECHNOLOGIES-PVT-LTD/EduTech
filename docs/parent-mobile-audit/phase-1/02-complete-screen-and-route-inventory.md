# 02 — Complete Screen & Route Inventory: Parent Mobile Application

**Project:** EduTrack ERP — Parent Mobile Application  
**Audit Phase:** Phase 1 — Complete Mobile Application Audit & Baseline Validation  
**Date of Audit:** November 2, 2026  
**Status:** Complete & Validated  
**Inspection Scope:** All 30 discovered routes and 9 layouts across `apps/mobile_app/app/`

---

## 1. Inventory Summary & Classification

A physical scan of `apps/mobile_app/app/` identified **30 route files** and **9 layout files**.

| Category                               | Route Count | Implementation Breakdown                                                                                    |
| :------------------------------------- | :---------: | :---------------------------------------------------------------------------------------------------------- |
| **Root Gateways**                      |      2      | 1 Active (`/index`), 1 Duplicate (`/index - Copy`)                                                          |
| **Authentication Flow (`(auth)`)**     |      6      | 4 Fully Functional (`login`, `register`, `otp`, `splash`), 1 Stub (`forgot-password`), 1 Mock (`workspace`) |
| **Parent Portal (`(parent)`)**         |     11      | 11 Fully Functional with real backend API hooks                                                             |
| **Secondary / Staff Tabs (`(tabs)`)**  |      3      | 3 Functional UI screens with static/mock data                                                               |
| **Common System Screens (`(common)`)** |      4      | 3 Error/Maintenance UI, 1 Empty Notifications Stub                                                          |
| **Module Placeholders**                |      4      | 4 Shells (`(admission)`, `(student)`, `(teacher)`, `(parent)/applications`)                                 |
| **Total Discovered Routes**            |   **30**    | **15 Fully Implemented, 4 Partial, 11 UI/Stub/Duplicate**                                                   |

---

## 2. Comprehensive Screen-by-Screen Inventory

---

### Route 01: Root Application Gate

- **1. Screen Name:** Root Gate / Splash Loader
- **2. Route Name:** `/` (`index`)
- **3. Module:** Core Navigation Gateway
- **4. File Location:** `apps/mobile_app/app/index.tsx`
- **5. Entry Point:** App Cold Launch (`main: expo-router/entry`)
- **6. Navigation Method:** Conditional redirection via `router.replace`
- **7. Main UI Components:** `Loader` (variant: "page")
- **8. API Dependencies:** None directly (reads Zustand `useAuthStore`)
- **9. Data Displayed:** Loading indicator with status message `"Loading EduTrack ERP..."`
- **10. User Actions:** None (automatic redirect based on auth token state)
- **11. Loading State:** Dedicated full-screen spinning loader
- **12. Empty State:** N/A
- **13. Error State:** N/A
- **14. Current UI/UX Problems:** Spinner flashes abruptly if auth hydration takes <50ms; no brand logo displayed during check.
- **15. Redesign Opportunities:** Integrate smooth splash branding animation matching native OS launch screens.

---

### Route 02: Root Application Gate (Orphan Duplicate)

- **1. Screen Name:** Root Gate Copy (Legacy Redirector)
- **2. Route Name:** `/index - Copy`
- **3. Module:** Dead Code / Orphan Artifact
- **4. File Location:** `apps/mobile_app/app/index - Copy.tsx`
- **5. Entry Point:** Exposed via Expo Router deep-link `edutrack://index - Copy`
- **6. Navigation Method:** Timeout redirect to `ROUTES.TABS.DASHBOARD` or `ROUTES.AUTH.SPLASH`
- **7. Main UI Components:** `Loader`
- **8. API Dependencies:** None
- **9. Data Displayed:** "Loading EduTrack ERP..."
- **10. User Actions:** None
- **11. Loading State:** Full-screen loader
- **12. Empty State:** N/A
- **13. Error State:** N/A
- **14. Current UI/UX Problems:** Dead route artifact left over from previous refactoring. Routes to legacy tabs instead of parent portal.
- **15. Redesign Opportunities:** Must be safely removed from codebase in Phase 2.

---

### Route 03: Public Splash & Welcome Screen

- **1. Screen Name:** Splash Welcome
- **2. Route Name:** `/(auth)/splash`
- **3. Module:** Authentication & Onboarding
- **4. File Location:** `apps/mobile_app/app/(auth)/splash.tsx`
- **5. Entry Point:** First-time launch or unauthenticated user landing
- **6. Navigation Method:** Stack push to `/(auth)/login`
- **7. Main UI Components:** Hero typography, background vector illustrations, `TouchableOpacity` CTA
- **8. API Dependencies:** None
- **9. Data Displayed:** ERP Tagline: _"Empowering Education, Enriching Futures"_, School ERP badge
- **10. User Actions:** Tap "Get Started!" button
- **11. Loading State:** Static content; no loading state required
- **12. Empty State:** N/A
- **13. Error State:** N/A
- **14. Current UI/UX Problems:** Hardcoded dark indigo theme `#3730a3` does not respect user theme preferences. Text is not wrapped in accessibility labels.
- **15. Redesign Opportunities:** Add school branding carousel, multi-tenant school logo picker, smooth entry animations.

---

### Route 04: Parent Login Screen

- **1. Screen Name:** Parent Login
- **2. Route Name:** `/(auth)/login`
- **3. Module:** Authentication & Security
- **4. File Location:** `apps/mobile_app/app/(auth)/login.tsx`
- **5. Entry Point:** Navigated from Splash or auto-redirected when unauthenticated
- **6. Navigation Method:** Push to `register`, `forgot-password`; Replace to `/(parent)` on success
- **7. Main UI Components:** `TextInput`, `PasswordInput`, `Button`, `KeyboardAvoidingView`
- **8. API Dependencies:** `POST /v1/auth/login` (`useLogin`, `authApi.login`)
- **9. Data Displayed:** Welcome Back header, input fields (Email, Password), error banners, prefilled verified email if returning from OTP
- **10. User Actions:** Email entry, password visibility toggle, submission, navigation to registration or password recovery
- **11. Loading State:** `Button` displays activity indicator (`loading={isPending}`)
- **12. Empty State:** Initial blank form state
- **13. Error State:** Inline validation messages from Zod (`loginSchema`), top alert banner for API 401/403/500 errors
- **14. Current UI/UX Problems:** No "Remember Me" toggle; no biometric login button despite Settings having a biometric toggle; keyboard occasionally overlays button on smaller Android displays.
- **15. Redesign Opportunities:** Introduce biometric quick-login (FaceID / Fingerprint), school workspace switcher option, SSO login button.

---

### Route 05: Parent Registration Screen

- **1. Screen Name:** Parent Self-Registration
- **2. Route Name:** `/(auth)/register`
- **3. Module:** Authentication & Onboarding
- **4. File Location:** `apps/mobile_app/app/(auth)/register.tsx`
- **5. Entry Point:** Link from Login screen ("Don't have an account? Sign up")
- **6. Navigation Method:** Stack push; Navigates to `/(auth)/otp` upon successful account creation
- **7. Main UI Components:** Form inputs (Full Name, Email, Phone, Password, Confirm Password), password strength meter bar, submit button
- **8. API Dependencies:** `POST /v1/admission/register` (`useRegister`, `authApi.register`)
- **9. Data Displayed:** Field labels, real-time password strength score (Weak, Medium, Strong), error messages
- **10. User Actions:** Enter registration fields, toggle password masking, submit form
- **11. Loading State:** Submit button displays loading spinner during network request
- **12. Empty State:** Initial blank form
- **13. Error State:** Zod field validation errors, duplicate email/phone conflict error banners
- **14. Current UI/UX Problems:** Very long form inside a `KeyboardAvoidingView` without step indicators; password rules are not clearly communicated before typing begins.
- **15. Redesign Opportunities:** 2-step compact wizard (Step 1: Contact Details, Step 2: Security Credentials), inline password guideline checklist.

---

### Route 06: Forgot Password Screen

- **1. Screen Name:** Forgot Password Recovery
- **2. Route Name:** `/(auth)/forgot-password`
- **3. Module:** Authentication & Recovery
- **4. File Location:** `apps/mobile_app/app/(auth)/forgot-password.tsx`
- **5. Entry Point:** Link from Login screen ("Forgot password?")
- **6. Navigation Method:** Pushes to `/(auth)/otp` without passing parameters
- **7. Main UI Components:** `Input` (Email Address), `Button` ("Send OTP")
- **8. API Dependencies:** **NONE (STUB / BROKEN FUNCTIONALITY)**
- **9. Data Displayed:** Reset instructions text, email input field
- **10. User Actions:** Enters email, taps Send OTP
- **11. Loading State:** None implemented
- **12. Empty State:** N/A
- **13. Error State:** None implemented
- **14. Current UI/UX Problems:** **Critical functional defect**: Tapping "Send OTP" directly navigates to the OTP screen without triggering any password reset API call. The user reaches OTP screen with an empty email parameter.
- **15. Redesign Opportunities:** Connect to backend password reset endpoint (`POST /v1/auth/forgot-password`), add phone OTP option, add clear email delivery confirmation state.

---

### Route 07: OTP Verification Screen

- **1. Screen Name:** OTP Verification
- **2. Route Name:** `/(auth)/otp`
- **3. Module:** Authentication & Security
- **4. File Location:** `apps/mobile_app/app/(auth)/otp.tsx`
- **5. Entry Point:** Navigated from Register or Forgot Password
- **6. Navigation Method:** On success, replaces to `/(auth)/login` with query params `{ verifiedEmail, verified: 'true' }`
- **7. Main UI Components:** 6-box individual digit inputs with auto-focus advance, countdown timer, resend button
- **8. API Dependencies:** `POST /v1/admission/verify-otp` (`useVerifyOtp`, `authApi.verifyOtp`)
- **9. Data Displayed:** Target email/phone masked string, 60-second countdown timer, verification error messages
- **10. User Actions:** Type or paste 6-digit OTP, backspace auto-reverse, tap Resend Code, tap Verify
- **11. Loading State:** Button spinner when verifying
- **12. Empty State:** Six empty digit boxes
- **13. Error State:** Red border on input boxes upon invalid OTP; top error banner with server error
- **14. Current UI/UX Problems:** Resend button does not trigger an actual resend API (resets timer only); clipboard auto-paste does not handle all Android SMS autofill scenarios.
- **15. Redesign Opportunities:** SMS autofill integration (`react-native-otp-verify` / Expo SMS), connected resend mutation.

---

### Route 08: Workspace Selection Screen (Mock)

- **1. Screen Name:** School Workspace Selection
- **2. Route Name:** `/(auth)/workspace`
- **3. Module:** Multi-Tenant Organization
- **4. File Location:** `apps/mobile_app/app/(auth)/workspace.tsx`
- **5. Entry Point:** Accessible from legacy Profile screen shortcuts
- **6. Navigation Method:** Replaces to `/(tabs)/dashboard`
- **7. Main UI Components:** Radio list cards, campus badges, select button
- **8. API Dependencies:** **NONE (100% Mock Data)**
- **9. Data Displayed:** Hardcoded institutions: "Springfield International Academy" and "St. Jude Grammar School"
- **10. User Actions:** Select campus radio item, tap Continue
- **11. Loading State:** None
- **12. Empty State:** N/A
- **13. Error State:** N/A
- **14. Current UI/UX Problems:** Entirely mocked; does not fetch tenant organizations from backend; routes user to legacy Admin dashboard instead of parent flow.
- **15. Redesign Opportunities:** Wire to real multi-branch school selection API for parents with children in different campuses.

---

### Route 09: Parent Home Dashboard

- **1. Screen Name:** Parent Dashboard
- **2. Route Name:** `/(parent)` (`index`)
- **3. Module:** Parent Portal & Admission Hub
- **4. File Location:** `apps/mobile_app/app/(parent)/index.tsx`
- **5. Entry Point:** Main landing screen after parent authentication
- **6. Navigation Method:** Bottom tab #1; Pushes to application details, wizard, or notifications
- **7. Main UI Components:** Welcome hero card, `ChildSwitcher` tab row, `ApplicationStatusCard`, Quick Action navigation cards, unread notification bell
- **8. API Dependencies:**
  - `GET /v1/applications?mine=true` (`applicationsApi.listMine`)
  - `GET /v1/notifications/unread-count` (`notificationsApi.getUnreadCount`)
- **9. Data Displayed:** Parent greeting name, active academic session, child switcher tabs, active admission application status card (with progress %), quick action shortcuts
- **10. User Actions:** Switch active child, tap status card to open detail hub, tap "New Application", tap "My Applications", tap notification bell, pull-to-refresh
- **11. Loading State:** Full container `ActivityIndicator` with message `"Loading admission applications..."`
- **12. Empty State:** High-quality empty card with icon, message, and "Start Admission Application" button
- **13. Error State:** Red alert card with "Retry Connection" button
- **14. Current UI/UX Problems:** Focuses exclusively on admission applications. If a parent has already enrolled students (SIS), there are no attendance, grade, timetable, or school fee cards.
- **15. Redesign Opportunities:** Unify Admission lifecycle with Enrolled Student SIS dashboard (Attendance widget, Fees due banner, Today's Timetable, Latest Notices).

---

### Route 10: Parent Applications List

- **1. Screen Name:** My Applications
- **2. Route Name:** `/(parent)/applications`
- **3. Module:** Parent Portal / Admission Management
- **4. File Location:** `apps/mobile_app/app/(parent)/applications.tsx`
- **5. Entry Point:** Bottom tab #2; Also linked from Dashboard shortcut
- **6. Navigation Method:** Pushes to `/(parent)/applications/wizard` or `/(parent)/applications/[id]`
- **7. Main UI Components:** Header with record count, New Application button, refresh button, list of `ApplicationStatusCard`s
- **8. API Dependencies:** `GET /v1/applications?mine=true` (`useMyApplications`)
- **9. Data Displayed:** Total count of applications, student name, application number, grade, submission date, status badge, progress percentage
- **10. User Actions:** Pull-to-refresh, tap card to open details, tap "+ New" to launch wizard
- **11. Loading State:** Centered `ActivityIndicator`
- **12. Empty State:** Empty container prompting user to create their first application
- **13. Error State:** Error card with "Try Again" retry button
- **14. Current UI/UX Problems:** Uses a simple vertical `ScrollView` instead of an optimized `FlatList` with virtualization; no filtering by status (Draft vs Approved vs Under Review).
- **15. Redesign Opportunities:** Convert to `FlatList`, add segmented status filter pills (All, Active, Enrolled, Action Required), add search bar for parents with multiple applications.

---

### Route 11: Parent Notification Center

- **1. Screen Name:** Notifications & Alerts
- **2. Route Name:** `/(parent)/notifications`
- **3. Module:** Communication & Notifications
- **4. File Location:** `apps/mobile_app/app/(parent)/notifications.tsx`
- **5. Entry Point:** Bottom tab #3; Top header bell on dashboard
- **6. Navigation Method:** Pushes to deep-link destinations via `resolveNotificationRoute`
- **7. Main UI Components:** `ConnectionStatusBanner` (WebSocket indicator), Segmented filter ('all' vs 'unread'), `NotificationCard` list, `NotificationSkeleton`, "Mark all as read" button
- **8. API Dependencies:**
  - `GET /v1/notifications` (`useNotifications`)
  - `GET /v1/notifications/unread-count` (`useUnreadNotificationCount`)
  - `PATCH /v1/notifications/:id/read` (`useMarkNotificationRead`)
  - `POST /v1/notifications/mark-all-read` (`useMarkAllNotificationsRead`)
  - WebSocket `ws://.../ws/notifications` (`NotificationSocketManager`)
- **9. Data Displayed:** Unread count badge, real-time socket status (Connecting / Connected / Disconnected), notification title, message, relative timestamp, read/unread indicators
- **10. User Actions:** Toggle filter, tap notification to navigate to relevant entity, tap checkmark to mark single read, tap "Mark all read", pull-to-refresh
- **11. Loading State:** Shimmer `NotificationSkeleton` cards
- **12. Empty State:** `NotificationEmptyState` with illustration and description
- **13. Error State:** Error banner with retry button
- **14. Current UI/UX Problems:** Notification categories are not visually distinct (financial vs academic vs admission); no swipe-to-dismiss gesture.
- **15. Redesign Opportunities:** Add category icons (Finance = yellow, Academic = blue, Urgent = red), swipe-to-delete/archive, push notification preference toggle.

---

### Route 12: Parent Account Profile

- **1. Screen Name:** Parent Account
- **2. Route Name:** `/(parent)/profile`
- **3. Module:** Profile & Settings
- **4. File Location:** `apps/mobile_app/app/(parent)/profile.tsx`
- **5. Entry Point:** Bottom tab #4 ("Account")
- **6. Navigation Method:** Replaces to `/(auth)/login` on logout
- **7. Main UI Components:** Avatar initials badge, verified parent pill, contact info rows (Email, Mobile, Role), theme switcher mode selector, logout button
- **8. API Dependencies:** `useAuthStore` user profile, `useTheme`, `authApi.logout`
- **9. Data Displayed:** Parent display name, email, phone number, account verification status, current theme
- **10. User Actions:** Toggle light/dark theme, tap Logout (with confirmation prompt)
- **11. Loading State:** None needed (reads local store)
- **12. Empty State:** N/A
- **13. Error State:** N/A
- **14. Current UI/UX Problems:** Read-only contact details; no ability to update phone number, address, or emergency contacts; missing password change section.
- **15. Redesign Opportunities:** Add "Edit Profile" flow, change password modal, notification preferences sheet, linked children overview card.

---

### Route 13: Admission Application Wizard (8 Steps)

- **1. Screen Name:** Admission Application Wizard
- **2. Route Name:** `/(parent)/applications/wizard`
- **3. Module:** Admission Self-Service
- **4. File Location:** `apps/mobile_app/app/(parent)/applications/wizard.tsx`
- **5. Entry Point:** "New Admission Application" button on Dashboard or Applications list
- **6. Navigation Method:** Pushes from list; Navigates between 8 steps internally; Replaces to application detail upon submission
- **7. Main UI Components:** `WizardProgressBar`, step components (`WizardStep1Guidelines` to `WizardStep8Confirmation`), React Hook Form controllers, draft save button
- **8. API Dependencies:**
  - `GET /public/admission/config` (`useAdmissionConfig`)
  - `GET /public/academic-years` (`useAcademicYears`)
  - `GET /public/classes` (`useClasses`)
  - `GET /v1/applications/document-types` (`useDocumentTypes`)
  - `POST /v1/applications` (`useSubmitApplication`)
  - `DraftStorage` (AsyncStorage local draft persistence)
- **9. Data Displayed:** Current step index (1 of 8), guideline clauses, student personal fields, parent guardian details, previous school history, required document upload slots, fee summary, final review summary, confirmation card
- **10. User Actions:** Accept guidelines, enter form data, pick document files, select payment mode, save draft, review and submit
- **11. Loading State:** Metadata loading skeletons; full-screen overlay during final multipart submission
- **12. Empty State:** N/A
- **13. Error State:** Step-by-step Zod validation triggers; alert on submission network failure
- **14. Current UI/UX Problems:** Wizard is very long (8 steps) and can feel exhausting on a phone; step navigation requires completing every field sequentially without jumping between completed sections.
- **15. Redesign Opportunities:** Collapse to a 4-step streamlined process (1. Student & Academic, 2. Parent & Contact, 3. Documents, 4. Review & Pay).

---

### Route 14: Application Detail Hub

- **1. Screen Name:** Application Hub
- **2. Route Name:** `/(parent)/applications/[id]`
- **3. Module:** Admission Lifecycle Management
- **4. File Location:** `apps/mobile_app/app/(parent)/applications/[id].tsx`
- **5. Entry Point:** Tap on any application card on Dashboard or Applications list
- **6. Navigation Method:** Stack push with dynamic `id` param; Pushes to 5 sub-routes
- **7. Main UI Components:** Student header with app number, status badge, progress banner, 5 Action Hub portal cards (Document Center, Fee Statement, Assessment Tracker, Admission Decision, Status Timeline)
- **8. API Dependencies:** `GET /v1/applications/:id` (`applicationsApi.getById`)
- **9. Data Displayed:** Student full name, application number, status badge (e.g. "Documents Pending", "Under Review"), progress percentage, document count, fee status preview
- **10. User Actions:** Navigate to Document Center, Fee Statement, Assessment, Decision, or Timeline; tap back
- **11. Loading State:** Full-screen spinner with `"Loading application hub..."`
- **12. Empty State:** "Application Not Found" error card
- **13. Error State:** Error container with "Try Again" and "Go Back" buttons
- **14. Current UI/UX Problems:** The 5 portal cards are identical in structure and visual weight; does not highlight which specific action is blocking progress (e.g. "Documents Required").
- **15. Redesign Opportunities:** Dynamic priority action hero: if status is "DOCUMENTS_PENDING", highlight Document Center in orange with an "Upload Now" primary button.

---

### Route 15: Application Document Center

- **1. Screen Name:** Document Center
- **2. Route Name:** `/(parent)/applications/[id]/documents`
- **3. Module:** Admission Documents
- **4. File Location:** `apps/mobile_app/app/(parent)/applications/[id]/documents.tsx`
- **5. Entry Point:** Action portal card on Application Detail Hub
- **6. Navigation Method:** Stack push; Back button returns to Application Hub
- **7. Main UI Components:** Document requirement checklist cards (`DocumentStatusCard`), file picker button (`DocumentPicker`), signed URL download trigger, status badges (`DocumentStatusBadge`)
- **8. API Dependencies:**
  - `GET /v1/applications/document-types` (`useDocumentTypes`)
  - `GET /v1/applications/:id/documents` (`useApplicationDocuments`)
  - `POST /v1/applications/:id/documents` (`useUploadDocument`)
  - `GET /v1/applications/documents/:docId/signed-url` (`documentsApi.getSignedUrl`)
- **9. Data Displayed:** Document type name, mandatory/optional tag, upload status (Pending / Uploaded / Verified / Rejected), rejection remarks, view button
- **10. User Actions:** Pick PDF or image (max 10MB), upload/replace file, open signed document URL in system viewer, pull-to-refresh
- **11. Loading State:** Shimmer skeletons while fetching document types and existing uploads
- **12. Empty State:** "No Documents Required" state if config has no types
- **13. Error State:** Inline error banners; file size error alert
- **14. Current UI/UX Problems:** Cannot preview images inline inside the app (launches external browser/viewer); no camera snapshot shortcut (only document picker).
- **15. Redesign Opportunities:** Add camera capture button (`expo-image-picker`), in-app thumbnail preview, document scanning perspective crop.

---

### Route 16: Application Fee Statement & Settlement

- **1. Screen Name:** Fee Statement
- **2. Route Name:** `/(parent)/applications/[id]/fees`
- **3. Module:** Admission Finance
- **4. File Location:** `apps/mobile_app/app/(parent)/applications/[id]/fees.tsx`
- **5. Entry Point:** Action portal card on Application Detail Hub
- **6. Navigation Method:** Stack push; Navigates to `receipt` on payment success
- **7. Main UI Components:** `FeeBreakdownCard`, payment mode selector pills (UPI, Net Banking, Debit/Credit Card), "Pay Now" action button
- **8. API Dependencies:**
  - `GET /v1/applications/:id/fee` (`useApplicationFee`)
  - `POST /v1/applications/:id/payment` (`useRecordPayment`)
- **9. Data Displayed:** Application fee breakdown (base fee, tax, total), payment status (Pending / Paid / Waived), payment mode options
- **10. User Actions:** Select payment mode, tap "Pay Admission Fee", pull-to-refresh
- **11. Loading State:** Fee card skeleton; button loading state during payment processing (`isPaying`)
- **12. Empty State:** "No Fee Applicable" banner
- **13. Error State:** Network error card; payment failure alert
- **14. Current UI/UX Problems:** **Simulated payment only**: Generates a dummy transaction reference `MOB-${Date.now()}` and records payment directly on backend without a true gateway checkout interface.
- **15. Redesign Opportunities:** Integrate production Payment Gateway SDK (Razorpay / Stripe) with native checkout sheet and webhook verification.

---

### Route 17: Application Fee Receipt

- **1. Screen Name:** Payment Receipt
- **2. Route Name:** `/(parent)/applications/[id]/receipt`
- **3. Module:** Admission Finance
- **4. File Location:** `apps/mobile_app/app/(parent)/applications/[id]/receipt.tsx`
- **5. Entry Point:** Navigated after successful payment or from Fee Statement
- **6. Navigation Method:** Stack push; Back button returns to Fee Statement or Hub
- **7. Main UI Components:** Paper receipt card, dashed divider, checkmark badge, transaction metadata rows, "Share Receipt" button
- **8. API Dependencies:** `GET /v1/applications/:id/receipt` (`useApplicationReceipt`)
- **9. Data Displayed:** Official receipt number, student name, application number, paid amount (₹), payment date, payment mode, transaction reference ID
- **10. User Actions:** Tap Back, pull-to-refresh
- **11. Loading State:** Centered activity indicator
- **12. Empty State:** "No Receipt Available" warning if payment is still pending
- **13. Error State:** Error card with Back button
- **14. Current UI/UX Problems:** "Share Receipt" and "Download PDF" buttons are missing native sharing triggers (`expo-sharing` / `expo-print`).
- **15. Redesign Opportunities:** Add PDF download, print, and WhatsApp/email receipt sharing.

---

### Route 18: Assessment Tracker

- **1. Screen Name:** Assessment Tracker
- **2. Route Name:** `/(parent)/applications/[id]/assessment`
- **3. Module:** Admission Evaluation
- **4. File Location:** `apps/mobile_app/app/(parent)/applications/[id]/assessment.tsx`
- **5. Entry Point:** Action portal card on Application Detail Hub
- **6. Navigation Method:** Stack push
- **7. Main UI Components:** Info banner, `AssessmentCard` (test schedule, venue, examiner, scoring)
- **8. API Dependencies:** `GET /v1/applications/:id/assessment` (`useApplicationAssessment`)
- **9. Data Displayed:** Assessment status (Scheduled / Completed / Passed / Failed), exam date & time, venue / room number, interviewer name, obtained marks, passing score, evaluator notes
- **10. User Actions:** Pull-to-refresh, tap Back
- **11. Loading State:** Activity indicator
- **12. Empty State:** "Assessment Not Yet Scheduled" informational card
- **13. Error State:** Error banner with retry button
- **14. Current UI/UX Problems:** If exam is online, there is no meeting link / video call launcher; venue details lack a map location pin.
- **15. Redesign Opportunities:** Add "Add to Calendar" button, Google Meet / Zoom join button for virtual interviews, venue map shortcut.

---

### Route 19: Admission Decision & Offer

- **1. Screen Name:** Admission Decision
- **2. Route Name:** `/(parent)/applications/[id]/decision`
- **3. Module:** Admission Lifecycle
- **4. File Location:** `apps/mobile_app/app/(parent)/applications/[id]/decision.tsx`
- **5. Entry Point:** Action portal card on Application Detail Hub
- **6. Navigation Method:** Stack push
- **7. Main UI Components:** Committee outcome banner, `DecisionCard`, offer acceptance actions
- **8. API Dependencies:** `GET /v1/applications/:id/decision` (`useApplicationDecision`)
- **9. Data Displayed:** Final decision outcome (Accepted / Waitlisted / Rejected / Under Review), official committee remarks, offer letter valid-until date, enrollment instructions
- **10. User Actions:** View decision remarks, pull-to-refresh, tap Back
- **11. Loading State:** Activity indicator
- **12. Empty State:** "Decision Pending" informational container
- **13. Error State:** Error container with retry
- **14. Current UI/UX Problems:** No interactive "Accept Offer" or "Decline Offer" button for parents if the application is approved.
- **15. Redesign Opportunities:** Add formal Offer Acceptance button with terms sign-off, offer letter PDF download.

---

### Route 20: Milestone Timeline

- **1. Screen Name:** Milestone Timeline
- **2. Route Name:** `/(parent)/applications/[id]/timeline`
- **3. Module:** Admission Audit Trail
- **4. File Location:** `apps/mobile_app/app/(parent)/applications/[id]/timeline.tsx`
- **5. Entry Point:** Action portal card on Application Detail Hub
- **6. Navigation Method:** Stack push
- **7. Main UI Components:** Timeline history cards (`TimelineStepCard`), vertical timeline connectors
- **8. API Dependencies:** `GET /v1/applications/:id/timeline` (`useApplicationTimeline`)
- **9. Data Displayed:** Chronological list of events: event name, stage, timestamp, actor role, notes
- **10. User Actions:** Scroll timeline, pull-to-refresh
- **11. Loading State:** Activity indicator
- **12. Empty State:** "No Timeline Events Recorded"
- **13. Error State:** Error banner
- **14. Current UI/UX Problems:** Vertical timeline line occasionally breaks between variable-height cards; timestamps are not formatted in localized 12-hour format.
- **15. Redesign Opportunities:** Clean visual vertical stepper with glowing current-step indicator and relative timestamps ("2 hours ago").

---

### Route 21: Secondary Admin Dashboard (Mock)

- **1. Screen Name:** Secondary Dashboard
- **2. Route Name:** `/(tabs)/dashboard`
- **3. Module:** Staff / Admin Mock
- **4. File Location:** `apps/mobile_app/app/(tabs)/dashboard.tsx`
- **5. Entry Point:** Secondary tab #1 (Navigated from Workspace or Unexpected Error)
- **6. Navigation Method:** Bottom tabs; Quick access cards
- **7. Main UI Components:** `ScreenWrapper`, hardcoded 4-column overview cards, 2x3 quick access grid
- **8. API Dependencies:** **NONE (100% Mock Data)**
- **9. Data Displayed:** Mock numbers: "1,248 Students", "98 Teachers", "28 Classes", "3 Branches", "Admin • Greenfield School"
- **10. User Actions:** Tap quick access cards: Attendance (navigates to `/(student)`), Assignments, Exams, Fees, Timetable (all loop back to `/(tabs)/dashboard`), Notices (navigates to `/(common)/notifications`)
- **11. Loading State:** None
- **12. Empty State:** N/A
- **13. Error State:** N/A
- **14. Current UI/UX Problems:** **Severe navigation dead-ends**: 4 out of 6 quick access buttons route to the screen itself (`ROUTES.TABS.DASHBOARD`). Displays hardcoded admin data completely irrelevant to parents.
- **15. Redesign Opportunities:** Deprecate or replace entirely with Parent SIS Home in Phase 2.

---

### Route 22: Secondary Profile (Mock)

- **1. Screen Name:** Staff / Admin Profile
- **2. Route Name:** `/(tabs)/profile`
- **3. Module:** Legacy Mock Profile
- **4. File Location:** `apps/mobile_app/app/(tabs)/profile.tsx`
- **5. Entry Point:** Secondary tab #2
- **6. Navigation Method:** Pushes to `settings` or `workspace`; Replaces to login on logout
- **7. Main UI Components:** Hero avatar card, school context card, shortcuts card, logout button
- **8. API Dependencies:** `AuthService.logout`, reads `useAuthStore`
- **9. Data Displayed:** Mock data: "Dr. Sarah Jenkins", "SCHOOL_ADMIN", "Springfield Academy"
- **10. User Actions:** Tap App Settings, tap Switch Workspace, tap Sign Out
- **11. Loading State:** None
- **12. Empty State:** N/A
- **13. Error State:** N/A
- **14. Current UI/UX Problems:** Hardcoded user profile data clashing with the authenticated parent user state.
- **15. Redesign Opportunities:** Deprecate in favor of `app/(parent)/profile.tsx`.

---

### Route 23: Application Settings

- **1. Screen Name:** Settings Screen
- **2. Route Name:** `/(tabs)/settings`
- **3. Module:** Application Preferences
- **4. File Location:** `apps/mobile_app/app/(tabs)/settings.tsx`
- **5. Entry Point:** Link from Secondary Profile screen
- **6. Navigation Method:** Stack push within `(tabs)`
- **7. Main UI Components:** Theme selector cards (Light, Dark, System), `Switch` toggles (Biometric, Push Notifications), Version info card
- **8. API Dependencies:** `useThemeStore` (`setMode`)
- **9. Data Displayed:** Active theme, biometrics toggle, notification toggle, app version "1.0.0 (Build 102)"
- **10. User Actions:** Select theme mode, toggle biometrics, toggle push notifications
- **11. Loading State:** None
- **12. Empty State:** N/A
- **13. Error State:** N/A
- **14. Current UI/UX Problems:** Biometric switch is local component state only (`useState(true)`) and not connected to device biometrics or `expo-local-authentication`. Push switch is also unconnected.
- **15. Redesign Opportunities:** Move Settings into Parent Portal (`app/(parent)/settings.tsx`), wire switches to `expo-local-authentication` and notification permissions.

---

### Route 24: Common Notifications Stub

- **1. Screen Name:** Generic Notifications
- **2. Route Name:** `/(common)/notifications`
- **3. Module:** Common Services
- **4. File Location:** `apps/mobile_app/app/(common)/notifications.tsx`
- **5. Entry Point:** Quick access shortcut on secondary dashboard
- **6. Navigation Method:** Stack push
- **7. Main UI Components:** `ScreenWrapper`, `SectionHeader`, `EmptyState`
- **8. API Dependencies:** **NONE (STUB)**
- **9. Data Displayed:** Static text: _"You have no unread notifications or alerts."_
- **10. User Actions:** None
- **11. Loading State:** None
- **12. Empty State:** Always empty
- **13. Error State:** None
- **14. Current UI/UX Problems:** Completely duplicate and non-functional compared to the real notification center at `app/(parent)/notifications.tsx`.
- **15. Redesign Opportunities:** Remove this stub and redirect all navigation to `app/(parent)/notifications.tsx`.

---

### Route 25: No Internet Network Screen

- **1. Screen Name:** No Internet Connection
- **2. Route Name:** `/(common)/no-internet`
- **3. Module:** Network Exception Handling
- **4. File Location:** `apps/mobile_app/app/(common)/no-internet.tsx`
- **5. Entry Point:** Triggered on complete network drop
- **6. Navigation Method:** Full screen modal replacement
- **7. Main UI Components:** Satellite dish emoji, title, explanatory text, `Button` ("Retry Connection")
- **8. API Dependencies:** None
- **9. Data Displayed:** "No Internet Connection - Please check your network settings"
- **10. User Actions:** Tap "Retry Connection" (currently has empty callback `onPress={() => {}}`)
- **11. Loading State:** None
- **12. Empty State:** N/A
- **13. Error State:** Full-screen error
- **14. Current UI/UX Problems:** "Retry Connection" button does nothing (`onPress={() => {}}`); no automatic network reconnection listener.
- **15. Redesign Opportunities:** Hook to `NetInfo` / `NetworkProvider` to automatically dismiss when internet connectivity is restored.

---

### Route 26: System Under Maintenance Screen

- **1. Screen Name:** Maintenance
- **2. Route Name:** `/(common)/maintenance`
- **3. Module:** System Operations
- **4. File Location:** `apps/mobile_app/app/(common)/maintenance.tsx`
- **5. Entry Point:** Triggered when backend returns 503 Service Unavailable
- **6. Navigation Method:** Stack push
- **7. Main UI Components:** Hammer & wrench emoji, title, text
- **8. API Dependencies:** None
- **9. Data Displayed:** "EduTrack ERP is currently undergoing scheduled system updates."
- **10. User Actions:** None
- **11. Loading State:** None
- **12. Empty State:** N/A
- **13. Error State:** Full screen maintenance
- **14. Current UI/UX Problems:** No "Check Status" button or refresh action; user is locked on the screen without a way to retry.
- **15. Redesign Opportunities:** Add auto-retry timer and "Check Service Status" button.

---

### Route 27: Unexpected Error Fallback Screen

- **1. Screen Name:** Unexpected Error
- **2. Route Name:** `/(common)/unexpected-error`
- **3. Module:** Error Handling & Crash Recovery
- **4. File Location:** `apps/mobile_app/app/(common)/unexpected-error.tsx`
- **5. Entry Point:** ErrorBoundary fallback
- **6. Navigation Method:** Stack push
- **7. Main UI Components:** Warning emoji, title, message, `Button` ("Return to Dashboard")
- **8. API Dependencies:** None
- **9. Data Displayed:** "An unexpected error has disrupted your session."
- **10. User Actions:** Tap "Return to Dashboard"
- **11. Loading State:** None
- **12. Empty State:** N/A
- **13. Error State:** Full-screen crash recovery
- **14. Current UI/UX Problems:** Button calls `router.replace(ROUTES.TABS.DASHBOARD)` which routes parents to the mock school admin dashboard instead of `ROUTES.PARENT.DASHBOARD`.
- **15. Redesign Opportunities:** Route parents correctly to `ROUTES.PARENT.DASHBOARD` and log error stack to error monitoring service.

---

### Route 28: Admission Module Shell Placeholder

- **1. Screen Name:** Admission Management Shell
- **2. Route Name:** `/(admission)` (`index`)
- **3. Module:** Generic Module Shell
- **4. File Location:** `apps/mobile_app/app/(admission)/index.tsx`
- **5. Entry Point:** Navigated via `ROUTES.MODULES.ADMISSION`
- **6. Navigation Method:** Stack push
- **7. Main UI Components:** `ModuleShell` component with icon "📝"
- **8. API Dependencies:** None
- **9. Data Displayed:** "Admission Management Active — Enterprise ERP module architecture integrated & operational."
- **10. User Actions:** None
- **11. Loading State:** None
- **12. Empty State:** N/A
- **13. Error State:** N/A
- **14. Current UI/UX Problems:** Redundant placeholder. The actual parent admission implementation lives under `app/(parent)/`.
- **15. Redesign Opportunities:** Deprecate or redirect to `app/(parent)/applications.tsx`.

---

### Route 29: Student Information System Shell Placeholder

- **1. Screen Name:** SIS Student Shell
- **2. Route Name:** `/(student)` (`index`)
- **3. Module:** Generic Module Shell
- **4. File Location:** `apps/mobile_app/app/(student)/index.tsx`
- **5. Entry Point:** Navigated via `ROUTES.MODULES.STUDENT` from secondary dashboard attendance button
- **6. Navigation Method:** Stack push
- **7. Main UI Components:** `ModuleShell` component with icon "🎓"
- **8. API Dependencies:** None
- **9. Data Displayed:** "Student Information System Active — Manage student profiles, attendance, grades..."
- **10. User Actions:** None
- **11. Loading State:** None
- **12. Empty State:** N/A
- **13. Error State:** N/A
- **14. Current UI/UX Problems:** Empty placeholder. Parents cannot view actual enrolled student attendance, timetables, or grades.
- **15. Redesign Opportunities:** Build the complete Parent Student Information System (SIS) module here or within `app/(parent)/student/`.

---

### Route 30: Teacher Portal Shell Placeholder

- **1. Screen Name:** Teacher Portal Shell
- **2. Route Name:** `/(teacher)` (`index`)
- **3. Module:** Generic Module Shell
- **4. File Location:** `apps/mobile_app/app/(teacher)/index.tsx`
- **5. Entry Point:** Unregistered in root `_layout.tsx`; accessible only via deep link
- **6. Navigation Method:** Stack push
- **7. Main UI Components:** `ModuleShell` component with icon "👩‍🏫"
- **8. API Dependencies:** None
- **9. Data Displayed:** "Teacher Portal Active — Manage class schedules, student attendance..."
- **10. User Actions:** None
- **11. Loading State:** None
- **12. Empty State:** N/A
- **13. Error State:** N/A
- **14. Current UI/UX Problems:** Non-parent feature; not registered in root layout navigation.
- **15. Redesign Opportunities:** Remove from parent-focused mobile application.

---

## 3. Discovered Navigation Anomalies & Dead Ends

1. **Dead Duplicate Route:** `app/index - Copy.tsx` is an exposed route `/index - Copy` pointing to legacy tabs.
2. **Orphan Layout:** `app/_layout - Copy.tsx` exists on disk.
3. **Dead Loop Navigation:** 4 buttons on `app/(tabs)/dashboard.tsx` (Assignments, Exams, Fee Collection, Timetable) navigate back to `ROUTES.TABS.DASHBOARD`.
4. **Crash Recovery Misrouting:** `app/(common)/unexpected-error.tsx` navigates to `ROUTES.TABS.DASHBOARD` instead of `ROUTES.PARENT.DASHBOARD`.
5. **Forgot Password Disconnect:** `app/(auth)/forgot-password.tsx` bypasses backend API and jumps directly to `/(auth)/otp` without sending an OTP.
6. **No-Internet Retry Inactive:** `app/(common)/no-internet.tsx` has an empty click handler (`onPress={() => {}}`).
7. **Common vs Parent Notifications Duplication:** `app/(common)/notifications.tsx` is an empty stub while `app/(parent)/notifications.tsx` is the real implementation.
