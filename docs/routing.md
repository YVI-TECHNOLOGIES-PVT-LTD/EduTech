# EduTrack Routing Governance

## Route Architecture
- **Public Routes**: Accessible without authentication (`/`, `/about`, `/login`). Wrapped in `PublicLayout`.
- **Protected Routes**: Require active authentication and session validation (`/app/*`). Wrapped in `ProtectedRoute` and `DashboardLayout`.
- **RBAC Protected Routes**: Enforce specific permission requirements using `PermissionGuard` or `AnyPermissionGuard`.
- **Lazy Loading & Fallbacks**: Top-level routes use `React.lazy()` with `<Suspense fallback={<PageSkeleton />}>` and `<LayoutErrorBoundary>` containers.
