# EduTrack Enterprise Platform — Security Architecture & RBAC

## 1. Authentication & JWT Protocol

1. **Authentication Engine:** Supabase Auth + JWT Bearer Token validation.
2. **Token Storage:**
   - **Web App:** HttpOnly cookies or encrypted local storage.
   - **Mobile App:** iOS Keychain & Android Keystore via `expo-secure-store`.

---

## 2. RBAC Permission Matrix

Permissions are centrally defined in `apps/backend/src/rbac/permissions.ts`:

- `ADMISSION_VIEW_ALL`: Access all candidate lead pipelines across the institution.
- `STUDENT_ASSIGN_SECTION`: Assign active students to grade sections.
- `FEE_COLLECT`: Record fee payments and issue receipts.
- `REPORT_EXPORT`: Generate bulk CSV/XLSX analytics exports.
