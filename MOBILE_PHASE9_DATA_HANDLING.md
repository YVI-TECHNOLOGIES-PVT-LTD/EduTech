# EduTrack ERP Mobile V1 — Phase 9 Data Handling & Storage Review

**Date:** August 22, 2026  
**Status:** COMPLIANT WITH DATA PRIVACY BEST PRACTICES

---

## 1. Local Storage Classification Matrix

| Data Category                    | Storage Mechanism                       | Security Level                       | Expiration / Cleanup Policy                                                                        |
| :------------------------------- | :-------------------------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------------- |
| **Access & Refresh JWTs**        | `Expo.SecureStore`                      | **High (Native Keystore/Keychain)**  | Cleared immediately on user logout or 401 expiration.                                              |
| **Admission Application Drafts** | `@react-native-async-storage`           | **Medium (Sandboxed Local Storage)** | Scoped by `user_id` and `application_draft_id`; deleted automatically upon application submission. |
| **Parent User Profile**          | Zustand Memory + React Query            | **In-Memory**                        | Reset to `null` on logout; rehydrated on launch via SecureStore token.                             |
| **Applicant Details**            | React Query Cache (In-Memory)           | **In-Memory**                        | Cached for 2 min (`staleTime: 2m`), garbage collected after 15 min (`gcTime: 15m`).                |
| **Document Metadata**            | React Query Cache (In-Memory)           | **In-Memory**                        | In-memory only; status changes synced via WebSocket events.                                        |
| **Signed Document URLs**         | Transient In-Memory                     | **In-Memory (Ephemeral)**            | **Never persisted to disk**; fetched on-demand with short TTL.                                     |
| **Fee Ledger & Payments**        | React Query Cache (In-Memory)           | **In-Memory**                        | Stored in memory during session; never written to persistent disk storage.                         |
| **Notifications**                | React Query Cache + Local Deduplication | **In-Memory**                        | Synced via REST and WebSocket; read states updated optimistically.                                 |
| **Passwords & OTPs**             | Form State Only                         | **Ephemeral (Never Persisted)**      | Discarded immediately after authentication request completes.                                      |

---

## 2. Shared Device & Multi-User Isolation

- On shared devices with multiple parent users:
  1. User A logs out $\rightarrow$ all SecureStore tokens are wiped and socket disconnects.
  2. Local drafts are stored with the key `@edutrack:draft:${userId}:${applicationId}`. User B logging in cannot read or overwrite User A's unsubmitted application drafts.
  3. React Query cache is cleared via `queryClient.clear()` on logout, preventing sensitive data lingering across user sessions.

---

## 3. Data Protection Summary

- **Zero Plaintext Secrets:** No credentials, secret keys, or authentication tokens reside in unencrypted storage.
- **Zero Ephemeral URL Retention:** Ephemeral signed URLs for identity documents are strictly ephemeral.
- **Zero Telemetry Leakage:** Diagnostic logs are sanitized in real time before console output.
