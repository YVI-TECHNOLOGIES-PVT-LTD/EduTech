/**
 * EduTrack ERP — Module Registry
 * Core module definitions for Stage-1 active modules and future Stage-2 expansion placeholders.
 */

export interface SystemModule {
  id: string;
  name: string;
  category: 'core' | 'operations' | 'expansion';
  description: string;
  permission: string;
  route: string;
  priority: number;
  isStage1Active: boolean;
}

export const SYSTEM_MODULE_REGISTRY: SystemModule[] = [
  // Active Stage-1 Modules
  {
    id: 'CORE_PLATFORM',
    name: 'Core Platform',
    category: 'core',
    description: 'Authentication, organization isolation, workspace shell, and security.',
    permission: 'admin.dashboard.view',
    route: '/app/dashboard',
    priority: 100,
    isStage1Active: true,
  },
  {
    id: 'ADMISSIONS',
    name: 'Admissions Desk',
    category: 'operations',
    description:
      'End-to-end lead management, inquiry, application processing, documents, fees, and enrollment.',
    permission: 'admission.dashboard.view',
    route: '/app/admissions/dashboard',
    priority: 90,
    isStage1Active: true,
  },
  {
    id: 'PEOPLE',
    name: 'People Directory',
    category: 'operations',
    description: 'Student directory, parent directory, staff profiles, and user management.',
    permission: 'STUDENT_VIEW',
    route: '/app/people',
    priority: 80,
    isStage1Active: true,
  },
  {
    id: 'ACADEMICS',
    name: 'Academic Structure',
    category: 'operations',
    description: 'Academic sessions, class setup, and section capacity.',
    permission: 'ACADEMIC_SETUP',
    route: '/app/school',
    priority: 70,
    isStage1Active: true,
  },
  {
    id: 'ADMINISTRATION',
    name: 'System Administration',
    category: 'core',
    description:
      'Organization settings, System Role Templates, feature packages, and sequence numbers.',
    permission: 'admin.dashboard.view',
    route: '/app/settings',
    priority: 60,
    isStage1Active: true,
  },

  // Future Stage-2 Module Expansion Placeholders
  {
    id: 'TRANSPORT',
    name: 'Transport Management',
    category: 'expansion',
    description: 'Vehicle routing, trip monitoring, and driver allocation.',
    permission: 'TRANSPORT_VIEW',
    route: '/app/transport',
    priority: 50,
    isStage1Active: false,
  },
  {
    id: 'ATTENDANCE',
    name: 'Attendance Management',
    category: 'expansion',
    description: 'Daily student and staff attendance tracking.',
    permission: 'ATTENDANCE_VIEW',
    route: '/app/attendance',
    priority: 40,
    isStage1Active: false,
  },
  {
    id: 'EXAMS',
    name: 'Examination Platform',
    category: 'expansion',
    description: 'Exam scheduling, question banks, and gradebook management.',
    permission: 'EXAM_VIEW',
    route: '/app/exams',
    priority: 35,
    isStage1Active: false,
  },
  {
    id: 'FINANCE',
    name: 'General Finance & Payroll',
    category: 'expansion',
    description: 'Accounting ledgers, vendor payments, and staff payroll.',
    permission: 'fees.view',
    route: '/app/finance',
    priority: 30,
    isStage1Active: false,
  },
  {
    id: 'LIBRARY',
    name: 'Library Management',
    category: 'expansion',
    description: 'Book cataloging, issues, and returns.',
    permission: 'admin.dashboard.view',
    route: '/app/library',
    priority: 25,
    isStage1Active: false,
  },
  {
    id: 'HOSTEL',
    name: 'Hostel & Housing',
    category: 'expansion',
    description: 'Dormitory allocation and meal management.',
    permission: 'admin.dashboard.view',
    route: '/app/hostel',
    priority: 20,
    isStage1Active: false,
  },
  {
    id: 'INVENTORY',
    name: 'Inventory & Assets',
    category: 'expansion',
    description: 'Asset tracking, store requisitions, and inventory audits.',
    permission: 'admin.dashboard.view',
    route: '/app/inventory',
    priority: 15,
    isStage1Active: false,
  },
  {
    id: 'COMMUNICATION',
    name: 'Communications Hub',
    category: 'expansion',
    description: 'Broadcast SMS, email notices, and parent notification center.',
    permission: 'admin.dashboard.view',
    route: '/app/communication',
    priority: 10,
    isStage1Active: false,
  },
];
