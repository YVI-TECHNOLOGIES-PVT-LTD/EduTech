import {
  LucideIcon,
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Target,
  FileText,
  UserCheck,
  Settings,
  BarChart3,
  History,
} from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { PERMISSIONS } from '@/shared/constants/permissions';

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  path: string;
  permission?: string;
  stage1WorkflowStep?: number;
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Enterprise KPIs, metrics & real-time analytics',
    icon: LayoutDashboard,
    path: ROUTES.APP.DASHBOARD,
  },
  {
    id: 'organization',
    name: 'Organization Profile',
    description: 'Tenant profile, branding & settings',
    icon: Building2,
    path: ROUTES.APP.ORGANIZATION,
    permission: PERMISSIONS.ORGANIZATION_READ,
  },
  {
    id: 'users',
    name: 'Users & RBAC',
    description: 'User directory, roles & permissions matrix',
    icon: Users,
    path: ROUTES.APP.USERS,
    permission: PERMISSIONS.USER_READ,
  },
  {
    id: 'roles',
    name: 'Role Management',
    description: 'Role definition and permission assignment',
    icon: ShieldCheck,
    path: ROUTES.APP.ROLES,
    permission: PERMISSIONS.ROLE_READ,
  },
  {
    id: 'hr',
    name: 'HR & Staff',
    description: 'Departments, designations & staff directory',
    icon: Briefcase,
    path: ROUTES.APP.HR.STAFF,
    permission: PERMISSIONS.STAFF_READ,
  },
  {
    id: 'academics',
    name: 'Academic Setup',
    description: 'Academic years, grades & section setup',
    icon: GraduationCap,
    path: ROUTES.APP.ACADEMICS.YEARS,
    permission: PERMISSIONS.ACADEMIC_YEAR_READ,
  },
  {
    id: 'crm',
    name: 'CRM & Lead Management',
    description: 'Leads pipeline, counselling & campus visits',
    icon: Target,
    path: ROUTES.APP.CRM.LEADS,
    permission: PERMISSIONS.LEAD_READ,
    stage1WorkflowStep: 1,
  },
  {
    id: 'admissions',
    name: 'Admissions Pipeline',
    description: 'Applications, docs, assessment & fee payment',
    icon: FileText,
    path: ROUTES.APP.ADMISSIONS.APPLICATIONS,
    permission: PERMISSIONS.APPLICATION_READ,
    stage1WorkflowStep: 2,
  },
  {
    id: 'students',
    name: 'Students & Enrollment',
    description: 'Student directory, parent linking & Stage-1 enrollment',
    icon: UserCheck,
    path: ROUTES.APP.STUDENTS.DIRECTORY,
    permission: PERMISSIONS.STUDENT_READ,
    stage1WorkflowStep: 3,
  },
  {
    id: 'settings',
    name: 'System Settings',
    description: 'Masters, sequence setup & system preferences',
    icon: Settings,
    path: ROUTES.APP.SETTINGS,
    permission: PERMISSIONS.SETTINGS_READ,
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Admission conversion & operational reports',
    icon: BarChart3,
    path: ROUTES.APP.REPORTS,
    permission: PERMISSIONS.REPORTS_VIEW,
  },
  {
    id: 'audit',
    name: 'Audit Trail',
    description: 'System-wide activity log & timeline viewer',
    icon: History,
    path: ROUTES.APP.AUDIT,
    permission: PERMISSIONS.AUDIT_READ,
  },
];
