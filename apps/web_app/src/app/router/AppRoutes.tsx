import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { PERMISSIONS } from '@/shared/constants/permissions';
import { ROUTES } from '@/shared/constants/routes';

// Lazy Loaded Feature Modules (Route-level Code Splitting from Day 1)
const DashboardModule = lazy(() => import('@/features/dashboard'));
const OrganizationModule = lazy(() => import('@/features/organization'));
const UsersModule = lazy(() => import('@/features/users'));
const RolesModule = lazy(() => import('@/features/roles'));
const HrModule = lazy(() => import('@/features/hr'));
const AcademicsModule = lazy(() => import('@/features/academics'));
const CrmModule = lazy(() => import('@/features/crm'));
const AdmissionsModule = lazy(() => import('@/features/admissions'));
const StudentsModule = lazy(() => import('@/features/students'));
const SettingsModule = lazy(() => import('@/features/settings'));
const ReportsModule = lazy(() => import('@/features/reports'));
const AuditModule = lazy(() => import('@/features/audit'));
const LoginModule = lazy(() => import('@/features/auth'));
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/features/auth').then((m) => ({ default: m.ResetPasswordPage })),
);
const SessionExpiredPage = lazy(() =>
  import('@/features/auth').then((m) => ({ default: m.SessionExpiredPage })),
);

import AdminLayout from '@/shared/layouts/AdminLayout';

const PageFallbackLoader = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
  </div>
);

const UnauthorizedPage = () => (
  <div className="p-12 text-center">
    <h2 className="text-xl font-bold text-red-600">Access Denied (403)</h2>
    <p className="mt-2 text-slate-600">You do not have permission to access this page.</p>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageFallbackLoader />}>
      <Routes>
        {/* Public Auth Routes */}
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginModule />} />
        <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.AUTH.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.AUTH.SESSION_EXPIRED} element={<SessionExpiredPage />} />

        {/* Protected Admin Portal Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.APP.DASHBOARD} element={<DashboardModule />} />

            <Route
              path={ROUTES.APP.ORGANIZATION}
              element={
                <PermissionGuard permission={PERMISSIONS.ORGANIZATION_READ}>
                  <OrganizationModule />
                </PermissionGuard>
              }
            />

            <Route
              path={ROUTES.APP.USERS}
              element={
                <PermissionGuard permission={PERMISSIONS.USER_READ}>
                  <UsersModule />
                </PermissionGuard>
              }
            />

            <Route
              path={ROUTES.APP.ROLES}
              element={
                <PermissionGuard permission={PERMISSIONS.ROLE_READ}>
                  <RolesModule />
                </PermissionGuard>
              }
            />

            <Route
              path={`${ROUTES.APP.HR.ROOT}/*`}
              element={
                <PermissionGuard permission={PERMISSIONS.STAFF_READ}>
                  <HrModule />
                </PermissionGuard>
              }
            />

            <Route
              path={`${ROUTES.APP.ACADEMICS.ROOT}/*`}
              element={
                <PermissionGuard permission={PERMISSIONS.ACADEMIC_YEAR_READ}>
                  <AcademicsModule />
                </PermissionGuard>
              }
            />

            <Route
              path={`${ROUTES.APP.CRM.ROOT}/*`}
              element={
                <PermissionGuard permission={PERMISSIONS.LEAD_READ}>
                  <CrmModule />
                </PermissionGuard>
              }
            />

            <Route
              path={`${ROUTES.APP.ADMISSIONS.ROOT}/*`}
              element={
                <PermissionGuard permission={PERMISSIONS.APPLICATION_READ}>
                  <AdmissionsModule />
                </PermissionGuard>
              }
            />

            <Route
              path={`${ROUTES.APP.STUDENTS.ROOT}/*`}
              element={
                <PermissionGuard permission={PERMISSIONS.STUDENT_READ}>
                  <StudentsModule />
                </PermissionGuard>
              }
            />

            <Route
              path={ROUTES.APP.SETTINGS}
              element={
                <PermissionGuard permission={PERMISSIONS.SETTINGS_READ}>
                  <SettingsModule />
                </PermissionGuard>
              }
            />

            <Route
              path={ROUTES.APP.REPORTS}
              element={
                <PermissionGuard permission={PERMISSIONS.REPORTS_VIEW}>
                  <ReportsModule />
                </PermissionGuard>
              }
            />

            <Route
              path={ROUTES.APP.AUDIT}
              element={
                <PermissionGuard permission={PERMISSIONS.AUDIT_READ}>
                  <AuditModule />
                </PermissionGuard>
              }
            />

            <Route path={ROUTES.APP.UNAUTHORIZED} element={<UnauthorizedPage />} />
            <Route path="/app" element={<Navigate to={ROUTES.APP.DASHBOARD} replace />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.APP.DASHBOARD} replace />} />
      </Routes>
    </Suspense>
  );
};
