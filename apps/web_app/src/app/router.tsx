import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceShell } from '../modules/common/workspace/WorkspaceShell';
import LoginPage from '../pages/Login';
import UnauthorizedPage from '../pages/Unauthorized';
import { ProtectedRoute, PermissionGuard, ExamOperationGuard, AnyPermissionGuard } from '../components/auth/ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ExamAdminLayout } from '../layouts/ExamAdminLayout';
import { AdmissionWorkspaceLayout } from '../modules/admission/layouts/AdmissionWorkspaceLayout';
import { AdmissionForm } from '../modules/admission/pages/AdmissionForm';
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
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/ResetPasswordPage';
import SessionExpiredPage from '../features/auth/SessionExpiredPage';
import { AdmissionInquiryGuard } from '../modules/admission/components/AdmissionInquiryGuard';
import { AdmissionApplicationGuard } from '../modules/admission/components/AdmissionApplicationGuard';
import { LayoutErrorBoundary } from '../components/common/ErrorBoundary';
import { PageSkeleton } from '../components/common/LoadingSkeleton';

import { ROUTE_REGISTRY, EXAM_ADMIN_ROUTES, RouteConfig } from '../config/route_registry';

export const AppRouter = () => {
    const wrapWithGuards = (route: RouteConfig) => {
        let el = route.element;
        if (route.guardType === 'exam_operation') {
            el = <ExamOperationGuard>{el}</ExamOperationGuard>;
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

    const dashboardRoutes = ROUTE_REGISTRY.filter(r => r.layout === 'dashboard');
    const admissionWorkspaceRoutes = ROUTE_REGISTRY.filter(r => r.layout === 'admission_workspace');
    const standaloneRoutes = ROUTE_REGISTRY.filter(r => r.layout === 'none');

    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <WorkspaceShell>
                <LayoutErrorBoundary>
                    <Suspense fallback={<PageSkeleton />}>
                        <Routes>
                            {/* Public Site Routes */}
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
                                <Route path="/admissions/apply" element={<AdmissionForm />} />
                                <Route path="/campus" element={<Campus />} />
                                <Route path="/student-life" element={<StudentLife />} />
                                <Route path="/achievements" element={<Achievements />} />
                                <Route path="/events" element={<Events />} />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/notifications" element={<Notifications />} />
                            </Route>

                            {/* Login */}
                            <Route path="/login" element={<LoginPage />} />

                            {/* Auth Utility Pages */}
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                            <Route path="/session-expired" element={<SessionExpiredPage />} />

                            {/* Protected App Routes */}
                            <Route path="/app" element={<ProtectedRoute />}>
                                {/* Standalone routes outside layout */}
                                {standaloneRoutes.map(route => (
                                    <Route 
                                        key={route.path} 
                                        path={route.path} 
                                        element={wrapWithGuards(route)} 
                                    />
                                ))}

                                {/* DashboardLayout routes */}
                                <Route element={<DashboardLayout />}>
                                    {dashboardRoutes.map(route => (
                                        <Route 
                                            key={route.path} 
                                            path={route.path} 
                                            element={wrapWithGuards(route)} 
                                        />
                                    ))}
                                </Route>

                                {/* AdmissionWorkspaceLayout routes */}
                                <Route element={<AdmissionWorkspaceLayout />}>
                                    {admissionWorkspaceRoutes.map(route => (
                                        <Route 
                                            key={route.path} 
                                            path={route.path} 
                                            element={wrapWithGuards(route)} 
                                        />
                                    ))}
                                </Route>

                                {/* EXAM ADMIN DASHBOARD (ExamAdminLayout) */}
                                <Route path="exam-admin" element={
                                    <PermissionGuard permission="exam.dashboard.view">
                                        <ExamAdminLayout />
                                    </PermissionGuard>
                                }>
                                    {EXAM_ADMIN_ROUTES.map(route => (
                                        <Route 
                                            key={route.path} 
                                            path={route.path} 
                                            element={route.element} 
                                        />
                                    ))}
                                </Route>

                                <Route path="unauthorized" element={<UnauthorizedPage />} />
                                <Route path="" element={<Navigate to="dashboard" replace />} />
                            </Route>

                            {/* Redirects */}
                            <Route path="/app/*" element={<Navigate to="/app/dashboard" replace />} />
                            <Route path="*" element={<Home />} />
                        </Routes>
                    </Suspense>
                </LayoutErrorBoundary>
            </WorkspaceShell>
        </BrowserRouter>
    );
};
