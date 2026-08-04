import { 
    LayoutDashboard, Calendar, Users, ClipboardList, GraduationCap, BarChart3, Award, 
    BookOpen, FileText, Settings, Briefcase, Building, Coins, Bus, Clock, 
    History, UserCircle, MapPin, User, DollarSign, Activity, AlertOctagon,
    Receipt, RefreshCw, Sparkles, SlidersHorizontal, CheckSquare, MessageSquare,
    ChevronLeft, ChevronRight, Moon, Sun, Command, ShieldCheck, Bell, LogOut
} from 'lucide-react';

export interface MenuItem {
    label: string;
    icon: any;
    path: string;
    permission?: string;
}

export interface MenuGroup {
    label: string;
    permission?: string; // If set, requires this permission for the group.
    module?: string; // Binds group to a module ID for visibility validation
    items: MenuItem[];
}

export const MENU_REGISTRY: MenuGroup[] = [
    // GENERAL / ADMIN OVERVIEW
    {
        label: 'General',
        permission: 'admin.dashboard.view',
        module: 'admin',
        items: [
            { label: 'Overview', icon: LayoutDashboard, path: '/app/admin/dashboard' }
        ]
    },
    // ASSESSMENT PLATFORM
    {
        label: 'Assessment Platform',
        permission: 'assessment.dashboard.view',
        module: 'assessment',
        items: [
            { label: 'Overview', icon: LayoutDashboard, path: '/app/assessment/dashboard', permission: 'assessment.dashboard.view' },
            { label: 'Settings & Workflows', icon: Settings, path: '/app/assessment/settings', permission: 'assessment.foundation.manage' },
            { label: 'Question Bank', icon: FileText, path: '/app/assessment/questions', permission: 'assessment.question.view' },
            { label: 'Template Builder', icon: ClipboardList, path: '/app/assessment/templates', permission: 'assessment.template.view' },
            { label: 'Blueprint Builder', icon: ClipboardList, path: '/app/assessment/blueprints', permission: 'assessment.blueprint.view' },
            { label: 'Paper Generator', icon: Sparkles, path: '/app/assessment/papers', permission: 'assessment.paper.preview' },
            { label: 'Evaluation Desk', icon: CheckSquare, path: '/app/assessment/evaluation', permission: 'assessment.evaluation.view' },
            { label: 'Results Center', icon: GraduationCap, path: '/app/assessment/results', permission: 'assessment.result.view' },
            { label: 'Analytics Desk', icon: BarChart3, path: '/app/assessment/analytics', permission: 'assessment.analytics.view' },
            { label: 'Academic Records', icon: Award, path: '/app/academic-records', permission: 'academic.records.view' },
            { label: 'Attendance Desk', icon: Clock, path: '/app/attendance', permission: 'attendance.view' }
        ]
    },
    // EXAMINATION CELL
    {
        label: 'Examination Cell',
        permission: 'exam.dashboard.view',
        module: 'exam',
        items: [
            { label: 'Overview', icon: LayoutDashboard, path: '/app/exam-admin/dashboard', permission: 'exam.dashboard.view' },
            { label: 'Timetable', icon: Calendar, path: '/app/exam-admin/timetable', permission: 'exam.dashboard.view' },
            { label: 'Seating', icon: Users, path: '/app/exam-admin/seating', permission: 'exam.dashboard.view' },
            { label: 'Question Papers', icon: ClipboardList, path: '/app/exam-admin/question-papers', permission: 'exam.dashboard.view' },
            { label: 'Results', icon: GraduationCap, path: '/app/exam-admin/results', permission: 'exam.dashboard.view' },
            { label: 'Analytics', icon: BarChart3, path: '/app/exam-admin/analytics', permission: 'exam.dashboard.view' },
            { label: 'Exam Management', icon: FileText, path: '/app/exam-admin/manage', permission: 'exam.dashboard.view' }
        ]
    },
    // HUMAN RESOURCES
    {
        label: 'Human Resources',
        permission: 'admin.dashboard.view',
        module: 'admin',
        items: [
            { label: 'Faculty Management', icon: GraduationCap, path: '/app/academic/faculty', permission: 'FACULTY_PROFILE_MANAGE' },
            { label: 'Staff Management', icon: Briefcase, path: '/app/admin/staff', permission: 'STAFF_PROFILE_MANAGE' }
        ]
    },
    // ADMINISTRATION
    {
        label: 'Administration',
        permission: 'admin.dashboard.view',
        module: 'admin',
        items: [
            { label: 'Admissions', icon: ClipboardList, path: '/app/admissions/review', permission: 'admission.review' },
            { label: 'Student Management', icon: Users, path: '/app/students', permission: 'STUDENT_VIEW' },
            { label: 'Academic Setup', icon: GraduationCap, path: '/app/academic/classes', permission: 'CLASS_VIEW' },
            { label: 'Departments', icon: Building, path: '/app/academic/departments', permission: 'DEPARTMENT_VIEW' },
            { label: 'Subject Management', icon: BookOpen, path: '/app/academic/subjects', permission: 'SUBJECT_VIEW' },
            { label: 'Attendance Dashboard', icon: BarChart3, path: '/app/attendance/admin/dashboard', permission: 'DASHBOARD_VIEW_ADMIN' },
            { label: 'System Settings', icon: Settings, path: '/app/settings', permission: 'admin.dashboard.view' }
        ]
    },
    // FINANCES (ADMIN/OFFICER VIEW)
    {
        label: 'Finances',
        permission: 'fees.dashboard.view',
        module: 'finance',
        items: [
            { label: 'Finance Dashboard', icon: LayoutDashboard, path: '/app/finance/dashboard', permission: 'fees.view' },
            { label: 'Fee Structures', icon: Coins, path: '/app/finance/structures', permission: 'fees.structure.manage' },
            { label: 'Fee Demands', icon: FileText, path: '/app/finance/demands', permission: 'fees.demand.view' },
            { label: 'Payment Queue', icon: Coins, path: '/app/finance/payments', permission: 'fees.payment.collect' },
            { label: 'Student Ledger', icon: FileText, path: '/app/finance/ledger', permission: 'fees.view' },
            { label: 'Transport Setup', icon: Bus, path: '/app/transport/setup', permission: 'TRANSPORT_SETUP' }
        ]
    },
    // TOOLS & UTILITIES
    {
        label: 'Tools & Utilities',
        permission: 'admin.dashboard.view',
        module: 'admin',
        items: [
            { label: 'Import History', icon: ClipboardList, path: '/app/import/history', permission: 'admin.dashboard.view' }
        ]
    },
    // FACULTY PORTAL
    {
        label: 'Faculty Portal',
        permission: 'faculty.dashboard.view',
        module: 'faculty',
        items: [
            { label: 'Overview', icon: LayoutDashboard, path: '/app/dashboard', permission: 'faculty.dashboard.view' },
            { label: 'Classes', icon: GraduationCap, path: '/app/academic/classes', permission: 'CLASS_VIEW' },
            { label: 'My Students', icon: Users, path: '/app/academic/my-students', permission: 'SECTION_VIEW' },
            { label: 'My Assignments', icon: BookOpen, path: '/app/academic/assignments', permission: 'SECTION_VIEW' },
            { label: 'Exam Dashboard', icon: FileText, path: '/app/faculty/exams/dashboard', permission: 'EXAM_VIEW' },
            { label: 'My Invigilations', icon: Calendar, path: '/app/faculty/exams/invigilation', permission: 'EXAM_VIEW' },
            { label: 'Time Table', icon: Clock, path: '/app/timetable/manage', permission: 'TIMETABLE_CREATE' },
            { label: 'Attendance', icon: Calendar, path: '/app/attendance/mark', permission: 'ATTENDANCE_MARK' }
        ]
    },
    // STUDENT PORTAL
    {
        label: 'Student Portal',
        permission: 'student.dashboard.view',
        module: 'student',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/app/student/dashboard', permission: 'student.dashboard.view' },
            { label: 'My Profile', icon: UserCircle, path: '/app/profile', permission: 'student.dashboard.view' },
            { label: 'Assignments', icon: ClipboardList, path: '/app/student/assignments', permission: 'STUDENT_VIEW_SELF' },
            { label: 'Academic History', icon: History, path: '/app/student/academic-history', permission: 'STUDENT_VIEW_SELF' },
            { label: 'My Timetable', icon: Clock, path: '/app/timetable/my', permission: 'TIMETABLE_VIEW_SELF' },
            { label: 'Results', icon: GraduationCap, path: '/app/student/exams/dashboard', permission: 'STUDENT_VIEW_SELF' },
            { label: 'My Attendance', icon: Calendar, path: '/app/attendance/my', permission: 'ATTENDANCE_VIEW_SELF' },
            { label: 'My Fees', icon: Coins, path: '/app/fees/my', permission: 'PAYMENT_VIEW_SELF' },
            { label: 'My Transport', icon: Bus, path: '/app/transport/my', permission: 'TRANSPORT_VIEW_SELF' }
        ]
    },
    // PARENT PORTAL
    {
        label: 'Parent Portal',
        permission: 'parent.dashboard.view',
        module: 'parent',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/app/admissions/my', permission: 'parent.dashboard.view' },
            { label: 'My Admission', icon: ClipboardList, path: '/app/admissions/my', permission: 'admission.view_own' },
            { label: 'My Children', icon: Users, path: '/app/students/my-children', permission: 'STUDENT_VIEW_SELF' },
            { label: 'Children Attendance', icon: Calendar, path: '/app/attendance/my', permission: 'ATTENDANCE_VIEW_SELF' },
            { label: 'Children Academics', icon: History, path: '/app/student/academic-history', permission: 'STUDENT_VIEW_SELF' },
            { label: 'Children Results', icon: GraduationCap, path: '/app/student/exams/dashboard', permission: 'STUDENT_VIEW_SELF' },
            { label: 'Fees & Payments', icon: Coins, path: '/app/fees/my', permission: 'PAYMENT_VIEW_SELF' },
            { label: 'Transport Details', icon: Bus, path: '/app/transport/my', permission: 'TRANSPORT_VIEW_SELF' },
            { label: 'My Profile', icon: UserCircle, path: '/app/profile', permission: 'parent.dashboard.view' }
        ]
    },
    // TRANSPORT REGISTRY
    {
        label: 'Transport Setup',
        permission: 'transport.dashboard.view',
        module: 'transport',
        items: [
            { label: 'Routes', icon: MapPin, path: '/app/transport/setup#routes', permission: 'TRANSPORT_SETUP' },
            { label: 'Stops & Points', icon: Settings, path: '/app/transport/setup#stops', permission: 'TRANSPORT_SETUP' },
            { label: 'Vehicle Fleet', icon: Bus, path: '/app/transport/setup#vehicles', permission: 'TRANSPORT_SETUP' },
            { label: 'Driver Registry', icon: User, path: '/app/transport/setup#drivers', permission: 'TRANSPORT_SETUP' },
            { label: 'Fees', icon: DollarSign, path: '/app/transport/setup#fees', permission: 'TRANSPORT_SETUP' }
        ]
    },
    {
        label: 'Transport Operations',
        permission: 'transport.dashboard.view',
        module: 'transport',
        items: [
            { label: 'Overview', icon: LayoutDashboard, path: '/app/transport/overview', permission: 'TRIP_MONITOR' },
            { label: 'Live Trip Monitor', icon: Activity, path: '/app/transport/monitor', permission: 'TRIP_MONITOR' },
            { label: 'Print Manifests', icon: FileText, path: '/app/transport/manifests', permission: 'TRIP_MONITOR' },
            { label: 'Start Incident', icon: AlertOctagon, path: '/app/transport/incidents', permission: 'TRIP_MONITOR' },
            { label: 'Analytics', icon: BarChart3, path: '/app/transport/analytics', permission: 'TRIP_MONITOR' },
            { label: 'Student Assignment', icon: Users, path: '/app/transport/assign', permission: 'TRANSPORT_SETUP' },
            { label: 'Bulk Assignment', icon: ClipboardList, path: '/app/transport/bulk-assign', permission: 'TRANSPORT_SETUP' },
            { label: 'Debug Info', icon: ShieldCheck, path: '/app/transport/debug', permission: 'TRANSPORT_SETUP' }
        ]
    },
    // DRIVER CONSOLE
    {
        label: 'Driver Console',
        permission: 'driver.dashboard.view',
        module: 'driver',
        items: [
            { label: 'My Trips', icon: Bus, path: '/app/transport/driver', permission: 'driver.dashboard.view' },
            { label: 'My Profile', icon: UserCircle, path: '/app/profile', permission: 'driver.dashboard.view' }
        ]
    },
    // RECEPTIONIST DESK
    {
        label: 'Reception Desk',
        permission: 'admission.visitors.manage',
        module: 'admission',
        items: [
            { label: 'Walk-ins Log', icon: Users, path: '/app/admissions/inquiries', permission: 'admission.visitors.manage' },
            { label: 'New Inquiry', icon: FileText, path: '/app/admissions/inquiries#new', permission: 'admission.visitors.manage' }
        ]
    },
    // COUNSELOR DESK
    {
        label: 'Counseling Desk',
        permission: 'admission.leads.manage',
        module: 'admission',
        items: [
            { label: 'Assigned Leads', icon: ClipboardList, path: '/app/admissions/inquiries', permission: 'admission.leads.manage' },
            { label: 'Follow-up Scheduler', icon: Calendar, path: '/app/admissions/inquiries#calls', permission: 'admission.leads.manage' }
        ]
    },
    // ADMISSIONS DESK
    {
        label: 'Admissions Desk',
        permission: 'admission.dashboard.view',
        module: 'admission',
        items: [
            { label: 'Dashboard Summary', icon: LayoutDashboard, path: '/app/admissions/dashboard', permission: 'admission.review' },
            { label: 'All Applications', icon: FileText, path: '/app/admissions/review', permission: 'admission.review' },
            { label: 'My Queue & Tasks', icon: Clock, path: '/app/admissions/queues', permission: 'admission.review' },
            { label: 'Documents Verification', icon: ShieldCheck, path: '/app/admissions/verification', permission: 'admission.review' },
            { label: 'Interview Center', icon: Users, path: '/app/admissions/interviews', permission: 'admission.review' },
            { label: 'Merit Selection', icon: Award, path: '/app/admissions/merit', permission: 'admission.review' },
            { label: 'Offer Letters', icon: FileText, path: '/app/admissions/offers', permission: 'admission.review' },
            { label: 'Finance & Billing', icon: DollarSign, path: '/app/admissions/fees', permission: 'admission.review' },
            { label: 'SIS Enrollment', icon: GraduationCap, path: '/app/admissions/enrollment', permission: 'admission.review' },
            { label: 'Reports & Analytics', icon: BarChart3, path: '/app/admissions/reports', permission: 'admission.review' },
            { label: 'Workspace Settings', icon: Settings, path: '/app/admissions/settings', permission: 'admission.review' }
        ]
    },
    // EXAM CELL DESK
    {
        label: 'Exam Cell Desk',
        permission: 'exam.dashboard.view',
        module: 'exam',
        items: [
            { label: 'Entrance Exams', icon: Calendar, path: '/app/admissions/exams', permission: 'admission.exam.manage' },
            { label: 'Interviews Panel', icon: Users, path: '/app/admissions/interviews', permission: 'admission.interview.manage' },
            { label: 'Merit List Desk', icon: FileText, path: '/app/admissions/merit', permission: 'admission.merit.generate' },
            { label: 'Offer Dispatch Desk', icon: GraduationCap, path: '/app/admissions/offers', permission: 'admission.merit.generate' }
        ]
    },
    // PRINCIPAL DESK
    {
        label: 'Principal Desk',
        permission: 'admin.dashboard.view',
        module: 'admin',
        items: [
            { label: 'Merit Approvals', icon: ShieldCheck, path: '/app/admissions/merit', permission: 'admission.approve' },
            { label: 'Offer Dispatch Approvals', icon: FileText, path: '/app/admissions/offers', permission: 'admission.approve' },
            { label: 'Admissions Funnel', icon: BarChart3, path: '/app/admissions/analytics', permission: 'admission.approve' }
        ]
    },
    // FINANCE DESK
    {
        label: 'Finance Desk',
        permission: 'fees.dashboard.view',
        module: 'finance',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/app/finance/dashboard', permission: 'fees.view' },
            { label: 'Fee Structures', icon: Coins, path: '/app/finance/structures', permission: 'fees.structure.manage' },
            { label: 'Fee Demands', icon: FileText, path: '/app/finance/demands', permission: 'fees.demand.view' },
            { label: 'Payment Queue', icon: Coins, path: '/app/finance/payments', permission: 'fees.payment.collect' },
            { label: 'Student Ledger', icon: BookOpen, path: '/app/finance/ledger', permission: 'fees.view' },
            { label: 'Receipt Center', icon: Receipt, path: '/app/finance/receipts', permission: 'fees.view' },
            { label: 'Waivers', icon: ShieldCheck, path: '/app/finance/waivers', permission: 'fees.waiver.approve' },
            { label: 'Refunds', icon: RefreshCw, path: '/app/finance/refunds', permission: 'fees.refund.process' },
            { label: 'Reports', icon: BarChart3, path: '/app/finance/reports', permission: 'fees.view' },
            { label: 'Settings', icon: Settings, path: '/app/finance/settings', permission: 'fees.structure.manage' }
        ]
    }
];
