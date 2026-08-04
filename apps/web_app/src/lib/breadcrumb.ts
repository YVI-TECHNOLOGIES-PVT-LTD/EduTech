/**
 * Route Label Map
 * Maps URL path segments to human-readable breadcrumb labels.
 * Add new entries here as modules are added to the ERP.
 */
export const ROUTE_LABEL_MAP: Record<string, string> = {
    // Root
    app: 'Home',
    dashboard: 'Dashboard',
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
    academic: 'Academic',
    classes: 'Classes',
    sections: 'Sections',
    departments: 'Departments',
    assignments: 'Assignments',
    'my-assignments': 'My Assignments',
    'my-students': 'My Students',
    subjects: 'Subjects',
    'academic-years': 'Academic Years',
    faculty: 'Faculty',
    staff: 'Staff',

    // Attendance
    attendance: 'Attendance',
    marking: 'Mark Attendance',
    'my': 'My Attendance',
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

    // Profile & Settings
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
    const isAssessmentPath = pathname.includes('/assessment') || 
                             pathname.includes('/questions') || 
                             pathname.includes('/templates');

    if (isAssessmentPath) {
        const items: BreadcrumbItem[] = [
            {
                label: 'Assessment Platform',
                path: '/app/assessment/dashboard',
                isLast: pathname === '/app/assessment/dashboard'
            }
        ];

        if (pathname.includes('/questions')) {
            items.push({
                label: 'Question Bank',
                path: '/app/assessment/questions',
                isLast: true
            });
        } else if (pathname.includes('/templates')) {
            items.push({
                label: 'Template Builder',
                path: '/app/assessment/templates',
                isLast: true
            });
        } else if (pathname.includes('/settings')) {
            items.push({
                label: 'Settings & Workflows',
                path: '/app/assessment/settings',
                isLast: true
            });
        }
        return items;
    }

    const segments = pathname.split('/').filter(Boolean);

    return segments
        .filter(seg => seg !== 'app')
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
