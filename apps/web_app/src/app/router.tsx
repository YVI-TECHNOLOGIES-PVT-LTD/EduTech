import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceShell } from '../modules/common/workspace/WorkspaceShell';
const LoginPage = React.lazy(() => import('../modules/auth/pages/LoginPage'));
const UnauthorizedPage = React.lazy(() => import('../pages/Unauthorized'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));
import {
  ProtectedRoute,
  PermissionGuard,
  AnyPermissionGuard,
  FrontOfficeRouteGuard,
  ParentRouteGuard,
  AdminRouteGuard,
  SuperAdminRouteGuard,
  TeacherRouteGuard,
} from '../components/auth/ProtectedRoute';
import { AppShell } from '../components/shell/AppShell';
const PublicLayout = React.lazy(() => import('../layouts/PublicLayout'));
const Home = React.lazy(() => import('../pages/Home'));
const About = React.lazy(() => import('../pages/About'));
const VisionMission = React.lazy(() => import('../pages/VisionMission'));
const Leadership = React.lazy(() => import('../pages/Leadership'));
const Academics = React.lazy(() => import('../pages/Academics'));
const Departments = React.lazy(() => import('../pages/Departments'));
const Faculty = React.lazy(() => import('../pages/Faculty'));
const Admissions = React.lazy(() => import('../pages/Admissions'));
const AdmissionProcess = React.lazy(() => import('../pages/AdmissionProcess'));
const Campus = React.lazy(() => import('../pages/Campus'));
const StudentLife = React.lazy(() => import('../pages/StudentLife'));
const Achievements = React.lazy(() => import('../pages/Achievements'));
const Events = React.lazy(() => import('../pages/Events'));
const Contact = React.lazy(() => import('../pages/Contact'));
const Notifications = React.lazy(() => import('../pages/Notifications'));
const EnquiryPage = React.lazy(() => import('../modules/admission/pages/public/EnquiryPage'));
const EnquirySuccessPage = React.lazy(
  () => import('../modules/admission/pages/public/EnquirySuccessPage'),
);
const RegistrationPage = React.lazy(
  () => import('../modules/admission/pages/public/RegistrationPage'),
);
const OtpVerificationPage = React.lazy(
  () => import('../modules/admission/pages/public/OtpVerificationPage'),
);
const RegistrationSuccessPage = React.lazy(
  () => import('../modules/admission/pages/public/RegistrationSuccessPage'),
);
const ForgotPasswordPage = React.lazy(() => import('../modules/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('../modules/auth/pages/ResetPasswordPage'));
const SessionExpiredPage = React.lazy(() => import('../modules/auth/pages/SessionExpiredPage'));
import { AdmissionInquiryGuard } from '../modules/admission/components/AdmissionInquiryGuard';
import { AdmissionApplicationGuard } from '../modules/admission/components/AdmissionApplicationGuard';
import { LayoutErrorBoundary } from '../components/common/ErrorBoundary';
import { PageSkeleton } from '../components/common/LoadingSkeleton';

import { ROUTE_REGISTRY, RouteConfig } from '../config/route_registry';
import { AutoTranslator } from '../components/i18n/AutoTranslator';
import { LandingResolver } from '../services/LandingResolver';
import { useAuth } from '../context/AuthContext';

export const RoleBasedDefaultRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const rawRoles =
    user.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const destination = LandingResolver.resolveLandingRoute(rawRoles, [], user);
  return <Navigate to={destination} replace />;
};

export const wrapWithGuards = (route: RouteConfig) => {
  let el = route.element;
  if (route.guardType === 'front_office') {
    el = <FrontOfficeRouteGuard>{el}</FrontOfficeRouteGuard>;
  } else if (route.guardType === 'parent') {
    el = <ParentRouteGuard>{el}</ParentRouteGuard>;
  } else if (route.guardType === 'admin') {
    el = <AdminRouteGuard>{el}</AdminRouteGuard>;
  } else if (route.guardType === 'super_admin') {
    el = <SuperAdminRouteGuard>{el}</SuperAdminRouteGuard>;
  } else if (route.guardType === 'teacher') {
    el = <TeacherRouteGuard>{el}</TeacherRouteGuard>;
  } else if (route.guardType === 'admission_inquiry') {
    el = <AdmissionInquiryGuard>{el}</AdmissionInquiryGuard>;
  } else if (route.guardType === 'admission_application') {
    el = <AdmissionApplicationGuard>{el}</AdmissionApplicationGuard>;
  }

  if (route.permissions && route.permissions.length > 0) {
    el = <AnyPermissionGuard permissions={route.permissions}>{el}</AnyPermissionGuard>;
  } else if (route.permission) {
    el = <PermissionGuard permission={route.permission}>{el}</PermissionGuard>;
  }

  return el;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Public Site Routes (inheriting Landing AnnouncementBar & Navbar) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/vision-mission" element={<VisionMission />} />
          <Route path="/leadership" element={<Leadership />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/admission-process" element={<AdmissionProcess />} />
          <Route path="/campus" element={<Campus />} />
          <Route path="/gallery" element={<Campus />} />
          <Route path="/student-life" element={<StudentLife />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/events" element={<Events />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* Public Standalone Enquiry Routes */}
        <Route path="/enquiry" element={<EnquiryPage />} />
        <Route path="/admissions/enquiry-form" element={<EnquiryPage />} />
        <Route path="/admission/enquiry" element={<EnquiryPage />} />
        <Route path="/admission/enquiry/success" element={<EnquirySuccessPage />} />

        {/* Standalone Authentication & Parent Registration Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/admission/register" replace />} />
        <Route path="/signup" element={<Navigate to="/admission/register" replace />} />
        <Route path="/admission/register" element={<RegistrationPage />} />
        <Route path="/admission/register/otp" element={<OtpVerificationPage />} />
        <Route path="/admission/register/success" element={<RegistrationSuccessPage />} />

        {/* Auth Utility Pages */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/session-expired" element={<SessionExpiredPage />} />

        {/* Protected App Routes */}
        <Route path="/app" element={<ProtectedRoute />}>
          {/* Single Canonical Global AppShell for all application routes */}
          <Route element={<AppShell />}>
            {ROUTE_REGISTRY.map((route) => (
              <Route key={route.path} path={route.path} element={wrapWithGuards(route)} />
            ))}
            <Route path="unauthorized" element={<UnauthorizedPage />} />
            <Route path="" element={<RoleBasedDefaultRedirect />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        {/* Canonical Persona Redirects */}
        <Route path="/parent/*" element={<Navigate to="/app/parent/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export const AppRouter = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AutoTranslator />
      <WorkspaceShell>
        <LayoutErrorBoundary>
          <AppRoutes />
        </LayoutErrorBoundary>
      </WorkspaceShell>
    </BrowserRouter>
  );
};
