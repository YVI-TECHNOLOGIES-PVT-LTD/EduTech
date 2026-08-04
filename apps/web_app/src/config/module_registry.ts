export interface ErpModule {
    id: string;
    name: string;
    permission: string;
    route: string;
    priority: number;
}

export const MODULE_REGISTRY: ErpModule[] = [
    { id: 'admin', name: 'Administration', permission: 'admin.dashboard.view', route: '/app/admin/dashboard', priority: 100 },
    { id: 'assessment', name: 'Assessment Platform', permission: 'assessment.dashboard.view', route: '/app/assessment/dashboard', priority: 90 },
    { id: 'exam', name: 'Examination Cell', permission: 'exam.dashboard.view', route: '/app/exam-admin/dashboard', priority: 80 },
    { id: 'finance', name: 'Finance & Fees', permission: 'fees.dashboard.view', route: '/app/finance/dashboard', priority: 70 },
    { id: 'admission', name: 'Admissions Desk', permission: 'admission.dashboard.view', route: '/app/admissions/dashboard', priority: 60 },
    { id: 'transport', name: 'Transport & Fleet', permission: 'transport.dashboard.view', route: '/app/transport/overview', priority: 50 },
    { id: 'faculty', name: 'Faculty Portal', permission: 'faculty.dashboard.view', route: '/app/dashboard', priority: 40 },
    { id: 'student', name: 'Student Portal', permission: 'student.dashboard.view', route: '/app/student/dashboard', priority: 30 },
    { id: 'parent', name: 'Parent Portal', permission: 'parent.dashboard.view', route: '/app/admissions/my', priority: 20 },
    { id: 'driver', name: 'Driver Portal', permission: 'driver.dashboard.view', route: '/app/transport/driver', priority: 10 }
];
