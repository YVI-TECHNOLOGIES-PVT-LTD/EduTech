/**
 * EduTrack ERP — Metadata Driven Menu Registry
 * Central metadata navigation configuration for School Operations Workspace and Parent Portal.
 */

import { MenuGroup, MenuItem, NavigationRegistry } from './navigation-types';

export const WORKSPACE_MENU_GROUPS: MenuGroup[] = [
  {
    id: 'grp_dashboard',
    title: 'Workspace',
    featurePackage: 'CORE_PLATFORM',
    items: [
      {
        id: 'menu_dashboard',
        title: 'Operational Dashboard',
        route: '/app/dashboard',
        icon: 'LayoutDashboard',
        featurePackage: 'CORE_PLATFORM',
        permission: 'admin.dashboard.view',
      },
    ],
  },
  {
    id: 'grp_admissions',
    title: 'Admissions Desk',
    featurePackage: 'ADMISSIONS',
    items: [
      {
        id: 'menu_admissions_overview',
        title: 'Overview & Queues',
        route: '/app/admissions/dashboard',
        icon: 'BarChart3',
        featurePackage: 'ADMISSIONS',
        permission: 'admission.review',
        defaultRoute: '/app/admissions/dashboard',
        children: [
          {
            id: 'menu_admissions_leads',
            title: 'Leads & Inquiries',
            route: '/app/admissions/inquiries',
            icon: 'Users',
            featurePackage: 'ADMISSIONS',
            permission: 'admission.enquiry.view',
          },
          {
            id: 'menu_admissions_new_app',
            title: 'New Application',
            route: '/app/admissions/wizard',
            icon: 'FileText',
            featurePackage: 'ADMISSIONS',
            permission: 'admission.create',
          },
          {
            id: 'menu_admissions_verification',
            title: 'Document Verification',
            route: '/app/admissions/verification',
            icon: 'ShieldCheck',
            featurePackage: 'ADMISSIONS',
            permission: 'admission.review',
          },
          {
            id: 'menu_admissions_exams',
            title: 'Entrance Exams',
            route: '/app/admissions/exams',
            icon: 'BookOpen',
            featurePackage: 'ADMISSIONS',
            permission: 'admission.review',
          },
          {
            id: 'menu_admissions_fees',
            title: 'Fee Collection',
            route: '/app/admissions/fees',
            icon: 'Coins',
            featurePackage: 'ADMISSIONS',
            permission: 'fees.payment.collect',
          },
          {
            id: 'menu_admissions_enrollment',
            title: 'Enrollment Desk',
            route: '/app/admissions/enrollment',
            icon: 'GraduationCap',
            featurePackage: 'ADMISSIONS',
            permission: 'admission.enrol',
          },
        ],
      },
    ],
  },
  {
    id: 'grp_people',
    title: 'People Directory',
    featurePackage: 'PEOPLE',
    items: [
      {
        id: 'menu_people_directory',
        title: 'People',
        route: '/app/people',
        icon: 'Users',
        featurePackage: 'PEOPLE',
        permission: 'STUDENT_VIEW',
        defaultRoute: '/app/people',
        children: [
          {
            id: 'menu_students_dir',
            title: 'Students Directory',
            route: '/app/people/students',
            icon: 'GraduationCap',
            featurePackage: 'PEOPLE',
            permission: 'STUDENT_VIEW',
          },
          {
            id: 'menu_parents_dir',
            title: 'Parents Directory',
            route: '/app/people/parents',
            icon: 'Users',
            featurePackage: 'PEOPLE',
            permission: 'STUDENT_VIEW',
          },
          {
            id: 'menu_staff_dir',
            title: 'Staff Directory',
            route: '/app/people/staff',
            icon: 'Briefcase',
            featurePackage: 'PEOPLE',
            permission: 'STAFF_PROFILE_MANAGE',
          },
        ],
      },
    ],
  },
  {
    id: 'grp_academics',
    title: 'Academic Structure',
    featurePackage: 'ACADEMICS',
    items: [
      {
        id: 'menu_academics_admin',
        title: 'Academics',
        route: '/app/school',
        icon: 'Building',
        featurePackage: 'ACADEMICS',
        permission: 'ACADEMIC_SETUP',
        defaultRoute: '/app/school',
        children: [
          {
            id: 'menu_academic_year',
            title: 'Sessions & Classes',
            route: '/app/school/academics',
            icon: 'Building',
            featurePackage: 'ACADEMICS',
            permission: 'ACADEMIC_SETUP',
          },
          {
            id: 'menu_bulk_ops',
            title: 'Bulk Operations',
            route: '/app/admin/bulk',
            icon: 'CheckSquare',
            featurePackage: 'ADMINISTRATION',
            permission: 'admin.dashboard.view',
          },
          {
            id: 'menu_import_history',
            title: 'Import History',
            route: '/app/import/history',
            icon: 'Activity',
            featurePackage: 'ADMINISTRATION',
            permission: 'admin.dashboard.view',
          },
        ],
      },
    ],
  },
  {
    id: 'grp_settings',
    title: 'System Settings',
    featurePackage: 'ADMINISTRATION',
    items: [
      {
        id: 'menu_settings',
        title: 'Settings',
        route: '/app/settings',
        icon: 'Settings',
        permission: 'admin.dashboard.view',
        featurePackage: 'ADMINISTRATION',
        children: [
          {
            id: 'menu_settings_org',
            title: 'Organization',
            route: '/app/settings?cat=organization',
            icon: 'Building',
            featurePackage: 'ADMINISTRATION',
            permission: 'admin.dashboard.view',
          },
          {
            id: 'menu_settings_security',
            title: 'Security & Templates',
            route: '/app/settings?cat=security',
            icon: 'ShieldCheck',
            featurePackage: 'ADMINISTRATION',
            permission: 'manage_users',
          },
          {
            id: 'menu_settings_customization',
            title: 'Customization',
            route: '/app/settings?cat=customization',
            icon: 'Settings',
            featurePackage: 'ADMINISTRATION',
            permission: 'admin.dashboard.view',
          },
        ],
      },
    ],
  },
];

export const PARENT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'parent_menu_dashboard',
    title: 'Dashboard',
    route: '/app/parent/dashboard',
    icon: 'LayoutDashboard',
    permission: 'DASHBOARD_VIEW_PARENT',
  },
  {
    id: 'parent_menu_applications',
    title: 'Applications',
    route: '/app/parent/applications',
    icon: 'FileText',
    permission: 'admission.view_own',
  },
  {
    id: 'parent_menu_documents',
    title: 'Documents',
    route: '/app/parent/documents',
    icon: 'ShieldCheck',
    permission: 'admission.view_own',
  },
  {
    id: 'parent_menu_child',
    title: 'My Child',
    route: '/app/parent/my-child',
    icon: 'GraduationCap',
    permission: 'DASHBOARD_VIEW_PARENT',
  },
  {
    id: 'parent_menu_notifications',
    title: 'Notifications',
    route: '/app/parent/notifications',
    icon: 'Bell',
  },
  {
    id: 'parent_menu_profile',
    title: 'Profile',
    route: '/app/parent/profile',
    icon: 'User',
  },
];

export const SYSTEM_NAVIGATION_REGISTRY: NavigationRegistry = {
  workspace: WORKSPACE_MENU_GROUPS,
  parent: PARENT_MENU_ITEMS,
};
