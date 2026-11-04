# EduTrack ERP — Parent Mobile App

# Phase 3 — Wave 1.1: API Endpoint Verification

## 1. Deep Verification of `GET /v1/parents/:id/students`

The directive requires a complete audit of the parent-student relationship endpoint across the entire backend and client stack.

### 1.1. Backend Route Registration

- **Mount Point**: In [`apps/backend/src/routes.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/backend/src/routes.ts#L806-L807):
  ```typescript
  router.use('/v1/parents', authenticate, parentManagementRouter);
  router.use('/parents', authenticate, parentManagementRouter);
  ```
- **Route Definition**: In [`apps/backend/src/modules/parent-management/routes/parent.routes.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/backend/src/modules/parent-management/routes/parent.routes.ts#L45-L49):
  ```typescript
  parentRouter.get(
    '/:id/students',
    checkPermission(ParentPolicy.canView()),
    ParentStudentController.getStudents,
  );
  ```

### 1.2. Controller Implementation

In [`apps/backend/src/modules/parent-management/controllers/parent-student.controller.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/backend/src/modules/parent-management/controllers/parent-student.controller.ts#L43-L54):

```typescript
static async getStudents(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await ParentStudentService.getStudentsByParent(id);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof ParentError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
```

### 1.3. Service & Repository Implementation

- **Service**: [`ParentStudentService.getStudentsByParent(parentId)`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/backend/src/modules/parent-management/services/parent.student.service.ts#L64-L71) validates that the parent exists via `ParentRepository.findById(parentId)` and delegates to `ParentStudentRepository.findStudentsByParentId(parentId)`.
- **Repository**: [`ParentStudentRepository.findStudentsByParentId(parent_id)`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/backend/src/modules/parent-management/repositories/parent.student.repository.ts#L44-L51):
  ```typescript
  static async findStudentsByParentId(parent_id: string) {
    return db.student_parents.findMany({
      where: { parent_id },
      include: {
        students: true,
      },
    });
  }
  ```

### 1.4. Parent Authorization & RBAC Analysis

- In `ParentPolicy.canView()` ([`apps/backend/src/modules/parent-management/policies/parent.policy.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/backend/src/modules/parent-management/policies/parent.policy.ts#L4-L6)):
  ```typescript
  static canView(): string {
    return PERMISSIONS.ADMISSION_VIEW_ALL || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }
  ```
- In `rbac.middleware.ts` ([`apps/backend/src/rbac/rbac.middleware.ts`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/backend/src/rbac/rbac.middleware.ts#L88-L98)):
  Users with role `'PARENT'` have self-service bypass for:
  `'admission.view_own'`, `'admission.create'`, `'admission.application.create'`, `'admission.application.update'`, `'admission.application.view_own'`, `'admission.application.view'`.
- **CRITICAL FINDING**:
  `ParentPolicy.canView()` requires `ADMISSION_VIEW_ALL` or `ADMISSION_LEADS_MANAGE`. Standard parents do NOT possess these administrative permissions.
  Furthermore, `ParentStudentController.getStudents` does not inspect `req.context.user.id` to verify that the requesting parent is requesting their own children.
- **Classification**: **Partially Integrated (Backend-Only for Admins/Staff)**.
  The endpoint exists and works for staff/admin roles, but parent self-service access returns HTTP 403 unless the parent possesses administrative admission permissions.
- **Client Resilience**: In `child.store.ts`, the fetch is wrapped in a `try/catch` block so that HTTP 403/404 responses gracefully fall back without breaking the app.

---

## 2. Verification of Admission Applications API

### 2.1. Backend Endpoints Available

1. **`GET /v1/applications?mine=true`**: Handled by `AdmissionController.search` which sets `searchParams.created_by = userId` when `isOnlyParent` or `mine=true` is present.
2. **`GET /v1/applications/mine`**: Handled by `AdmissionController.getMine` which filters directly by `created_by = userId`.
3. **`GET /v1/admission/my`**: Direct alias for `AdmissionController.getMine` mounted in `routes.ts:626`.

### 2.2. Parent Authorization

In `rbac.middleware.ts`, `AdmissionController.getMine` and `AdmissionController.search` are fully authorized for the `'PARENT'` role.

### 2.3. Stabilization of Mobile Client Call

In `child.store.ts`, the previous execution had called a hardcoded string `apiClient.get('/v1/admissions/applications')` (which returned 404 because `admissions` had an extra 's').
In this stabilization phase (Wave 1.1), `child.store.ts` was updated to import and use [`applicationsApi.listMine()`](file:///c:/Users/user/Documents/GitHub/EduTech/apps/mobile_app/src/api/applications.api.ts), which queries `ENDPOINTS.APPLICATIONS.LIST_MINE` (`/v1/applications?mine=true`).

- **Classification**: **Fully Implemented & Fully Integrated**.

---

## 3. Separation of Domain Identities

The system strictly enforces separate domain entities between enrolled students and applicants:

| Dimension               | Enrolled Student Identity                 | Applicant Identity                          |
| :---------------------- | :---------------------------------------- | :------------------------------------------ |
| **Prisma Model**        | `students` (joined via `student_parents`) | `admission_applications`                    |
| **Primary Key**         | `student.id` (UUID)                       | `admission_applications.id` (UUID)          |
| **Business Identifier** | `admission_number` (e.g., `ADM-2024-001`) | `application_number` (e.g., `APP-2026-089`) |
| **Domain Type**         | `EnrolledChild` (`kind: 'enrolled'`)      | `ApplicantChild` (`kind: 'applicant'`)      |
| **Context Identifier**  | `studentId`                               | `applicationId`                             |
| **API Endpoints**       | Student SIS APIs (`/v1/students/:id/*`)   | Application APIs (`/v1/applications/:id/*`) |

Because `UnifiedChild` is a discriminated union with mutually exclusive `kind` tags (`'enrolled'` vs `'applicant'`), client components, stores, and navigators can **never accidentally substitute an applicant ID into an enrolled student API**.
