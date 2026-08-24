import { MODULE_REGISTRY, ModuleDefinition } from './modules';

export interface NavItem {
  title: string;
  path: string;
  icon: any;
  permission?: string;
  badge?: string;
  children?: NavItem[];
}

export interface NavSection {
  sectionTitle: string;
  items: NavItem[];
}

export const getSidebarNavigation = (): NavSection[] => {
  return [
    {
      sectionTitle: 'Main Menu',
      items: [
        {
          title: 'Dashboard',
          path: '/app/dashboard',
          icon: MODULE_REGISTRY.find((m) => m.id === 'dashboard')?.icon,
        },
      ],
    },
    {
      sectionTitle: 'Stage-1 Core Lifecycle',
      items: [
        {
          title: 'CRM & Leads',
          path: '/app/crm/leads',
          icon: MODULE_REGISTRY.find((m) => m.id === 'crm')?.icon,
          permission: 'lead:read',
          children: [
            { title: 'Leads Pipeline', path: '/app/crm/leads', icon: null },
            { title: 'Campus Visits', path: '/app/crm/campus-visits', icon: null },
          ],
        },
        {
          title: 'Admissions',
          path: '/app/admissions/applications',
          icon: MODULE_REGISTRY.find((m) => m.id === 'admissions')?.icon,
          permission: 'application:read',
          children: [
            { title: 'Enquiries & Leads', path: '/app/admissions/inquiries', icon: null },
            { title: 'Counselling', path: '/app/admissions/counselling', icon: null },
            { title: 'Applications', path: '/app/admissions/applications', icon: null },
            { title: 'Document Verification', path: '/app/admissions/verification', icon: null },
            { title: 'Fee Collection', path: '/app/admissions/fees', icon: null },
            { title: 'Campus Visits & Interviews', path: '/app/admissions/interviews', icon: null },
            { title: 'Entrance Exams', path: '/app/admissions/exams', icon: null },
            { title: 'Admission Decisions', path: '/app/admissions/decisions', icon: null },
          ],
        },
        {
          title: 'Students & Enrollment',
          path: '/app/students/directory',
          icon: MODULE_REGISTRY.find((m) => m.id === 'students')?.icon,
          permission: 'student:read',
          children: [
            { title: 'Student Directory', path: '/app/students/directory', icon: null },
            { title: 'Parents Directory', path: '/app/students/parents', icon: null },
            { title: 'Stage-1 Enrollment', path: '/app/students/enrollment', icon: null },
          ],
        },
      ],
    },
    {
      sectionTitle: 'Administration & Setup',
      items: [
        {
          title: 'Organization',
          path: '/app/organization',
          icon: MODULE_REGISTRY.find((m) => m.id === 'organization')?.icon,
          permission: 'organization:read',
        },
        {
          title: 'Users & Roles',
          path: '/app/users',
          icon: MODULE_REGISTRY.find((m) => m.id === 'users')?.icon,
          permission: 'user:read',
          children: [
            { title: 'Users Directory', path: '/app/users', icon: null },
            { title: 'Role Matrix', path: '/app/roles', icon: null },
          ],
        },
        {
          title: 'HR & Staff',
          path: '/app/hr/staff',
          icon: MODULE_REGISTRY.find((m) => m.id === 'hr')?.icon,
          permission: 'staff:read',
          children: [
            { title: 'Staff Directory', path: '/app/hr/staff', icon: null },
            { title: 'Departments', path: '/app/hr/departments', icon: null },
            { title: 'Designations', path: '/app/hr/designations', icon: null },
          ],
        },
        {
          title: 'Academics Setup',
          path: '/app/academics/years',
          icon: MODULE_REGISTRY.find((m) => m.id === 'academics')?.icon,
          permission: 'academic_year:read',
          children: [
            { title: 'Academic Years', path: '/app/academics/years', icon: null },
            { title: 'Grades / Classes', path: '/app/academics/grades', icon: null },
            { title: 'Sections', path: '/app/academics/sections', icon: null },
          ],
        },
      ],
    },
    {
      sectionTitle: 'System & Analytics',
      items: [
        {
          title: 'Reports & Analytics',
          path: '/app/reports',
          icon: MODULE_REGISTRY.find((m) => m.id === 'reports')?.icon,
          permission: 'reports:view',
        },
        {
          title: 'Audit Trail',
          path: '/app/audit',
          icon: MODULE_REGISTRY.find((m) => m.id === 'audit')?.icon,
          permission: 'audit:read',
        },
        {
          title: 'System Settings',
          path: '/app/settings',
          icon: MODULE_REGISTRY.find((m) => m.id === 'settings')?.icon,
          permission: 'settings:read',
        },
      ],
    },
  ];
};
