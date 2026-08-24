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
import { ApplicationsManagementPage } from '../modules/admission/pages/front-office/ApplicationsManagementPage';
import { CounsellingPage } from '../modules/admission/pages/front-office/CounsellingPage';
import { DocumentVerificationPage } from '../modules/admission/pages/front-office/DocumentVerificationPage';
import { FeeCollectionPage } from '../modules/admission/pages/front-office/FeeCollectionPage';
import { CampusVisitsPage } from '../modules/admission/pages/front-office/CampusVisitsPage';
import { ApplicationWizardPage } from '../modules/admission/pages/ApplicationWizardPage';
import { EntranceExamPage } from '../modules/admission/pages/EntranceExamPage';
import { AdmissionDecisionPage } from '../modules/admission/pages/AdmissionDecisionPage';

import { ParentDashboardPage } from '../modules/admission/pages/parent/ParentDashboardPage';
import { ParentDocumentCenterPage } from '../modules/admission/pages/parent/ParentDocumentCenterPage';
import { ParentFeePaymentPage } from '../modules/admission/pages/parent/ParentFeePaymentPage';
import { ParentAdmissionStatusPage } from '../modules/admission/pages/parent/ParentAdmissionStatusPage';

import { SchoolOperationsWorkspace } from '../pages/SchoolOperationsWorkspace';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  permission?: string;
  permissions?: string[]; // For AnyPermissionGuard
  layout: 'dashboard' | 'exam_admin' | 'admission_workspace' | 'parent_admission' | 'none';
  guardType?: 'exam_operation' | 'admission_inquiry' | 'admission_application' | 'none';
}

export const ROUTE_REGISTRY: RouteConfig[] = [
  // PARENT PORTAL CANONICAL ROUTES (PARENT ADMISSION LAYOUT)
  { path: 'admissions/dashboard', element: <ParentDashboardPage />, layout: 'parent_admission' },
  { path: 'admissions/my', element: <MyApplications />, layout: 'parent_admission' },
  { path: 'admissions/wizard', element: <ApplicationWizardPage />, layout: 'parent_admission' },
  {
    path: 'admissions/documents',
    element: <ParentDocumentCenterPage />,
    layout: 'parent_admission',
  },
  { path: 'admissions/status', element: <ParentAdmissionStatusPage />, layout: 'parent_admission' },

  // PARENT ALIASES
  { path: 'parent/dashboard', element: <MyApplications />, layout: 'parent_admission' },
  { path: 'parent/applications', element: <MyApplications />, layout: 'parent_admission' },
  { path: 'parent/documents', element: <ParentDocumentCenterPage />, layout: 'parent_admission' },
  { path: 'parent/payments', element: <ParentFeePaymentPage />, layout: 'parent_admission' },
  { path: 'parent/fees', element: <ParentFeePaymentPage />, layout: 'parent_admission' },
  { path: 'parent/decision', element: <ParentAdmissionStatusPage />, layout: 'parent_admission' },
  { path: 'parent/my-child', element: <MyApplications />, layout: 'parent_admission' },
  { path: 'parent/notifications', element: <MyApplications />, layout: 'parent_admission' },

  // SCHOOL OPERATIONS WORKSPACE (CONSOLIDATED INTERNAL STAFF)
  { path: 'workspace', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'people', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'people/students', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'people/parents', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'people/staff', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'school', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'school/academics', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },

  // CORE DASHBOARDS
  { path: 'dashboard', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'front-office', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },
  { path: 'front-office/dashboard', element: <SchoolOperationsWorkspace />, layout: 'dashboard' },

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
    path: 'admissions/inquiries',
    element: <InquiryListPage />,
    layout: 'admission_workspace',
    permission: 'admission.enquiry.view',
  },
  {
    path: 'front-office/leads',
    element: <InquiryListPage />,
    layout: 'admission_workspace',
    permission: 'admission.enquiry.view',
  },
  {
    path: 'admissions/counselling',
    element: <CounsellingPage />,
    layout: 'admission_workspace',
    permissions: ['admission.enquiry.view', 'admission.leads.manage', 'admission.review'],
  },
  {
    path: 'front-office/counselling',
    element: <CounsellingPage />,
    layout: 'admission_workspace',
    permissions: ['admission.enquiry.view', 'admission.leads.manage', 'admission.review'],
  },
  {
    path: 'admissions/applications',
    element: <ApplicationsManagementPage />,
    layout: 'admission_workspace',
    permission: 'admission.application.view',
  },
  {
    path: 'front-office/applications',
    element: <ApplicationsManagementPage />,
    layout: 'admission_workspace',
    permission: 'admission.application.view',
  },
  {
    path: 'admissions/review',
    element: <ApplicationsManagementPage />,
    layout: 'admission_workspace',
    permission: 'admission.application.view',
  },
  {
    path: 'admissions/:id',
    element: <Applicant360Page />,
    layout: 'admission_workspace',
    guardType: 'admission_application',
  },
  {
    path: 'admissions/verification',
    element: <DocumentVerificationPage />,
    layout: 'admission_workspace',
    permission: 'admission.review',
  },
  {
    path: 'admissions/queues',
    element: <DocumentVerificationPage />,
    layout: 'admission_workspace',
    permission: 'admission.review',
  },
  {
    path: 'front-office/verification',
    element: <DocumentVerificationPage />,
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
    path: 'admissions/decisions',
    element: <AdmissionDecisionPage />,
    layout: 'admission_workspace',
    permissions: ['admission.review', 'admission.approve', 'admission.enrol'],
  },
  {
    path: 'front-office/decisions',
    element: <AdmissionDecisionPage />,
    layout: 'admission_workspace',
    permissions: ['admission.review', 'admission.approve', 'admission.enrol'],
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
    element: <CampusVisitsPage />,
    layout: 'admission_workspace',
    permissions: [
      'admission.review',
      'admission.interview.manage',
      'admission.interview.evaluate',
      'admission.enquiry.view',
      'admission.leads.manage',
    ],
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
    element: <FeeCollectionPage />,
    layout: 'admission_workspace',
    permissions: ['fees.payment.collect', 'fees.view', 'admission.view_all'],
  },
  {
    path: 'front-office/fees',
    element: <FeeCollectionPage />,
    layout: 'admission_workspace',
    permissions: ['fees.payment.collect', 'fees.view', 'admission.view_all'],
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
