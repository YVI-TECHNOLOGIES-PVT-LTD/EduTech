/**
 * EduTrack ERP — Frontend Menu Registry Adapter
 * Bridges shared core `@edutrack/types` metadata-driven menus to Lucide React icons for the UI.
 */

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
  Activity,
  CheckSquare,
  User,
  MessageSquare,
  BookOpen,
  Briefcase,
  Bell,
} from 'lucide-react';

import {
  WORKSPACE_MENU_GROUPS,
  PARENT_MENU_ITEMS,
  MenuGroup as CoreMenuGroup,
  MenuItem as CoreMenuItem,
} from '@edutrack/types';

export const ICON_MAP: Record<string, any> = {
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
  Activity,
  CheckSquare,
  User,
  MessageSquare,
  BookOpen,
  Briefcase,
  Bell,
};

export interface UIMenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  permission?: string;
  permissions?: string[];
  featurePackage?: string;
  children?: UIMenuItem[];
}

export interface UIMenuGroup {
  id: string;
  label: string;
  permission?: string;
  permissions?: string[];
  module?: string;
  featurePackage?: string;
  items: UIMenuGroupItem[];
}

export interface UIMenuGroupItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  permission?: string;
  permissions?: string[];
  featurePackage?: string;
  children?: UIMenuGroupItem[];
}

/**
 * Maps shared core menu groups to UI groups with rendered Lucide icons.
 */
export function getUIMenuGroups(): UIMenuGroup[] {
  return WORKSPACE_MENU_GROUPS.map((grp: CoreMenuGroup) => ({
    id: grp.id,
    label: grp.title,
    permission: grp.permission,
    permissions: grp.permissions,
    featurePackage: grp.featurePackage,
    items: grp.items.map((item: CoreMenuItem) => ({
      id: item.id,
      label: item.title,
      icon: item.icon ? ICON_MAP[item.icon] || LayoutDashboard : LayoutDashboard,
      path: item.route,
      permission: item.permission,
      permissions: item.permissions,
      featurePackage: item.featurePackage,
      children: item.children?.map((child: CoreMenuItem) => ({
        id: child.id,
        label: child.title,
        icon: child.icon ? ICON_MAP[child.icon] || LayoutDashboard : LayoutDashboard,
        path: child.route,
        permission: child.permission,
        permissions: child.permissions,
        featurePackage: child.featurePackage,
      })),
    })),
  }));
}

/**
 * Maps shared core parent menu items to UI items with rendered Lucide icons.
 */
export function getUIParentMenuItems(): UIMenuGroupItem[] {
  return PARENT_MENU_ITEMS.map((item: CoreMenuItem) => ({
    id: item.id,
    label: item.title,
    icon: item.icon ? ICON_MAP[item.icon] || LayoutDashboard : LayoutDashboard,
    path: item.route,
    permission: item.permission,
    permissions: item.permissions,
    featurePackage: item.featurePackage,
  }));
}

export const MENU_REGISTRY = getUIMenuGroups();
