# EduTrack ERP Mobile V1 — Phase 8 Release Candidate QA Checklist

## 1. Authentication Lifecycle

- [x] **Parent Registration**: Complete multi-field registration form $\rightarrow$ advances to OTP screen.
- [x] **OTP Verification**: Enter 6-digit verification code $\rightarrow$ hydrates session and unlocks dashboard.
- [x] **Parent Login**: Valid credentials grant entry; invalid credentials show friendly validation feedback.
- [x] **Parent Role Enforcement**: Rejects non-parent accounts and triggers clean sign-out.
- [x] **Cold Launch Session Restoration**: Session persists across app restarts via `Expo.SecureStore`.
- [x] **Logout Cleanup**: Clears tokens, closes WebSocket connection (code 1000), and resets navigation stack.

---

## 2. Parent Dashboard & Multi-Child Switcher

- [x] **Dashboard Loading**: Skeleton loaders and non-flickering header elements.
- [x] **Empty State**: Friendly illustration and "Apply for Admission" call-to-action when no applications exist.
- [x] **Application State**: Live admission status badge, progress stepper, and action portal cards.
- [x] **Multi-Child Switcher**: Toggles active profile when a parent manages multiple children.
- [x] **Pull to Refresh**: Refetches applications, admission metadata, and unread notification counts.

---

## 3. 8-Step Admission Application

- [x] **Step 1 (Guidelines)**: Read and accept admission rules.
- [x] **Step 2 (Student Details)**: Enter personal, gender, and date of birth info with Zod schema validation.
- [x] **Step 3 (Parent Information)**: Pre-fills logged-in user credentials and relationship choice.
- [x] **Step 4 (Academic Choice)**: Select dynamic academic year, grade applying for, and previous school.
- [x] **Step 5 (Document Upload)**: Native picker handles PDFs/images $\le 10\text{MB}$.
- [x] **Step 6 (Fee Summary)**: Itemized processing and registration fees.
- [x] **Step 7 (Review & Submit)**: Final declaration check and non-retryable submission mutation.
- [x] **Step 8 (Confirmation)**: Generates application reference number and transitions to read-only state.
- [x] **Draft Resilience**: Backgrounding, navigation, or phone restarts restore in-progress draft seamlessly.

---

## 4. Operational Modules & Hub

- [x] **Application Hub `/(parent)/applications/[id]`**: Centralized hub linking to all application sub-features.
- [x] **Document Center**: Document upload, verification state indicators (`PENDING`, `VERIFIED`, `REJECTED`), and ephemeral signed URL viewer.
- [x] **Fee Statement & Payment**: Itemized fees, mode selection (`UPI`, `Card`, `NetBanking`), single-submit protection.
- [x] **Digital Receipt**: Itemized receipt details with transaction timestamp and verification seal.
- [x] **Assessment Tracker**: Exam schedule, stage, score obtained, and percentage results.
- [x] **Decision Tracker**: Outcome status (`APPROVED`, `WAITLISTED`, `REJECTED`), offer letter expiration, waitlist position.
- [x] **Milestone Timeline**: Chronological event milestones from submission to enrollment.

---

## 5. Notifications & Real-Time Sync

- [x] **Initial Fetch & Unread Count**: Fetches initial notification batch and unread count for badge.
- [x] **Mark Single / All Read**: Optimistic UI updates with instant badge counter synchronization.
- [x] **Real-Time WebSocket**: Receives `notification.created` events on `/ws/notifications`.
- [x] **Reconnect & Backoff**: Exponential backoff (1s–15s max) with random jitter on network loss.
- [x] **Allowlist Deep-Linking**: Routes directly to the relevant document, fee, assessment, or decision screen.

---

## 6. App Lifecycle & Security

- [x] **Background / Foreground**: Pauses WebSocket when backgrounded; resumes automatically on foreground.
- [x] **No Credential Logging**: Masking utility redacts tokens, passwords, OTPs, and auth headers from all output.
- [x] **No Signed URL Persistence**: Ephemeral links are never cached in `AsyncStorage`.
- [x] **Zero Legacy Endpoints**: Zero deprecated endpoints or client-supplied authorization query params.

---

## 7. Accessibility & Performance

- [x] **Accessible Roles & Labels**: Buttons, icon controls, and inputs have explicit accessibility labels.
- [x] **Touch Target Sizing**: All touch targets meet or exceed $44 \times 44\text{ pt}$.
- [x] **Color Contrast**: WCAG AA compliant text contrast in both light and dark modes.
- [x] **Memory Safety**: Clean listener unsubscriptions and timer disposal on unmount.

---

## 8. Build & Release Readiness

- [x] **Environment Separation**: Distinct configs for Development, Staging, and Production in `src/config/env.ts`.
- [x] **EAS Profiles**: Development, Preview, and Production store profiles configured in `eas.json`.
- [x] **App Metadata**: Bundle IDs, version codes, schemes, and icon/splash assets in `app.json`.
