import React from 'react';
import Dashboard from '../pages/Dashboard';
import { Profile } from '../pages/Profile';
import { Settings } from '../pages/Settings';
import { BulkOperations } from '../modules/admin/pages/BulkOperations';
import { ExecutiveOverview } from '../modules/common/executive/ExecutiveOverview';
import { ImportHistoryPage } from '../modules/import/pages/ImportHistory';
import { StudentDashboard } from '../modules/dashboard/pages/StudentDashboard';
import { AdminDashboard } from '../modules/dashboard/pages/AdminDashboard';
import { FacultyDashboard } from '../modules/dashboard/pages/FacultyDashboard';
import { AdmissionForm } from '../modules/admission/pages/AdmissionForm';
import { MyApplications } from '../modules/admission/pages/MyApplications';
import { InstructionsPage } from '../modules/admission/pages/InstructionsPage';
import { TestPortal } from '../modules/admission/pages/TestPortal';
import { SuccessPage } from '../modules/admission/pages/SuccessPage';
import { MonitoringDashboard } from '../modules/admission/pages/MonitoringDashboard';
import WorkspaceDashboard from '../modules/admission/pages/Workspace';
import Applicant360Page from '../modules/admission/pages/Applicant360';
import { InquiryListPage } from '../modules/admission/pages/InquiryListPage';
import { ApplicationsManagementPage } from '../modules/admission/pages/front-office/ApplicationsManagementPage';
import { CounsellingPage } from '../modules/admission/pages/front-office/CounsellingPage';
import { DocumentVerificationPage } from '../modules/admission/pages/front-office/DocumentVerificationPage';
import { FeeCollectionPage } from '../modules/admission/pages/front-office/FeeCollectionPage';
import { CampusVisitsPage } from '../modules/admission/pages/front-office/CampusVisitsPage';
import { ApplicationWizardPage } from '../modules/admission/pages/ApplicationWizardPage';
import { EntranceExamPage } from '../modules/admission/pages/EntranceExamPage';
import { AdmissionDecisionPage } from '../modules/admission/pages/AdmissionDecisionPage';

import { ParentDashboard } from '../modules/dashboard/pages/ParentDashboard';
import { ParentDashboardPage } from '../modules/admission/pages/parent/ParentDashboardPage';
import { ParentDashboardRouter } from '../pages/ParentDashboardRouter';
import { ParentDocumentCenterPage } from '../modules/admission/pages/parent/ParentDocumentCenterPage';
import { ParentFeePaymentPage } from '../modules/admission/pages/parent/ParentFeePaymentPage';
import { ParentAdmissionStatusPage } from '../modules/admission/pages/parent/ParentAdmissionStatusPage';
import { ParentSubmittedApplicationPage } from '../modules/admission/pages/parent/ParentSubmittedApplicationPage';

import { SchoolOperationsWorkspace } from '../pages/SchoolOperationsWorkspace';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  permission?: string;
  permissions?: string[]; // For AnyPermissionGuard
  layout: 'dashboard' | 'exam_admin' | 'admission_workspace' | 'parent_admission' | 'none';
  guardType?:
    | 'exam_operation'
    | 'admission_inquiry'
    | 'admission_application'
    | 'front_office'
    | 'parent'
    | 'admin'
    | 'none';
}

export const ROUTE_REGISTRY: RouteConfig[] = [
  // ─── 1. CANONICAL ROLE DASHBOARDS ──────────────────────────────────────────
  {
    path: 'front-office/dashboard',
    element: <SchoolOperationsWorkspace />,
    layout: 'dashboard',
    guardType: 'front_office',
  },
  {
    path: 'front-office',
    element: <SchoolOperationsWorkspace />,
    layout: 'dashboard',
    guardType: 'front_office',
  },
  {
    path: 'parent/dashboard',
    element: <ParentDashboardRouter />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'admin/dashboard',
    element: <AdminDashboard />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
    guardType: 'admin',
  },
  {
    path: 'faculty/dashboard',
    element: <FacultyDashboard />,
    layout: 'dashboard',
  },
  {
    path: 'student/dashboard',
    element: <StudentDashboard />,
    layout: 'dashboard',
    permission: 'student.dashboard.view',
  },
  {
    path: 'executive',
    element: <ExecutiveOverview />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
    guardType: 'admin',
  },

  // ─── 2. LEGACY / SHARED DASHBOARD RESOLVER ─────────────────────────────────
  // Note: /app/dashboard MUST NEVER render a dashboard UI directly. It is a pure dynamic role redirector.
  {
    path: 'dashboard',
    element: <Dashboard />,
    layout: 'dashboard',
  },

  // ─── 3. PARENT & APPLICANT PORTAL ROUTES (GUARDED BY PARENT GUARD) ─────────
  {
    path: 'admissions/dashboard',
    element: <ParentDashboardPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'admissions/my',
    element: <MyApplications />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'admissions/wizard',
    element: <ApplicationWizardPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'admissions/view/:id',
    element: <ParentSubmittedApplicationPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'admissions/documents',
    element: <ParentDocumentCenterPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'admissions/documents/:applicationId',
    element: <ParentDocumentCenterPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'admissions/fees',
    element: <ParentFeePaymentPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'admissions/payments',
    element: <ParentFeePaymentPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'admissions/status',
    element: <ParentAdmissionStatusPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'admissions/:id',
    element: <ParentAdmissionStatusPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },

  // Post-Admission Enrolled Parent Routes
  {
    path: 'parent/my-child',
    element: <ParentDashboard />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/applications',
    element: <MyApplications />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'parent/documents',
    element: <ParentDocumentCenterPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'parent/documents/:applicationId',
    element: <ParentDocumentCenterPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'parent/payments',
    element: <ParentFeePaymentPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'parent/fees',
    element: <ParentFeePaymentPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'parent/decision',
    element: <ParentAdmissionStatusPage />,
    layout: 'parent_admission',
    guardType: 'parent',
  },
  {
    path: 'parent/notifications',
    element: <MyApplications />,
    layout: 'parent_admission',
    guardType: 'parent',
  },

  // ─── 4. SCHOOL OPERATIONS & FRONT OFFICE DESK ROUTES (GUARDED BY FO GUARD) ─
  {
    path: 'workspace',
    element: <SchoolOperationsWorkspace />,
    layout: 'dashboard',
    guardType: 'front_office',
  },
  {
    path: 'people',
    element: <SchoolOperationsWorkspace />,
    layout: 'dashboard',
    guardType: 'front_office',
  },
  {
    path: 'people/students',
    element: <SchoolOperationsWorkspace />,
    layout: 'dashboard',
    guardType: 'front_office',
  },
  {
    path: 'people/parents',
    element: <SchoolOperationsWorkspace />,
    layout: 'dashboard',
    guardType: 'front_office',
  },
  {
    path: 'people/staff',
    element: <SchoolOperationsWorkspace />,
    layout: 'dashboard',
    guardType: 'front_office',
  },
  {
    path: 'school',
    element: <SchoolOperationsWorkspace />,
    layout: 'dashboard',
    guardType: 'front_office',
  },
  {
    path: 'school/academics',
    element: <SchoolOperationsWorkspace />,
    layout: 'dashboard',
    guardType: 'front_office',
  },

  // Front Office Admissions Desk Routes
  {
    path: 'front-office/leads',
    element: <InquiryListPage />,
    layout: 'admission_workspace',
    permission: 'admission.enquiry.view',
    guardType: 'front_office',
  },
  {
    path: 'admissions/inquiries',
    element: <InquiryListPage />,
    layout: 'admission_workspace',
    permission: 'admission.enquiry.view',
    guardType: 'front_office',
  },
  {
    path: 'front-office/counselling',
    element: <CounsellingPage />,
    layout: 'admission_workspace',
    permissions: ['admission.enquiry.view', 'admission.leads.manage', 'admission.review'],
    guardType: 'front_office',
  },
  {
    path: 'admissions/counselling',
    element: <CounsellingPage />,
    layout: 'admission_workspace',
    permissions: ['admission.enquiry.view', 'admission.leads.manage', 'admission.review'],
    guardType: 'front_office',
  },
  {
    path: 'front-office/applications',
    element: <ApplicationsManagementPage />,
    layout: 'admission_workspace',
    permission: 'admission.application.view',
    guardType: 'front_office',
  },
  {
    path: 'admissions/applications',
    element: <ApplicationsManagementPage />,
    layout: 'admission_workspace',
    permission: 'admission.application.view',
    guardType: 'front_office',
  },
  {
    path: 'admissions/review',
    element: <ApplicationsManagementPage />,
    layout: 'admission_workspace',
    permission: 'admission.application.view',
    guardType: 'front_office',
  },
  {
    path: 'front-office/verification',
    element: <DocumentVerificationPage />,
    layout: 'admission_workspace',
    permission: 'admission.review',
    guardType: 'front_office',
  },
  {
    path: 'admissions/verification',
    element: <DocumentVerificationPage />,
    layout: 'admission_workspace',
    permission: 'admission.review',
    guardType: 'front_office',
  },
  {
    path: 'admissions/queues',
    element: <DocumentVerificationPage />,
    layout: 'admission_workspace',
    permission: 'admission.review',
    guardType: 'front_office',
  },
  {
    path: 'admissions/exams',
    element: <EntranceExamPage />,
    layout: 'admission_workspace',
    permissions: ['admission.review', 'admission.exam.manage', 'admission.exam.evaluate'],
    guardType: 'front_office',
  },
  {
    path: 'front-office/decisions',
    element: <AdmissionDecisionPage />,
    layout: 'admission_workspace',
    permissions: ['admission.review', 'admission.approve', 'admission.enrol'],
    guardType: 'front_office',
  },
  {
    path: 'admissions/decisions',
    element: <AdmissionDecisionPage />,
    layout: 'admission_workspace',
    permissions: ['admission.review', 'admission.approve', 'admission.enrol'],
    guardType: 'front_office',
  },
  {
    path: 'front-office/visits',
    element: <CampusVisitsPage />,
    layout: 'admission_workspace',
    permissions: [
      'admission.review',
      'admission.interview.manage',
      'admission.interview.evaluate',
      'admission.enquiry.view',
      'admission.leads.manage',
    ],
    guardType: 'front_office',
  },
  {
    path: 'admissions/interviews',
    element: <CampusVisitsPage />,
    layout: 'admission_workspace',
    permissions: [
      'admission.review',
      'admission.interview.manage',
      'admission.interview.evaluate',
      'admission.enquiry.view',
      'admission.leads.manage',
    ],
    guardType: 'front_office',
  },
  {
    path: 'admissions/visits',
    element: <CampusVisitsPage />,
    layout: 'admission_workspace',
    permissions: [
      'admission.review',
      'admission.interview.manage',
      'admission.interview.evaluate',
      'admission.enquiry.view',
      'admission.leads.manage',
    ],
    guardType: 'front_office',
  },
  {
    path: 'front-office/fees',
    element: <FeeCollectionPage />,
    layout: 'admission_workspace',
    permissions: ['fees.payment.collect', 'fees.view', 'admission.view_all', 'admission.review'],
    guardType: 'front_office',
  },
  {
    path: 'admissions/merit',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permissions: [
      'admission.review',
      'admission.merit.generate',
      'admission.exam.manage',
      'admission.interview.manage',
    ],
    guardType: 'front_office',
  },
  {
    path: 'admissions/offers',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permissions: [
      'admission.review',
      'admission.merit.generate',
      'admission.exam.manage',
      'admission.interview.manage',
    ],
    guardType: 'front_office',
  },
  {
    path: 'admissions/merit/offers',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permissions: [
      'admission.review',
      'admission.merit.generate',
      'admission.exam.manage',
      'admission.interview.manage',
    ],
    guardType: 'front_office',
  },
  {
    path: 'admissions/enrollment',
    element: <AdmissionDecisionPage />,
    layout: 'admission_workspace',
    permissions: ['admission.review', 'admission.approve', 'admission.enrol', 'admission.view_all'],
    guardType: 'front_office',
  },
  {
    path: 'admissions/reports',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permission: 'admission.review',
    guardType: 'front_office',
  },
  {
    path: 'admissions/settings',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permission: 'admission.review',
    guardType: 'front_office',
  },

  // Assessment Examination Testing Portal (Public Candidate Assessment)
  {
    path: 'admissions/entrance-assessment',
    element: <InstructionsPage />,
    layout: 'admission_workspace',
    permission: 'admission.assessment.write',
  },
  {
    path: 'admissions/entrance-assessment/workspace',
    element: <TestPortal />,
    layout: 'admission_workspace',
    permission: 'admission.assessment.write',
  },
  {
    path: 'admissions/entrance-assessment/success',
    element: <SuccessPage />,
    layout: 'admission_workspace',
    permission: 'admission.assessment.write',
  },
  {
    path: 'admissions/assessment-monitor',
    element: <MonitoringDashboard />,
    layout: 'admission_workspace',
    permission: 'admission.assessment.manage',
    guardType: 'front_office',
  },

  // Workspace Profile & Settings
  { path: 'profile', element: <Profile />, layout: 'dashboard' },
  { path: 'settings', element: <Settings />, layout: 'dashboard' },
  {
    path: 'admissions/application/:id',
    element: <Applicant360Page />,
    layout: 'admission_workspace',
    guardType: 'admission_application',
  },
  {
    path: 'admissions/application/:id/documents',
    element: <Applicant360Page />,
    layout: 'admission_workspace',
    guardType: 'admission_application',
  },
  {
    path: 'admissions/timeline/:id',
    element: <Applicant360Page />,
    layout: 'admission_workspace',
    guardType: 'admission_application',
  },

  // ─── 5. ADMIN OPERATIONS (GUARDED BY ADMIN GUARD) ──────────────────────────
  {
    path: 'admin/bulk',
    element: <BulkOperations />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
    guardType: 'admin',
  },

  // ─── 6. IMPORT TOOLKIT (GUARDED BY ADMIN GUARD) ────────────────────────────
  {
    path: 'import/history',
    element: <ImportHistoryPage />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
    guardType: 'admin',
  },
];

export const EXAM_ADMIN_ROUTES: RouteConfig[] = [];
