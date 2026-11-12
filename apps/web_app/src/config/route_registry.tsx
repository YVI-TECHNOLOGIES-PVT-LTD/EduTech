import React from 'react';
import { Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AcademicOverviewPage } from '../modules/academic/pages/AcademicOverviewPage';
import { AcademicStructurePage } from '../modules/academic/pages/AcademicStructurePage';
import { GradesAndSectionsPage } from '../modules/academic/pages/GradesAndSectionsPage';
import { SubjectsCatalogPage } from '../modules/academic/pages/SubjectsCatalogPage';
import { FacultyWorkloadPage } from '../modules/academic/pages/FacultyWorkloadPage';
import { TimetableMasterPage } from '../modules/academic/pages/TimetableMasterPage';
import { AcademicCalendarPage } from '../modules/academic/pages/AcademicCalendarPage';
import { CurriculumSyllabusPage } from '../modules/academic/pages/CurriculumSyllabusPage';
import { LessonPlanningPage } from '../modules/academic/pages/LessonPlanningPage';
import { DigitalResourcesPage } from '../modules/academic/pages/DigitalResourcesPage';
import { AcademicReadinessPage } from '../modules/academic/pages/AcademicReadinessPage';
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
const ApplicationsManagementPage = React.lazy(() =>
  import('../modules/admission/pages/front-office/ApplicationsManagementPage').then((m) => ({
    default: m.ApplicationsManagementPage,
  })),
);
import { CounsellingPage } from '../modules/admission/pages/front-office/CounsellingPage';
import { DocumentVerificationPage } from '../modules/admission/pages/front-office/DocumentVerificationPage';
import { FeeCollectionPage } from '../modules/admission/pages/front-office/FeeCollectionPage';
import { CampusVisitsPage } from '../modules/admission/pages/front-office/CampusVisitsPage';
import { ApplicationWizardPage } from '../modules/admission/pages/ApplicationWizardPage';
import { EntranceExamPage } from '../modules/admission/pages/EntranceExamPage';
import { AdmissionDecisionPage } from '../modules/admission/pages/AdmissionDecisionPage';

const ParentDashboard = React.lazy(() =>
  import('../modules/dashboard/pages/ParentDashboard').then((m) => ({
    default: m.ParentDashboard,
  })),
);
import { ParentDashboardPage } from '../modules/admission/pages/parent/ParentDashboardPage';
import { ParentDashboardRouter } from '../pages/ParentDashboardRouter';
import { ParentFeesRouter } from '../pages/ParentFeesRouter';
const ParentDocumentCenterPage = React.lazy(() =>
  import('../modules/admission/pages/parent/ParentDocumentCenterPage').then((m) => ({
    default: m.ParentDocumentCenterPage,
  })),
);
const ParentFeePaymentPage = React.lazy(() =>
  import('../modules/admission/pages/parent/ParentFeePaymentPage').then((m) => ({
    default: m.ParentFeePaymentPage,
  })),
);
const ParentChildrenPage = React.lazy(() =>
  import('../modules/parent/pages/ParentChildrenPage').then((m) => ({
    default: m.ParentChildrenPage,
  })),
);
const ParentTimetablePage = React.lazy(() =>
  import('../modules/parent/pages/ParentTimetablePage').then((m) => ({
    default: m.ParentTimetablePage,
  })),
);
const ParentAcademicProgressPage = React.lazy(() =>
  import('../modules/parent/pages/ParentAcademicProgressPage').then((m) => ({
    default: m.ParentAcademicProgressPage,
  })),
);
const ParentSubjectsCurriculumPage = React.lazy(() =>
  import('../modules/parent/pages/ParentSubjectsCurriculumPage').then((m) => ({
    default: m.ParentSubjectsCurriculumPage,
  })),
);
const ParentLearningResourcesPage = React.lazy(() =>
  import('../modules/parent/pages/ParentLearningResourcesPage').then((m) => ({
    default: m.ParentLearningResourcesPage,
  })),
);
const ParentAcademicCalendarPage = React.lazy(() =>
  import('../modules/parent/pages/ParentAcademicCalendarPage').then((m) => ({
    default: m.ParentAcademicCalendarPage,
  })),
);
const ParentNotificationsPage = React.lazy(() =>
  import('../modules/parent/pages/ParentNotificationsPage').then((m) => ({
    default: m.ParentNotificationsPage,
  })),
);
const ParentCommunicationPage = React.lazy(() =>
  import('../modules/parent/pages/ParentCommunicationPage').then((m) => ({
    default: m.ParentCommunicationPage,
  })),
);
const ParentSettingsPage = React.lazy(() =>
  import('../modules/parent/pages/ParentSettingsPage').then((m) => ({
    default: m.ParentSettingsPage,
  })),
);
const ParentAdmissionStatusPage = React.lazy(() =>
  import('../modules/admission/pages/parent/ParentAdmissionStatusPage').then((m) => ({
    default: m.ParentAdmissionStatusPage,
  })),
);
const ParentSubmittedApplicationPage = React.lazy(() =>
  import('../modules/admission/pages/parent/ParentSubmittedApplicationPage').then((m) => ({
    default: m.ParentSubmittedApplicationPage,
  })),
);

import { SchoolOperationsWorkspace } from '../pages/SchoolOperationsWorkspace';
import { FinanceConfigurationPage } from '../modules/fees/pages/FinanceConfiguration';
import { FinanceDashboard } from '../modules/fees/pages/FinanceDashboard';
import { FeeStructureManagement } from '../modules/fees/pages/FeeStructureManagement';
import { DemandManagement } from '../modules/fees/pages/DemandManagement';
import { PaymentEntry } from '../modules/fees/pages/PaymentEntry';
import { AdminFeeLedger } from '../modules/fees/pages/AdminFeeLedger';
import { FinanceReports } from '../modules/fees/pages/FinanceReports';
import { ReceiptCenter } from '../modules/fees/pages/ReceiptCenter';
import { ScholarshipsConcessions } from '../modules/fees/pages/ScholarshipsConcessions';
import { ReceivablesCollections } from '../modules/fees/pages/ReceivablesCollections';
import { FinanceNotificationCenter } from '../modules/fees/pages/FinanceNotificationCenter';
import { FinanceReconciliation } from '../modules/fees/pages/FinanceReconciliation';
import { FinanceAccounting } from '../modules/fees/pages/FinanceAccounting';
import { FinancePlanning } from '../modules/fees/pages/FinancePlanning';
import { FinanceAudit } from '../modules/fees/pages/FinanceAudit';
import { FinanceOperations } from '../modules/fees/pages/FinanceOperations';
const FinanceCommunicationFeeds = React.lazy(() =>
  import('../modules/fees/pages/FinanceCommunicationFeeds').then((m) => ({
    default: m.FinanceCommunicationFeeds,
  })),
);
const FinanceCommunicationHelpdesk = React.lazy(() =>
  import('../modules/fees/pages/FinanceCommunicationHelpdesk').then((m) => ({
    default: m.FinanceCommunicationHelpdesk,
  })),
);
import { FinanceCommunicationEscalation } from '../modules/fees/pages/FinanceCommunicationEscalation';
import { RazorpayCheckoutDemo } from '../modules/fees/pages/RazorpayCheckoutDemo';
import { StudentFeeAssignment } from '../modules/fees/pages/StudentFeeAssignment';
const MyFees = React.lazy(() =>
  import('../modules/fees/pages/MyFees').then((m) => ({ default: m.MyFees })),
);

const SuperAdminDashboard = React.lazy(() =>
  import('../modules/dashboard/pages/SuperAdminDashboard').then((m) => ({
    default: m.SuperAdminDashboard,
  })),
);

const TeacherDashboard = React.lazy(() =>
  import('../modules/dashboard/pages/TeacherDashboard').then((m) => ({
    default: m.TeacherDashboard,
  })),
);

const TeacherClassesPage = React.lazy(() =>
  import('../modules/teacher/pages/TeacherClassesPage').then((m) => ({
    default: m.TeacherClassesPage,
  })),
);

const TeacherTimetablePage = React.lazy(() =>
  import('../modules/teacher/pages/TeacherTimetablePage').then((m) => ({
    default: m.TeacherTimetablePage,
  })),
);

const TeacherSubjectsPage = React.lazy(() =>
  import('../modules/teacher/pages/TeacherSubjectsPage').then((m) => ({
    default: m.TeacherSubjectsPage,
  })),
);

const TeacherCurriculumPage = React.lazy(() =>
  import('../modules/teacher/pages/TeacherCurriculumPage').then((m) => ({
    default: m.TeacherCurriculumPage,
  })),
);

const TeacherLessonPlansPage = React.lazy(() =>
  import('../modules/teacher/pages/TeacherLessonPlansPage').then((m) => ({
    default: m.TeacherLessonPlansPage,
  })),
);

const TeacherWorkloadPage = React.lazy(() =>
  import('../modules/teacher/pages/TeacherWorkloadPage').then((m) => ({
    default: m.TeacherWorkloadPage,
  })),
);

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
    | 'super_admin'
    | 'teacher'
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
    path: 'super-admin/dashboard',
    element: <SuperAdminDashboard />,
    layout: 'dashboard',
    guardType: 'super_admin',
  },
  {
    path: 'teacher/dashboard',
    element: <TeacherDashboard />,
    layout: 'dashboard',
    guardType: 'teacher',
  },
  {
    path: 'teacher/classes',
    element: <TeacherClassesPage />,
    layout: 'dashboard',
    guardType: 'teacher',
  },
  {
    path: 'teacher/timetable',
    element: <TeacherTimetablePage />,
    layout: 'dashboard',
    guardType: 'teacher',
  },
  {
    path: 'teacher/subjects',
    element: <TeacherSubjectsPage />,
    layout: 'dashboard',
    guardType: 'teacher',
  },
  {
    path: 'teacher/curriculum',
    element: <TeacherCurriculumPage />,
    layout: 'dashboard',
    guardType: 'teacher',
  },
  {
    path: 'teacher/lesson-plans',
    element: <TeacherLessonPlansPage />,
    layout: 'dashboard',
    guardType: 'teacher',
  },
  {
    path: 'teacher/workload',
    element: <TeacherWorkloadPage />,
    layout: 'dashboard',
    guardType: 'teacher',
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
    path: 'parent/children',
    element: <ParentChildrenPage />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/my-child',
    element: <Navigate to="/app/parent/children" replace />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/timetable',
    element: <ParentTimetablePage />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/academic-progress',
    element: <ParentAcademicProgressPage />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/subjects',
    element: <ParentSubjectsCurriculumPage />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/learning-resources',
    element: <ParentLearningResourcesPage />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/academic-calendar',
    element: <ParentAcademicCalendarPage />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/communication',
    element: <ParentCommunicationPage />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/profile',
    element: <Profile />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/settings',
    element: <ParentSettingsPage />,
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
    element: <ParentFeesRouter />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'fees/my',
    element: <MyFees />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/my-fees',
    element: <MyFees />,
    layout: 'dashboard',
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
    element: <ParentNotificationsPage />,
    layout: 'dashboard',
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

  // ─── 5A. ADMIN ACADEMIC MANAGEMENT ROUTES ──────────────────────────────────
  {
    path: 'academic',
    element: <Navigate to="/app/academic/dashboard" replace />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
    guardType: 'admin',
  },
  {
    path: 'academic/dashboard',
    element: <AcademicOverviewPage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
    guardType: 'admin',
  },
  {
    path: 'academic/structure',
    element: <AcademicStructurePage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_SETUP',
    guardType: 'admin',
  },
  {
    path: 'academic/classes',
    element: <GradesAndSectionsPage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
    guardType: 'admin',
  },
  {
    path: 'academic/subjects',
    element: <SubjectsCatalogPage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
    guardType: 'admin',
  },
  {
    path: 'academic/faculty',
    element: <FacultyWorkloadPage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
    guardType: 'admin',
  },
  {
    path: 'academic/timetable',
    element: <TimetableMasterPage />,
    layout: 'dashboard',
    permission: 'TIMETABLE_VIEW',
    guardType: 'admin',
  },
  {
    path: 'academic/calendar',
    element: <AcademicCalendarPage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
    guardType: 'admin',
  },
  {
    path: 'academic/curriculum',
    element: <CurriculumSyllabusPage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
    guardType: 'admin',
  },
  {
    path: 'academic/curriculum/:id',
    element: <CurriculumSyllabusPage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
    guardType: 'admin',
  },
  {
    path: 'academic/lesson-planning',
    element: <LessonPlanningPage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
    guardType: 'teacher',
  },
  {
    path: 'academic/resources',
    element: <DigitalResourcesPage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
    guardType: 'teacher',
  },
  {
    path: 'academic/readiness',
    element: <AcademicReadinessPage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
    guardType: 'admin',
  },
  {
    path: 'academic/readiness/:academicYearId',
    element: <AcademicReadinessPage />,
    layout: 'dashboard',
    permission: 'ACADEMIC_VIEW',
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

  // ─── 7. FINANCE & FEES MANAGEMENT (PHASE 1 & PHASE 2) ─────────────────────
  {
    path: 'finance/dashboard',
    element: <FinanceDashboard />,
    layout: 'dashboard',
    permissions: ['fees.dashboard.view', 'fees.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/configuration',
    element: <FinanceConfigurationPage />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.structure.manage', 'admin.dashboard.view'],
  },
  {
    path: 'finance/settings',
    element: <FinanceConfigurationPage />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.structure.manage', 'admin.dashboard.view'],
  },
  {
    path: 'finance/structures',
    element: <FeeStructureManagement />,
    layout: 'dashboard',
    permissions: ['fees.structure.view', 'fees.structure.manage', 'admin.dashboard.view'],
  },
  {
    path: 'finance/demands',
    element: <DemandManagement />,
    layout: 'dashboard',
    permissions: ['fees.demand.view', 'fees.demand.generate', 'admin.dashboard.view'],
  },
  {
    path: 'finance/assignments',
    element: <StudentFeeAssignment />,
    layout: 'dashboard',
    permissions: ['fees.demand.generate', 'fees.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/payments',
    element: <PaymentEntry />,
    layout: 'dashboard',
    permissions: ['fees.payment.collect', 'admin.dashboard.view'],
  },
  {
    path: 'finance/ledger',
    element: <AdminFeeLedger />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.demand.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/reports',
    element: <FinanceReports />,
    layout: 'dashboard',
    permissions: ['fees.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/receipts',
    element: <ReceiptCenter />,
    layout: 'dashboard',
    permissions: ['fees.receipt.generate', 'fees.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/scholarships',
    element: <ScholarshipsConcessions />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.structure.manage', 'fees.demand.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/receivables',
    element: <ReceivablesCollections />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.demand.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/notifications',
    element: <FinanceNotificationCenter />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.demand.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/reconciliation',
    element: <FinanceReconciliation />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.demand.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/accounting',
    element: <FinanceAccounting />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.demand.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/planning',
    element: <FinancePlanning />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.demand.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/audit',
    element: <FinanceAudit />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.demand.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/operations',
    element: <FinanceOperations />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.demand.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/communication/feeds',
    element: <FinanceCommunicationFeeds />,
    layout: 'dashboard',
    permissions: ['fees.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/communication/helpdesk',
    element: <FinanceCommunicationHelpdesk />,
    layout: 'dashboard',
    permissions: ['fees.view', 'admin.dashboard.view'],
  },
  {
    path: 'finance/communication/escalation',
    element: <FinanceCommunicationEscalation />,
    layout: 'dashboard',
    permissions: ['fees.view', 'admin.dashboard.view'],
  },
  {
    path: 'communication/feeds',
    element: <FinanceCommunicationFeeds />,
    layout: 'dashboard',
  },
  {
    path: 'communication/helpdesk',
    element: <FinanceCommunicationHelpdesk />,
    layout: 'dashboard',
  },
  {
    path: 'communication/escalation',
    element: <FinanceCommunicationEscalation />,
    layout: 'dashboard',
  },
  {
    path: 'finance/checkout',
    element: <RazorpayCheckoutDemo />,
    layout: 'dashboard',
    permissions: ['fees.view', 'fees.demand.view', 'admin.dashboard.view'],
  },
  {
    path: 'checkout-demo',
    element: <RazorpayCheckoutDemo />,
    layout: 'none',
  },
];

export const EXAM_ADMIN_ROUTES: RouteConfig[] = [];
