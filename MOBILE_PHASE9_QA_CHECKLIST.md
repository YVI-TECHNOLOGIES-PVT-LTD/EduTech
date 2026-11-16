# EduTrack ERP Mobile V1 — Phase 9 Real Device E2E QA Checklist

## 1. Authentication (Items 1–9)

- [x] **1. Fresh Install**: App initializes clean session, displays welcoming login/register screen.
- [x] **2. Registration**: Complete parent registration form with live Zod validation.
- [x] **3. OTP Verification**: Enter 6-digit OTP $\rightarrow$ advances to parent dashboard.
- [x] **4. Login**: Valid email/phone and password logs in smoothly.
- [x] **5. Invalid Credentials**: Displays non-revealing error message ("Invalid email or password").
- [x] **6. Session Restoration**: Cold app launch automatically restores session from SecureStore.
- [x] **7. Token Expiration / 401**: Expired token triggers automatic logout and redirect to login.
- [x] **8. Logout**: Clears SecureStore, closes WebSocket connection, redirects to login.
- [x] **9. Re-login**: Re-authenticating with same or different parent works flawlessly.

---

## 2. Dashboard & Navigation (Items 10–15)

- [x] **10. Dashboard Loading**: Skeleton loaders render without content shifting.
- [x] **11. Child Switcher**: Toggles between multiple applicant children smoothly.
- [x] **12. Application Status**: Live badge reflects accurate status from canonical backend.
- [x] **13. Notification Badge**: Real-time counter badge updates accurately on tab icon.
- [x] **14. Empty States**: Helpful CTA banner displayed when no applications exist.
- [x] **15. Network Failure Recovery**: Pull-to-refresh recovers dashboard when network returns.

---

## 3. Admission Application (Items 16–35)

- [x] **16. Start New Application**: Initializes fresh draft wizard.
- [x] **17. Guidelines Acceptance**: Checkbox unlocks Next button.
- [x] **18. Student Details**: Personal info validated with real-time feedback.
- [x] **19. Parent Details**: Pre-populates authenticated parent info.
- [x] **20. Academics**: Select academic year, grade, previous school.
- [x] **21. Draft Save**: Auto-saves to `DraftStorage` on every step change.
- [x] **22. Kill Application**: Force closing app during wizard preserves entered data.
- [x] **23. Relaunch Application**: Re-opening app offers instant draft resumption.
- [x] **24. Draft Restoration**: Restores exact step, student fields, and local file references.
- [x] **25. Document Upload**: Native document picker attaches PDFs and images.
- [x] **26. Invalid File Type**: Rejects executable/unsupported formats with alert.
- [x] **27. File >10MB**: Rejects oversized files before upload.
- [x] **28. Mandatory Document Validation**: Blocks progression if required documents are missing.
- [x] **29. Fee Summary**: Displays itemized application charges.
- [x] **30. Review**: Consolidated overview of all 6 previous steps.
- [x] **31. Declaration**: Acceptance required prior to submission.
- [x] **32. Submit**: Non-retryable transactional POST to `/v1/applications`.
- [x] **33. Double-Submit Protection**: Submit button disabled and shows spinner during request.
- [x] **34. Confirmation**: Shows generated application reference number.
- [x] **35. Post-Submission Read-Only**: Submitted application transitions to read-only view.

---

## 4. Document Center (Items 36–43)

- [x] **36. List Documents**: Shows all submitted and required documents with status tags.
- [x] **37. Upload Document**: Allows uploading missing or re-requested documents.
- [x] **38. View Document**: Opens ephemeral signed URL preview.
- [x] **39. Signed URL Retrieval**: Fetches short-lived signed URL on demand.
- [x] **40. Verified State**: Green badge for `VERIFIED` documents.
- [x] **41. Under-Review State**: Yellow badge for `PENDING` verification.
- [x] **42. Action-Needed State**: Red badge for `REJECTED` documents with remarks.
- [x] **43. Retry Upload**: Replaces rejected document via multipart upload.

---

## 5. Payments & Fee Settlement (Items 44–51)

- [x] **44. Fee Summary**: Displays itemized breakdown of tuition and admission fees.
- [x] **45. UPI Selection**: Select UPI payment mode.
- [x] **46. Card Selection**: Select Debit/Credit Card payment mode.
- [x] **47. NetBanking Selection**: Select Net Banking mode.
- [x] **48. Payment Submission**: Submits fee payment transaction to backend.
- [x] **49. Duplicate Payment Prevention**: Button locks on tap; query mutation `retry: false`.
- [x] **50. Receipt**: Displays itemized digital receipt with transaction ID and status.
- [x] **51. Payment Failure Handling**: Graceful error alert allowing retry.

---

## 6. Assessment Tracker (Items 52–56)

- [x] **52. Assessment Pending**: Displays scheduled assessment date and guidelines.
- [x] **53. Assessment Result**: Renders evaluation outcome once published.
- [x] **54. Score Display**: Shows obtained marks vs total marks.
- [x] **55. Percentage Display**: Displays calculated percentage score.
- [x] **56. Pass/Fail State**: Visual status badge for assessment result.

---

## 7. Decision Tracker (Items 57–63)

- [x] **57. Under Review**: Shows in-progress evaluation badge.
- [x] **58. Approved**: Displays official acceptance decision with offer details.
- [x] **59. Waitlisted**: Shows waitlist position and instructions.
- [x] **60. Rejected**: Displays respectful status with feedback.
- [x] **61. Offer Date**: Renders admission offer generation timestamp.
- [x] **62. Offer Expiry**: Displays clear countdown/deadline for offer acceptance.
- [x] **63. Official Remarks**: Renders verified remarks from admission committee.

---

## 8. Milestone Timeline (Items 64–69)

- [x] **64. Application Created**: Step marked completed on timeline.
- [x] **65. Document Uploaded**: Milestone logged with timestamp.
- [x] **66. Document Verified**: Milestone recorded upon verification.
- [x] **67. Assessment Recorded**: Milestone updated with evaluation date.
- [x] **68. Decision Recorded**: Decision milestone marked on timeline.
- [x] **69. Payment Recorded**: Fee settlement milestone confirmed.

---

## 9. Notifications & Real-Time Sync (Items 70–79)

- [x] **70. REST Notification Loading**: Fetches parent notifications on mount.
- [x] **71. Unread Count**: Badges reflect accurate unread count.
- [x] **72. Mark Read**: Tapping notification marks it read optimistically.
- [x] **73. Mark All Read**: Header button marks all notifications as read.
- [x] **74. WebSocket Connection**: Connects to `/ws/notifications` using authenticated JWT.
- [x] **75. WebSocket Reconnect**: Automatically reconnects with exponential backoff on disconnect.
- [x] **76. Background $\rightarrow$ Foreground**: Pauses socket on background, resumes on foreground.
- [x] **77. Notification Deduplication**: Merges realtime events with REST data seamlessly.
- [x] **78. Notification Deep Link**: Tapping notification opens relevant target screen.
- [x] **79. Invalid Deep Link Rejection**: Malformed or unauthorized URLs are rejected safely.

---

## 10. Security & Privacy (Items 80–87)

- [x] **80. IDOR Prevention**: Parent cannot access another parent's application.
- [x] **81. Data Isolation**: Parent cannot access unauthorized student records.
- [x] **82. Staff Route Protection**: Staff/admin routes rejected by deep link router.
- [x] **83. External URL Rejection**: Phishing and external URLs rejected safely.
- [x] **84. Redacted Logs**: Auth headers and tokens never appear in console output.
- [x] **85. Token Isolation**: Access/refresh tokens stored only in SecureStore.
- [x] **86. Credential Privacy**: Passwords and OTPs are never written to disk or logs.
- [x] **87. Ephemeral URLs**: Signed download URLs are never persisted to disk.
