/**
 * EduTrack ERP — Navigation Types Definition
 * Core metadata-driven navigation interfaces for Stage-1 and Stage-2 evolution.
 */

export interface MenuItem {
  id: string;
  title: string;
  route: string;
  icon?: string;
  featurePackage?: string;
  permission?: string;
  permissions?: string[];
  children?: MenuItem[];
  defaultRoute?: string;
  badge?: string | number;
  isExternal?: boolean;
}

export interface MenuGroup {
  id: string;
  title: string;
  featurePackage?: string;
  permission?: string;
  permissions?: string[];
  items: MenuItem[];
}

export interface NavigationRegistry {
  workspace: MenuGroup[];
  parent: MenuItem[];
}
