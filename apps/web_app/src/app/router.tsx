import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceShell } from '../modules/common/workspace/WorkspaceShell';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import UnauthorizedPage from '../pages/Unauthorized';
import {
  ProtectedRoute,
  PermissionGuard,
  AnyPermissionGuard,
} from '../components/auth/ProtectedRoute';
import { AppShell } from '../components/shell/AppShell';
import PublicLayout from '../layouts/PublicLayout';
import Home from '../pages/Home';
import About from '../pages/About';
import VisionMission from '../pages/VisionMission';
import Leadership from '../pages/Leadership';
import Academics from '../pages/Academics';
import Departments from '../pages/Departments';
import Faculty from '../pages/Faculty';
import Admissions from '../pages/Admissions';
import AdmissionProcess from '../pages/AdmissionProcess';
import Campus from '../pages/Campus';
import StudentLife from '../pages/StudentLife';
import Achievements from '../pages/Achievements';
import Events from '../pages/Events';
import Contact from '../pages/Contact';
import Notifications from '../pages/Notifications';
import EnquiryPage from '../modules/admission/pages/public/EnquiryPage';
import EnquirySuccessPage from '../modules/admission/pages/public/EnquirySuccessPage';
import RegistrationPage from '../modules/admission/pages/public/RegistrationPage';
import OtpVerificationPage from '../modules/admission/pages/public/OtpVerificationPage';
import RegistrationSuccessPage from '../modules/admission/pages/public/RegistrationSuccessPage';
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage';
import SessionExpiredPage from '../modules/auth/pages/SessionExpiredPage';
import { AdmissionInquiryGuard } from '../modules/admission/components/AdmissionInquiryGuard';
import { AdmissionApplicationGuard } from '../modules/admission/components/AdmissionApplicationGuard';
import { LayoutErrorBoundary } from '../components/common/ErrorBoundary';
import { PageSkeleton } from '../components/common/LoadingSkeleton';

import { ROUTE_REGISTRY, RouteConfig } from '../config/route_registry';

import { useAuth } from '../context/AuthContext';

const RoleBasedDefaultRedirect: React.FC = () => {
  const { user } = useAuth();
  const rawRoles =
    user?.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const userRoles = rawRoles.map((r: string) => r.toUpperCase().replace(/[\s_-]+/g, '_'));

  if (
    userRoles.includes('FRONT_OFFICE') ||
    userRoles.includes('FO') ||
    userRoles.includes('STAFF') ||
    userRoles.includes('ADMISSION_OFFICER') ||
    userRoles.includes('ADMIN') ||
    userRoles.includes('SUPERADMIN')
  ) {
    return <Navigate to="/app/workspace" replace />;
  }

  return <Navigate to="/app/admissions/dashboard" replace />;
};

export const AppRouter = () => {
  const wrapWithGuards = (route: RouteConfig) => {
    let el = route.element;
    if (route.guardType === 'admission_inquiry') {
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

  const dashboardRoutes = ROUTE_REGISTRY.filter((r) => r.layout === 'dashboard');
  const admissionWorkspaceRoutes = ROUTE_REGISTRY.filter((r) => r.layout === 'admission_workspace');
  const parentAdmissionRoutes = ROUTE_REGISTRY.filter((r) => r.layout === 'parent_admission');
  const standaloneRoutes = ROUTE_REGISTRY.filter((r) => r.layout === 'none');

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WorkspaceShell>
        <LayoutErrorBoundary>
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
                </Route>
              </Route>

              {/* Redirects */}
              <Route path="/parent/*" element={<Navigate to="/app/admissions/my" replace />} />
              <Route path="/app/*" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </LayoutErrorBoundary>
      </WorkspaceShell>
    </BrowserRouter>
  );
};
