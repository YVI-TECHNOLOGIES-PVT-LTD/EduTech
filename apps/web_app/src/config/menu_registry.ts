import {
  LayoutDashboard,
  Users,
  ClipboardList,
  GraduationCap,
  FileText,
  Settings,
  Building,
  Coins,
  UserCircle,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Clock,
  Calendar,
  Award,
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
    items: [{ label: 'Overview', icon: LayoutDashboard, path: '/app/admin/dashboard' }],
  },
  // ADMINISTRATION
  {
    label: 'Administration',
    permission: 'admin.dashboard.view',
    module: 'admin',
    items: [
      {
        label: 'Admissions Desk',
        icon: ClipboardList,
        path: '/app/admissions/review',
        permission: 'admission.review',
      },
      {
        label: 'System Settings',
        icon: Settings,
        path: '/app/settings',
        permission: 'admin.dashboard.view',
      },
    ],
  },
  // TOOLS & UTILITIES
  {
    label: 'Tools & Utilities',
    permission: 'admin.dashboard.view',
    module: 'admin',
    items: [
      {
        label: 'Import History',
        icon: ClipboardList,
        path: '/app/import/history',
        permission: 'admin.dashboard.view',
      },
    ],
  },
  // RECEPTIONIST DESK
  {
    label: 'Reception Desk',
    permission: 'admission.visitors.manage',
    module: 'admission',
    items: [
      {
        label: 'Walk-ins Log',
        icon: Users,
        path: '/app/admissions/inquiries',
        permission: 'admission.visitors.manage',
      },
      {
        label: 'New Inquiry',
        icon: FileText,
        path: '/app/admissions/inquiries#new',
        permission: 'admission.visitors.manage',
      },
    ],
  },
  // COUNSELOR DESK
  {
    label: 'Counseling Desk',
    permission: 'admission.leads.manage',
    module: 'admission',
    items: [
      {
        label: 'Assigned Leads',
        icon: ClipboardList,
        path: '/app/admissions/inquiries',
        permission: 'admission.leads.manage',
      },
      {
        label: 'Follow-up Scheduler',
        icon: Calendar,
        path: '/app/admissions/inquiries#calls',
        permission: 'admission.leads.manage',
      },
    ],
  },
  // ADMISSIONS DESK
  {
    label: 'Admissions Desk',
    permission: 'admission.dashboard.view',
    module: 'admission',
    items: [
      {
        label: 'Dashboard Summary',
        icon: LayoutDashboard,
        path: '/app/admissions/dashboard',
        permission: 'admission.review',
      },
      {
        label: 'All Applications',
        icon: FileText,
        path: '/app/admissions/review',
        permission: 'admission.review',
      },
      {
        label: 'My Queue & Tasks',
        icon: Clock,
        path: '/app/admissions/queues',
        permission: 'admission.review',
      },
      {
        label: 'Documents Verification',
        icon: ShieldCheck,
        path: '/app/admissions/verification',
        permission: 'admission.review',
      },
      {
        label: 'Interview Center',
        icon: Users,
        path: '/app/admissions/interviews',
        permission: 'admission.review',
      },
      {
        label: 'Merit Selection',
        icon: Award,
        path: '/app/admissions/merit',
        permission: 'admission.review',
      },
      {
        label: 'Offer Letters',
        icon: FileText,
        path: '/app/admissions/offers',
        permission: 'admission.review',
      },
      {
        label: 'Finance & Billing',
        icon: DollarSign,
        path: '/app/admissions/fees',
        permission: 'admission.review',
      },
      {
        label: 'SIS Enrollment',
        icon: GraduationCap,
        path: '/app/admissions/enrollment',
        permission: 'admission.review',
      },
      {
        label: 'Reports & Analytics',
        icon: BarChart3,
        path: '/app/admissions/reports',
        permission: 'admission.review',
      },
      {
        label: 'Workspace Settings',
        icon: Settings,
        path: '/app/admissions/settings',
        permission: 'admission.review',
      },
    ],
  },
  // PRINCIPAL DESK
  {
    label: 'Principal Desk',
    permission: 'admin.dashboard.view',
    module: 'admin',
    items: [
      {
        label: 'Merit Approvals',
        icon: ShieldCheck,
        path: '/app/admissions/merit',
        permission: 'admission.approve',
      },
      {
        label: 'Offer Dispatch Approvals',
        icon: FileText,
        path: '/app/admissions/offers',
        permission: 'admission.approve',
      },
      {
        label: 'Admissions Funnel',
        icon: BarChart3,
        path: '/app/admissions/analytics',
        permission: 'admission.approve',
      },
    ],
  },
];
