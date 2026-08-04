export interface ErpModule {
  id: string;
  name: string;
  permission: string;
  route: string;
  priority: number;
}

export const MODULE_REGISTRY: ErpModule[] = [
  {
    id: 'admin',
    name: 'Administration',
    permission: 'admin.dashboard.view',
    route: '/app/admin/dashboard',
    priority: 100,
  },
  {
    id: 'fees',
    name: 'Finance & Fees',
    permission: 'fees.dashboard.view',
    route: '/app/admissions/fees',
    priority: 70,
  },
  {
    id: 'admission',
    name: 'Admissions Desk',
    permission: 'admission.dashboard.view',
    route: '/app/admissions/dashboard',
    priority: 60,
  },
  {
    id: 'student',
    name: 'Student Portal',
    permission: 'student.dashboard.view',
    route: '/app/student/dashboard',
    priority: 30,
  },
];
