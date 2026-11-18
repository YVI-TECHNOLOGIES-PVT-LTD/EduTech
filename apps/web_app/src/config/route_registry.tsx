import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LandingResolver } from '../services/LandingResolver';
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const AcademicOverviewPage = React.lazy(() =>
  import('../modules/academic/pages/AcademicOverviewPage').then((m) => ({
    default: m.AcademicOverviewPage,
  })),
);
const AcademicStructurePage = React.lazy(() =>
  import('../modules/academic/pages/AcademicStructurePage').then((m) => ({
    default: m.AcademicStructurePage,
  })),
);
const GradesAndSectionsPage = React.lazy(() =>
  import('../modules/academic/pages/GradesAndSectionsPage').then((m) => ({
    default: m.GradesAndSectionsPage,
  })),
);
const SubjectsCatalogPage = React.lazy(() =>
  import('../modules/academic/pages/SubjectsCatalogPage').then((m) => ({
    default: m.SubjectsCatalogPage,
  })),
);
const FacultyWorkloadPage = React.lazy(() =>
  import('../modules/academic/pages/FacultyWorkloadPage').then((m) => ({
    default: m.FacultyWorkloadPage,
  })),
);
const TimetableMasterPage = React.lazy(() =>
  import('../modules/academic/pages/TimetableMasterPage').then((m) => ({
    default: m.TimetableMasterPage,
  })),
);
const AcademicCalendarPage = React.lazy(() =>
  import('../modules/academic/pages/AcademicCalendarPage').then((m) => ({
    default: m.AcademicCalendarPage,
  })),
);
const CurriculumSyllabusPage = React.lazy(() =>
  import('../modules/academic/pages/CurriculumSyllabusPage').then((m) => ({
    default: m.CurriculumSyllabusPage,
  })),
);
const LessonPlanningPage = React.lazy(() =>
  import('../modules/academic/pages/LessonPlanningPage').then((m) => ({
    default: m.LessonPlanningPage,
  })),
);
const DigitalResourcesPage = React.lazy(() =>
  import('../modules/academic/pages/DigitalResourcesPage').then((m) => ({
    default: m.DigitalResourcesPage,
  })),
);
const AcademicReadinessPage = React.lazy(() =>
  import('../modules/academic/pages/AcademicReadinessPage').then((m) => ({
    default: m.AcademicReadinessPage,
  })),
);
const Profile = React.lazy(() => import('../pages/Profile').then((m) => ({ default: m.Profile })));
const Settings = React.lazy(() =>
  import('../pages/Settings').then((m) => ({ default: m.Settings })),
);
const BulkOperations = React.lazy(() =>
  import('../modules/admin/pages/BulkOperations').then((m) => ({
    default: m.BulkOperations,
  })),
);
const ExecutiveOverview = React.lazy(() =>
  import('../modules/common/executive/ExecutiveOverview').then((m) => ({
    default: m.ExecutiveOverview,
  })),
);
const ImportHistoryPage = React.lazy(() =>
  import('../modules/import/pages/ImportHistory').then((m) => ({
    default: m.ImportHistoryPage,
  })),
);
const StudentDashboard = React.lazy(() =>
  import('../modules/dashboard/pages/StudentDashboard').then((m) => ({
    default: m.StudentDashboard,
  })),
);
const AdminDashboard = React.lazy(() =>
  import('../modules/dashboard/pages/AdminDashboard').then((m) => ({
    default: m.AdminDashboard,
  })),
);
const FacultyDashboard = React.lazy(() =>
  import('../modules/dashboard/pages/FacultyDashboard').then((m) => ({
    default: m.FacultyDashboard,
  })),
);
const AdmissionForm = React.lazy(() =>
  import('../modules/admission/pages/AdmissionForm').then((m) => ({
    default: m.AdmissionForm,
  })),
);
const MyApplications = React.lazy(() =>
  import('../modules/admission/pages/MyApplications').then((m) => ({
    default: m.MyApplications,
  })),
);
const InstructionsPage = React.lazy(() =>
  import('../modules/admission/pages/InstructionsPage').then((m) => ({
    default: m.InstructionsPage,
  })),
);
const TestPortal = React.lazy(() =>
  import('../modules/admission/pages/TestPortal').then((m) => ({
    default: m.TestPortal,
  })),
);
const SuccessPage = React.lazy(() =>
  import('../modules/admission/pages/SuccessPage').then((m) => ({
    default: m.SuccessPage,
  })),
);
const MonitoringDashboard = React.lazy(() =>
  import('../modules/admission/pages/MonitoringDashboard').then((m) => ({
    default: m.MonitoringDashboard,
  })),
);
const WorkspaceDashboard = React.lazy(() => import('../modules/admission/pages/Workspace'));
const Applicant360Page = React.lazy(() => import('../modules/admission/pages/Applicant360'));
const InquiryListPage = React.lazy(() =>
  import('../modules/admission/pages/InquiryListPage').then((m) => ({
    default: m.InquiryListPage,
  })),
);
const ApplicationsManagementPage = React.lazy(() =>
  import('../modules/admission/pages/front-office/ApplicationsManagementPage').then((m) => ({
    default: m.ApplicationsManagementPage,
  })),
);
const CounsellingPage = React.lazy(() =>
  import('../modules/admission/pages/front-office/CounsellingPage').then((m) => ({
    default: m.CounsellingPage,
  })),
);
const DocumentVerificationPage = React.lazy(() =>
  import('../modules/admission/pages/front-office/DocumentVerificationPage').then((m) => ({
    default: m.DocumentVerificationPage,
  })),
);
const FeeCollectionPage = React.lazy(() =>
  import('../modules/admission/pages/front-office/FeeCollectionPage').then((m) => ({
    default: m.FeeCollectionPage,
  })),
);
const CampusVisitsPage = React.lazy(() =>
  import('../modules/admission/pages/front-office/CampusVisitsPage').then((m) => ({
    default: m.CampusVisitsPage,
  })),
);
const ApplicationWizardPage = React.lazy(() =>
  import('../modules/admission/pages/ApplicationWizardPage').then((m) => ({
    default: m.ApplicationWizardPage,
  })),
);
const EntranceExamPage = React.lazy(() =>
  import('../modules/admission/pages/EntranceExamPage').then((m) => ({
    default: m.EntranceExamPage,
  })),
);
const AdmissionDecisionPage = React.lazy(() =>
  import('../modules/admission/pages/AdmissionDecisionPage').then((m) => ({
    default: m.AdmissionDecisionPage,
  })),
);

const ParentDashboard = React.lazy(() =>
  import('../modules/dashboard/pages/ParentDashboard').then((m) => ({
    default: m.ParentDashboard,
  })),
);
const ParentDashboardPage = React.lazy(() =>
  import('../modules/admission/pages/parent/ParentDashboardPage').then((m) => ({
    default: m.ParentDashboardPage,
  })),
);
const ParentDashboardRouter = React.lazy(() =>
  import('../pages/ParentDashboardRouter').then((m) => ({
    default: m.ParentDashboardRouter,
  })),
);
const ParentFeesRouter = React.lazy(() =>
  import('../pages/ParentFeesRouter').then((m) => ({
    default: m.ParentFeesRouter,
  })),
);
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

const SchoolOperationsWorkspace = React.lazy(() =>
  import('../pages/SchoolOperationsWorkspace').then((m) => ({
    default: m.SchoolOperationsWorkspace,
  })),
);
const StudentList = React.lazy(() =>
  import('../modules/student/pages/StudentList').then((m) => ({
    default: m.StudentList,
  })),
);
const StaffHrDashboard = React.lazy(() =>
  import('../modules/dashboard/components/StaffHrDashboard').then((m) => ({
    default: m.StaffHrDashboard,
  })),
);
const FinanceConfigurationPage = React.lazy(() =>
  import('../modules/fees/pages/FinanceConfiguration').then((m) => ({
    default: m.FinanceConfigurationPage,
  })),
);
const FinanceDashboard = React.lazy(() =>
  import('../modules/fees/pages/FinanceDashboard').then((m) => ({
    default: m.FinanceDashboard,
  })),
);
const FeeStructureManagement = React.lazy(() =>
  import('../modules/fees/pages/FeeStructureManagement').then((m) => ({
    default: m.FeeStructureManagement,
  })),
);
const DemandManagement = React.lazy(() =>
  import('../modules/fees/pages/DemandManagement').then((m) => ({
    default: m.DemandManagement,
  })),
);
const PaymentEntry = React.lazy(() =>
  import('../modules/fees/pages/PaymentEntry').then((m) => ({
    default: m.PaymentEntry,
  })),
);
const AdminFeeLedger = React.lazy(() =>
  import('../modules/fees/pages/AdminFeeLedger').then((m) => ({
    default: m.AdminFeeLedger,
  })),
);
const FinanceReports = React.lazy(() =>
  import('../modules/fees/pages/FinanceReports').then((m) => ({
    default: m.FinanceReports,
  })),
);
const ReceiptCenter = React.lazy(() =>
  import('../modules/fees/pages/ReceiptCenter').then((m) => ({
    default: m.ReceiptCenter,
  })),
);
const ScholarshipsConcessions = React.lazy(() =>
  import('../modules/fees/pages/ScholarshipsConcessions').then((m) => ({
    default: m.ScholarshipsConcessions,
  })),
);
const ReceivablesCollections = React.lazy(() =>
  import('../modules/fees/pages/ReceivablesCollections').then((m) => ({
    default: m.ReceivablesCollections,
  })),
);
const FinanceNotificationCenter = React.lazy(() =>
  import('../modules/fees/pages/FinanceNotificationCenter').then((m) => ({
    default: m.FinanceNotificationCenter,
  })),
);
const FinanceReconciliation = React.lazy(() =>
  import('../modules/fees/pages/FinanceReconciliation').then((m) => ({
    default: m.FinanceReconciliation,
  })),
);
const FinanceAccounting = React.lazy(() =>
  import('../modules/fees/pages/FinanceAccounting').then((m) => ({
    default: m.FinanceAccounting,
  })),
);
const FinancePlanning = React.lazy(() =>
  import('../modules/fees/pages/FinancePlanning').then((m) => ({
    default: m.FinancePlanning,
  })),
);
const FinanceAudit = React.lazy(() =>
  import('../modules/fees/pages/FinanceAudit').then((m) => ({
    default: m.FinanceAudit,
  })),
);
const FinanceOperations = React.lazy(() =>
  import('../modules/fees/pages/FinanceOperations').then((m) => ({
    default: m.FinanceOperations,
  })),
);
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
const FinanceCommunicationEscalation = React.lazy(() =>
  import('../modules/fees/pages/FinanceCommunicationEscalation').then((m) => ({
    default: m.FinanceCommunicationEscalation,
  })),
);
const RazorpayCheckoutDemo = React.lazy(() =>
  import('../modules/fees/pages/RazorpayCheckoutDemo').then((m) => ({
    default: m.RazorpayCheckoutDemo,
  })),
);
const StudentFeeAssignment = React.lazy(() =>
  import('../modules/fees/pages/StudentFeeAssignment').then((m) => ({
    default: m.StudentFeeAssignment,
  })),
);
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

const TeacherClassroomPage = React.lazy(() =>
  import('../modules/classroom/pages/TeacherClassroomPage').then((m) => ({
    default: m.TeacherClassroomPage,
  })),
);

const AdminClassroomPage = React.lazy(() =>
  import('../modules/classroom/pages/AdminClassroomPage').then((m) => ({
    default: m.AdminClassroomPage,
  })),
);

const StudentClassroomPage = React.lazy(() =>
  import('../modules/classroom/pages/StudentClassroomPage').then((m) => ({
    default: m.StudentClassroomPage,
  })),
);

const ParentClassroomPage = React.lazy(() =>
  import('../modules/classroom/pages/ParentClassroomPage').then((m) => ({
    default: m.ParentClassroomPage,
  })),
);

const TeacherLearningActivitiesPage = React.lazy(() =>
  import('../modules/learning-activities/pages/TeacherLearningActivitiesPage').then((m) => ({
    default: m.TeacherLearningActivitiesPage,
  })),
);

const StudentLearningActivitiesPage = React.lazy(() =>
  import('../modules/learning-activities/pages/StudentLearningActivitiesPage').then((m) => ({
    default: m.StudentLearningActivitiesPage,
  })),
);

const ParentLearningActivitiesPage = React.lazy(() =>
  import('../modules/learning-activities/pages/ParentLearningActivitiesPage').then((m) => ({
    default: m.ParentLearningActivitiesPage,
  })),
);

const AdminLearningActivitiesPage = React.lazy(() =>
  import('../modules/learning-activities/pages/AdminLearningActivitiesPage').then((m) => ({
    default: m.AdminLearningActivitiesPage,
  })),
);

const TeacherAiCopilotPage = React.lazy(() =>
  import('../modules/ai-teacher-copilot/pages/TeacherAiCopilotPage').then((m) => ({
    default: m.TeacherAiCopilotPage,
  })),
);

const StudentStudyAssistantPage = React.lazy(() =>
  import('../modules/ai-teacher-copilot/pages/StudentStudyAssistantPage').then((m) => ({
    default: m.StudentStudyAssistantPage,
  })),
);

const AdminAiOversightPage = React.lazy(() =>
  import('../modules/ai-teacher-copilot/pages/AdminAiOversightPage').then((m) => ({
    default: m.AdminAiOversightPage,
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

const AdmissionsWorkspaceDispatcher: React.FC = () => {
  const { user } = useAuth();
  const rawRoles =
    user?.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const normalized = rawRoles.map((r: string) => LandingResolver.normalizeRole(r));
  const isParentOnly = normalized.every((r: string) =>
    ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'].includes(r),
  );
  if (isParentOnly) {
    return <Navigate to="/app/admissions/dashboard" replace />;
  }
  return <ApplicationsManagementPage />;
};

const AdmissionsDashboardDispatcher: React.FC = () => {
  const { user } = useAuth();
  const rawRoles =
    user?.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const normalized = rawRoles.map((r: string) => LandingResolver.normalizeRole(r));
  const isParentOnly = normalized.every((r: string) =>
    ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'].includes(r),
  );
  if (isParentOnly) {
    return <ParentDashboardPage />;
  }
  return <ApplicationsManagementPage />;
};

const AdmissionsFeesDispatcher: React.FC = () => {
  const { user } = useAuth();
  const rawRoles =
    user?.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const normalized = rawRoles.map((r: string) => LandingResolver.normalizeRole(r));
  const isParentOnly = normalized.every((r: string) =>
    ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'].includes(r),
  );
  if (isParentOnly) {
    return <ParentFeePaymentPage />;
  }

  // Front Office staff persona must access their dedicated Front Office Fee Collection desk
  const isFrontOffice = normalized.some((r: string) =>
    [
      'FRONT_OFFICE',
      'FO',
      'FRONT_OFFICE_STAFF',
      'RECEPTIONIST',
      'STAFF',
      'ADMISSION_OFFICER',
      'ADMISSIONS_OFFICER',
      'COUNSELLOR',
      'COUNSELOR',
    ].includes(r),
  );
  if (isFrontOffice) {
    return <FeeCollectionPage />;
  }

  return <PaymentEntry />;
};

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
    path: 'admin',
    element: <Navigate to="/app/admin/dashboard" replace />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
    guardType: 'admin',
  },
  {
    path: 'admin/dashboard',
    element: <AdminDashboard />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
    guardType: 'admin',
  },
  {
    path: 'admin/classroom',
    element: <AdminClassroomPage />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
    guardType: 'admin',
  },
  {
    path: 'admin/learning-activities',
    element: <AdminLearningActivitiesPage />,
    layout: 'dashboard',
    permission: 'admin.dashboard.view',
    guardType: 'admin',
  },
  {
    path: 'admin/ai-oversight',
    element: <AdminAiOversightPage />,
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
    path: 'super-admin/organizations',
    element: <SuperAdminDashboard />,
    layout: 'dashboard',
    guardType: 'super_admin',
  },
  {
    path: 'super-admin/academic-overview',
    element: <AcademicOverviewPage />,
    layout: 'dashboard',
    guardType: 'super_admin',
  },
  {
    path: 'super-admin/audit',
    element: <SuperAdminDashboard />,
    layout: 'dashboard',
    guardType: 'super_admin',
  },
  {
    path: 'super-admin/settings',
    element: <Settings />,
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
    path: 'teacher/classroom',
    element: <TeacherClassroomPage />,
    layout: 'dashboard',
    guardType: 'teacher',
  },
  {
    path: 'teacher/learning-activities',
    element: <TeacherLearningActivitiesPage />,
    layout: 'dashboard',
    guardType: 'teacher',
  },
  {
    path: 'teacher/ai-copilot',
    element: <TeacherAiCopilotPage />,
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
    path: 'student/classroom',
    element: <StudentClassroomPage />,
    layout: 'dashboard',
    permission: 'student.dashboard.view',
  },
  {
    path: 'student/learning-activities',
    element: <StudentLearningActivitiesPage />,
    layout: 'dashboard',
    permission: 'student.dashboard.view',
  },
  {
    path: 'student/ai-study-assistant',
    element: <StudentStudyAssistantPage />,
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

  // ─── 3. ADMISSIONS & APPLICANT PORTAL ROUTES ───────────────────────────────
  {
    path: 'admissions',
    element: <AdmissionsWorkspaceDispatcher />,
    layout: 'admission_workspace',
  },
  {
    path: 'students',
    element: <StudentList />,
    layout: 'dashboard',
  },
  {
    path: 'fees/payments',
    element: <Navigate to="/app/finance/payments" replace />,
    layout: 'dashboard',
  },
  {
    path: 'admissions/dashboard',
    element: <AdmissionsDashboardDispatcher />,
    layout: 'parent_admission',
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
    element: <AdmissionsFeesDispatcher />,
    layout: 'parent_admission',
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
    path: 'parent/classroom',
    element: <ParentClassroomPage />,
    layout: 'dashboard',
    guardType: 'parent',
  },
  {
    path: 'parent/learning-activities',
    element: <ParentLearningActivitiesPage />,
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
    element: <StudentList />,
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
    element: <StaffHrDashboard />,
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
    path: 'finance',
    element: <Navigate to="/app/finance/dashboard" replace />,
    layout: 'dashboard',
  },
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
    path: 'parent/helpdesk',
    element: <FinanceCommunicationHelpdesk />,
    layout: 'dashboard',
    guardType: 'parent',
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
