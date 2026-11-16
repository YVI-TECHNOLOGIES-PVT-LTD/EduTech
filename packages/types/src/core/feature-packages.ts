/**
 * EduTrack ERP — Feature Package Architecture
 * Scalable domain package registry designed for Stage-1 foundation and future Stage-2 evolution.
 */

export enum FeaturePackageId {
  CORE_PLATFORM = 'CORE_PLATFORM',
  ADMISSIONS = 'ADMISSIONS',
  PEOPLE = 'PEOPLE',
  ACADEMICS = 'ACADEMICS',
  ADMINISTRATION = 'ADMINISTRATION',

  // Stage-2 Expansion Packages (Prepared Skeletons)
  TRANSPORT = 'TRANSPORT',
  ATTENDANCE = 'ATTENDANCE',
  EXAMS = 'EXAMS',
  FINANCE = 'FINANCE',
  LIBRARY = 'LIBRARY',
  HOSTEL = 'HOSTEL',
  INVENTORY = 'INVENTORY',
  COMMUNICATION = 'COMMUNICATION',
}

export interface FeaturePackage {
  id: FeaturePackageId;
  name: string;
  category: 'core' | 'operations' | 'expansion';
  description: string;
  requiredPermissions: string[];
  isStage1Active: boolean;
}

export const FEATURE_PACKAGES: Record<FeaturePackageId, FeaturePackage> = {
  [FeaturePackageId.CORE_PLATFORM]: {
    id: FeaturePackageId.CORE_PLATFORM,
    name: 'Core Platform',
    category: 'core',
    description: 'Authentication, organization isolation, workspace shell, and capability engine.',
    requiredPermissions: ['admin.dashboard.view'],
    isStage1Active: true,
  },
  [FeaturePackageId.ADMISSIONS]: {
    id: FeaturePackageId.ADMISSIONS,
    name: 'Admissions Desk',
    category: 'operations',
    description:
      'End-to-end lead management, inquiry logging, application processing, document verification, entrance assessment, fee collection, and enrollment.',
    requiredPermissions: ['admission.review', 'admission.view_all'],
    isStage1Active: true,
  },
  [FeaturePackageId.PEOPLE]: {
    id: FeaturePackageId.PEOPLE,
    name: 'People Directory',
    category: 'operations',
    description:
      'Student directory, parent directory, staff profiles, and user account management.',
    requiredPermissions: ['STUDENT_VIEW', 'STAFF_PROFILE_MANAGE', 'manage_users'],
    isStage1Active: true,
  },
  [FeaturePackageId.ACADEMICS]: {
    id: FeaturePackageId.ACADEMICS,
    name: 'Academic Structure',
    category: 'operations',
    description: 'Academic year setup, classes, section capacity, and subject mapping.',
    requiredPermissions: ['ACADEMIC_SETUP'],
    isStage1Active: true,
  },
  [FeaturePackageId.ADMINISTRATION]: {
    id: FeaturePackageId.ADMINISTRATION,
    name: 'System Administration',
    category: 'core',
    description:
      'Security policies, user roles, system templates, sequences, and bulk import operations.',
    requiredPermissions: ['admin.dashboard.view', 'manage_users'],
    isStage1Active: true,
  },

  // Future Stage-2 Package Skeletons
  [FeaturePackageId.TRANSPORT]: {
    id: FeaturePackageId.TRANSPORT,
    name: 'Transport Management',
    category: 'expansion',
    description: 'Vehicle routing, trip monitoring, and driver allocation.',
    requiredPermissions: ['TRANSPORT_VIEW'],
    isStage1Active: false,
  },
  [FeaturePackageId.ATTENDANCE]: {
    id: FeaturePackageId.ATTENDANCE,
    name: 'Attendance Management',
    category: 'expansion',
    description: 'Daily student and staff attendance tracking.',
    requiredPermissions: ['ATTENDANCE_VIEW'],
    isStage1Active: false,
  },
  [FeaturePackageId.EXAMS]: {
    id: FeaturePackageId.EXAMS,
    name: 'Examination Platform',
    category: 'expansion',
    description: 'Exam scheduling, question banks, and gradebook management.',
    requiredPermissions: ['EXAM_VIEW'],
    isStage1Active: false,
  },
  [FeaturePackageId.FINANCE]: {
    id: FeaturePackageId.FINANCE,
    name: 'General Finance & Payroll',
    category: 'expansion',
    description: 'Accounting ledgers, vendor payments, and staff payroll.',
    requiredPermissions: ['fees.view'],
    isStage1Active: false,
  },
  [FeaturePackageId.LIBRARY]: {
    id: FeaturePackageId.LIBRARY,
    name: 'Library Management',
    category: 'expansion',
    description: 'Book cataloging, issues, and returns.',
    requiredPermissions: ['admin.dashboard.view'],
    isStage1Active: false,
  },
  [FeaturePackageId.HOSTEL]: {
    id: FeaturePackageId.HOSTEL,
    name: 'Hostel & Housing',
    category: 'expansion',
    description: 'Dormitory allocation and meal management.',
    requiredPermissions: ['admin.dashboard.view'],
    isStage1Active: false,
  },
  [FeaturePackageId.INVENTORY]: {
    id: FeaturePackageId.INVENTORY,
    name: 'Inventory & Assets',
    category: 'expansion',
    description: 'Asset tracking, store requisitions, and inventory audits.',
    requiredPermissions: ['admin.dashboard.view'],
    isStage1Active: false,
  },
  [FeaturePackageId.COMMUNICATION]: {
    id: FeaturePackageId.COMMUNICATION,
    name: 'Communications Hub',
    category: 'expansion',
    description: 'Broadcast SMS, email notices, and parent notification center.',
    requiredPermissions: ['admin.dashboard.view'],
    isStage1Active: false,
  },
};
