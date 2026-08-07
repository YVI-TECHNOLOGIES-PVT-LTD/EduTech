import React from 'react';
import Dashboard from '../pages/Dashboard';
import { Profile } from '../pages/Profile';
import { Settings } from '../pages/Settings';
import { BulkOperations } from '../modules/admin/pages/BulkOperations';
import { ExecutiveOverview } from '../modules/common/executive/ExecutiveOverview';
import { ImportHistoryPage } from '../modules/import/pages/ImportHistory';
import { StudentDashboard } from '../modules/dashboard/pages/StudentDashboard';
import { AdminDashboard } from '../modules/dashboard/pages/AdminDashboard';
import { AdmissionForm } from '../modules/admission/pages/AdmissionForm';
import { MyApplications } from '../modules/admission/pages/MyApplications';
import { InstructionsPage } from '../modules/admission/pages/InstructionsPage';
import { TestPortal } from '../modules/admission/pages/TestPortal';
import { SuccessPage } from '../modules/admission/pages/SuccessPage';
import { MonitoringDashboard } from '../modules/admission/pages/MonitoringDashboard';
import WorkspaceDashboard from '../modules/admission/pages/Workspace';
import Applicant360Page from '../modules/admission/pages/Applicant360';
import { InquiryListPage } from '../modules/admission/pages/InquiryListPage';
import { ApplicationWizardPage } from '../modules/admission/pages/ApplicationWizardPage';
import { EntranceExamPage } from '../modules/admission/pages/EntranceExamPage';

import { SchoolOperationsWorkspace } from '../pages/SchoolOperationsWorkspace';
import { ParentPortal } from '../pages/ParentPortal';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  permission?: string;
  permissions?: string[]; // For AnyPermissionGuard
  layout: 'dashboard' | 'exam_admin' | 'admission_workspace' | 'none';
  guardType?: 'exam_operation' | 'admission_inquiry' | 'admission_application' | 'none';
}

export const ROUTE_REGISTRY: RouteConfig[] = [
  // SCHOOL OPERATIONS WORKSPACE (CONSOLIDATED INTERNAL STAFF)
  { path: 'workspace', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'people', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'people/students', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'people/parents', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'people/staff', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'school', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'school/academics', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },

  // PARENT PORTAL (ISOLATED PARENT PERSONA)
  { path: 'parent/dashboard', element: <ParentPortal />, layout: 'dashboard' },
  { path: 'parent/applications', element: <ParentPortal />, layout: 'dashboard' },
  { path: 'parent/documents', element: <ParentPortal />, layout: 'dashboard' },
  { path: 'parent/my-child', element: <ParentPortal />, layout: 'dashboard' },
  { path: 'parent/notifications', element: <ParentPortal />, layout: 'dashboard' },
  { path: 'parent/profile', element: <ParentPortal />, layout: 'dashboard' },

  // CORE DASHBOARDS
  { path: 'dashboard', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },

  {
    path: 'student/dashboard',
    element: <StudentDashboard />,
    layout: 'dashboard',
    permission: 'student.dashboard.view',
  },
  {
    path: 'admin/dashboard',
    element: <AdminDashboard />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
  },
  {
    path: 'executive',
    element: <ExecutiveOverview />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
  },

  // WORKSPACE PROFILE & SETTINGS
  { path: 'profile', element: <Profile />, layout: 'dashboard' },
  { path: 'settings', element: <Settings />, layout: 'dashboard' },

  // PARENT PORTAL & APPLICANT SELF-SERVICE
  {
    path: 'admissions/my',
    element: <MyApplications />,
    layout: 'dashboard',
    permission: 'admission.view_own',
  },

  // ADMISSIONS DESK (AdmissionWorkspaceLayout)
  {
    path: 'admissions/dashboard',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permission: 'admission.review',
  },
  {
    path: 'admissions/analytics',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permission: 'admission.review',
  },
  {
    path: 'admissions/inquiries',
    element: <InquiryListPage />,
    layout: 'admission_workspace',
    guardType: 'admission_inquiry',
  },
  {
    path: 'admissions/enquiry',
    element: <InquiryListPage />,
    layout: 'admission_workspace',
    guardType: 'admission_inquiry',
  },
  {
    path: 'admissions/assign',
    element: <InquiryListPage />,
    layout: 'admission_workspace',
    guardType: 'admission_inquiry',
  },
  {
    path: 'admissions/new',
    element: <AdmissionForm />,
    layout: 'admission_workspace',
    permission: 'admission.create',
  },
  {
    path: 'admissions/wizard',
    element: <ApplicationWizardPage />,
    layout: 'admission_workspace',
    permission: 'admission.create',
  },
  {
    path: 'admissions/application/:id',
    element: <Applicant360Page />,
    layout: 'admission_workspace',
    guardType: 'admission_application',
  },
  {
    path: 'admissions/documents/:id',
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
  {
    path: 'admissions/review',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permission: 'admission.review',
  },
  {
    path: 'admissions/:id',
    element: <Applicant360Page />,
    layout: 'admission_workspace',
    guardType: 'admission_application',
  },
  {
    path: 'admissions/verification',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permission: 'admission.review',
  },
  {
    path: 'admissions/queues',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permission: 'admission.review',
  },
  {
    path: 'admissions/exams',
    element: <EntranceExamPage />,
    layout: 'admission_workspace',
    permissions: ['admission.review', 'admission.exam.manage', 'admission.exam.evaluate'],
  },
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
  },
  {
    path: 'admissions/interviews',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permissions: ['admission.review', 'admission.interview.manage', 'admission.interview.evaluate'],
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
  },
  {
    path: 'admissions/fees',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permission: 'fees.payment.collect',
  },
  {
    path: 'admissions/enrollment',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permission: 'admission.review',
  },
  {
    path: 'admissions/reports',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permission: 'admission.review',
  },
  {
    path: 'admissions/settings',
    element: <WorkspaceDashboard />,
    layout: 'admission_workspace',
    permission: 'admission.review',
  },

  // ADMIN OPERATIONS
  {
    path: 'admin/bulk',
    element: <BulkOperations />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
  },

  // IMPORT TOOLKIT
  {
    path: 'import/history',
    element: <ImportHistoryPage />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
  },
];

export const EXAM_ADMIN_ROUTES: RouteConfig[] = [];
