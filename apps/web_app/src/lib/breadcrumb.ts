/**
 * Route Label Map
 * Maps URL path segments to human-readable breadcrumb labels.
 * Add new entries here as modules are added to the ERP.
 */
export const ROUTE_LABEL_MAP: Record<string, string> = {
  // Root
  app: 'Home',
  dashboard: 'Dashboard',
  'front-office': 'Front Office',
  communication: 'Communication',
  feeds: 'Feeds & Announcements',
  helpdesk: 'Helpdesk Tickets',
  escalation: 'Ticket Escalation',
  assessment: 'Assessment Platform',
  questions: 'Question Bank',
  templates: 'Template Builder',

  // Admissions
  admissions: 'Admissions',
  review: 'Review Desk',
  form: 'Application Form',
  'my-applications': 'My Applications',
  inquiries: 'Inquiry CRM',
  wizard: 'Application Wizard',
  verification: 'Doc Verification',
  exams: 'Entrance Exams',
  decisions: 'Admission Decisions',
  interviews: 'Interview Desk',
  merit: 'Merit Desk',
  offers: 'Offer Letters',
  fees: 'Fee Collection',
  enrollment: 'Enrollment Handoff',
  reports: 'Module Reports',
  settings: 'Module Settings',
  analytics: 'Analytics',

  // Students
  students: 'Students',
  promotion: 'Promotion',
  'my-children': 'My Children',
  'academic-history': 'Academic History',
  edit: 'Edit Profile',
  parents: 'Parents & Guardians',
  academics: 'Academic History',
  allocation: 'Class Allocation',
  transfer: 'Transfer Desk',
  identity: 'Identity Cards',
  timeline: 'Milestones Timeline',
  audit: 'Audit Logs',
  import: 'Import Wizard',
  'admission-history': 'Admission History',

  // Academic
  academic: 'Academic Management',
  structure: 'Years & Structure',
  classes: 'Grades & Sections',
  sections: 'Sections',
  departments: 'Departments',
  assignments: 'Assignments',
  'my-assignments': 'My Assignments',
  'my-students': 'My Students',
  subjects: 'Subjects & Catalog',
  'academic-years': 'Academic Years',
  faculty: 'Faculty Scheduling & Workload',
  calendar: 'Academic Calendar & Terms',
  curriculum: 'Curriculum & Syllabus',
  'lesson-planning': 'AI Lesson Planning',
  resources: 'Digital Resource Library',
  readiness: 'Readiness & Publishing',
  staff: 'Staff',

  // Attendance
  attendance: 'Attendance',
  marking: 'Mark Attendance',
  my: 'My Attendance',
  leaves: 'Leave Requests',
  'bridge-manager': 'Bridge Manager',
  'section-view': 'Section View',
  'mark-daily': 'Daily Attendance',
  period: 'Period Attendance',
  student: 'Student Attendance',
  corrections: 'Corrections',
  holidays: 'Holiday Calendar',
  biometric: 'Biometric Integration',

  // Exams
  'exam-admin': 'Exam Administration',
  admin: 'Administration',
  timetable: 'Timetable',
  seating: 'Seating Plan',
  'question-papers': 'Question Papers',
  results: 'Results',
  'marks-entry': 'Marks Entry',
  'my-results': 'My Results',
  'my-hall-ticket': 'Hall Ticket',
  'my-report-card': 'Report Card',
  'my-exams': 'My Exams',

  // Fees
  'fee-structure': 'Fee Structure',
  'payment-entry': 'Payment Entry',
  ledger: 'Fee Ledger',

  // Transport
  transport: 'Transport',
  setup: 'Transport Setup',
  'bulk-assignment': 'Bulk Assignment',
  'student-assignment': 'Student Assignment',
  'live-trips': 'Live Trips',
  incidents: 'Incidents',
  manifest: 'Manifest',
  driver: 'Driver Dashboard',
  diagnostics: 'Diagnostics',

  // Timetable
  'my-timetable': 'My Timetable',
  'timetable-builder': 'Timetable Builder',

  // Parent Portal
  parent: 'Parent Portal',
  children: 'My Children',
  'academic-progress': 'Academic Progress',
  'learning-resources': 'Learning Resources',
  'academic-calendar': 'Academic Calendar',
  documents: 'Documents Centre',

  // Profile & Notifications
  profile: 'Profile',
  notifications: 'Notifications',

  // Admin
  'bulk-operations': 'Bulk Operations',
};

export interface BreadcrumbItem {
  label: string;
  path: string;
  isLast: boolean;
}

/**
 * Parse a URL pathname into breadcrumb items.
 * Skips 'app' as it's the root wrapper segment.
 */
export const parseBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  if (pathname === '/app/academic' || pathname.startsWith('/app/academic/')) {
    const academicSegmentLabels: Record<string, string> = {
      dashboard: 'Academic Overview',
      structure: 'Years & Structure',
      classes: 'Grades & Sections',
      subjects: 'Subjects & Catalog',
      faculty: 'Faculty Scheduling & Workload',
      timetable: 'Timetable Master',
      calendar: 'Academic Calendar & Terms',
      curriculum: 'Curriculum & Syllabus',
      'lesson-planning': 'AI Lesson Planning',
      resources: 'Digital Resource Library',
      readiness: 'Readiness & Publishing',
    };

    const academicSegments = pathname
      .replace(/^\/app\/academic\/?/, '')
      .split('/')
      .filter(Boolean);
    if (academicSegments.length === 0) {
      return [
        { label: 'Academic Management', path: '/app/academic/dashboard', isLast: false },
        { label: 'Academic Overview', path: '/app/academic/dashboard', isLast: true },
      ];
    }

    const section = academicSegments[0];
    const sectionLabel =
      academicSegmentLabels[section] ||
      ROUTE_LABEL_MAP[section] ||
      section.charAt(0).toUpperCase() + section.slice(1);
    const sectionPath = `/app/academic/${section}`;

    const items: BreadcrumbItem[] = [
      { label: 'Academic Management', path: '/app/academic/dashboard', isLast: false },
      {
        label: sectionLabel,
        path: sectionPath,
        isLast: academicSegments.length === 1,
      },
    ];

    if (academicSegments.length > 1) {
      items.push({
        label:
          section === 'curriculum'
            ? 'Plan Details'
            : section === 'readiness'
              ? 'Year Readiness'
              : 'Details',
        path: pathname,
        isLast: true,
      });
    }

    return items;
  }

  const isAssessmentPath =
    pathname.includes('/assessment') ||
    pathname.includes('/questions') ||
    pathname.includes('/templates');

  if (isAssessmentPath) {
    const items: BreadcrumbItem[] = [
      {
        label: 'Assessment Platform',
        path: '/app/assessment/dashboard',
        isLast: pathname === '/app/assessment/dashboard',
      },
    ];

    if (pathname.includes('/questions')) {
      items.push({
        label: 'Question Bank',
        path: '/app/assessment/questions',
        isLast: true,
      });
    } else if (pathname.includes('/templates')) {
      items.push({
        label: 'Template Builder',
        path: '/app/assessment/templates',
        isLast: true,
      });
    } else if (pathname.includes('/settings')) {
      items.push({
        label: 'Settings & Workflows',
        path: '/app/assessment/settings',
        isLast: true,
      });
    }
    return items;
  }

  const segments = pathname.split('/').filter(Boolean);

  return segments
    .filter((seg) => seg !== 'app')
    .map((seg, index, filteredSegs) => {
      // Build the full path up to this segment (including /app prefix if needed)
      const isAfterApp = pathname.includes('/app/');
      const pathSegments = isAfterApp
        ? ['/app', ...filteredSegs.slice(0, index + 1)]
        : filteredSegs.slice(0, index + 1);

      const path = pathSegments.join('/') || '/';
      const label = ROUTE_LABEL_MAP[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);

      return {
        label,
        path,
        isLast: index === filteredSegs.length - 1,
      };
    });
};
