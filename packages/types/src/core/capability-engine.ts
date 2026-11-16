/**
 * EduTrack ERP — Enterprise Capability Engine
 * Pure TypeScript authorization and capability resolution engine.
 * Zero dependencies on React, state stores (Zustand/Redux), HTTP clients, or APIs.
 *
 * Authorization Hierarchy:
 * Platform → Organization → Workspace → Modules → Capabilities → Permissions → Navigation → Widgets → Components → Action
 *
 * Capability Abstraction:
 * - Permission: Low-level granular code (e.g. 'student.create', 'fees.payment.collect')
 * - Capability: High-level business feature grouping permissions (e.g. 'Student Management')
 * - Role: Named collection of capabilities assigned to users.
 */

import { MenuItem, MenuGroup } from './navigation-types';
import { DashboardWidget } from './widget-types';
import { QuickActionItem } from './quick-action-registry';
import { FEATURE_PACKAGES, FeaturePackageId } from './feature-packages';

export interface UserCapabilityContext {
  permissions: string[];
  roles?: string[];
  enabledFeaturePackages?: string[];
  isSuperAdmin?: boolean;
}

export interface Capability {
  id: string;
  code: string;
  name: string;
  description: string;
  moduleId: string;
  granularPermissions: string[];
}

export const SYSTEM_CAPABILITIES: Capability[] = [
  // Admissions Module Capabilities
  {
    id: 'cap_lead_management',
    code: 'LEAD_MANAGEMENT',
    name: 'Lead & Inquiry Management',
    description: 'Log walk-ins, phone calls, web inquiries, and track followup schedules.',
    moduleId: 'ADMISSIONS',
    granularPermissions: [
      'admission.enquiry.create',
      'admission.enquiry.view',
      'admission.leads.manage',
      'admission.visitors.manage',
    ],
  },
  {
    id: 'cap_application_review',
    code: 'APPLICATION_REVIEW',
    name: 'Application Processing & Review',
    description: 'Create, audit, and evaluate candidate admission applications.',
    moduleId: 'ADMISSIONS',
    granularPermissions: [
      'admission.create',
      'admission.application.view',
      'admission.application.create',
      'admission.application.update',
      'admission.review',
    ],
  },
  {
    id: 'cap_document_verification',
    code: 'DOCUMENT_VERIFICATION',
    name: 'Document Verification',
    description: 'Audit uploaded student birth certificates, marksheets, and compliance records.',
    moduleId: 'ADMISSIONS',
    granularPermissions: ['admission.review', 'admission.application.view'],
  },
  {
    id: 'cap_entrance_assessment',
    code: 'ENTRANCE_ASSESSMENT',
    name: 'Entrance Assessment',
    description: 'Coordinate entrance exams, score logging, and merit list evaluation.',
    moduleId: 'ADMISSIONS',
    granularPermissions: ['admission.review', 'admission.recommend', 'admission.approve'],
  },
  {
    id: 'cap_fee_collection',
    code: 'FEE_COLLECTION',
    name: 'Admission Fee Collection',
    description: 'Collect initial admission deposits, issue fee receipts, and manage vouchers.',
    moduleId: 'ADMISSIONS',
    granularPermissions: [
      'fees.view',
      'fees.payment.collect',
      'fees.receipt.generate',
      'fees.structure.view',
    ],
  },
  {
    id: 'cap_student_enrollment',
    code: 'STUDENT_ENROLLMENT',
    name: 'Student Enrollment',
    description: 'Finalize SIS student onboarding, roll number generation, and sectioning.',
    moduleId: 'ADMISSIONS',
    granularPermissions: ['admission.enrol', 'STUDENT_CREATE', 'STUDENT_ASSIGN_SECTION'],
  },

  // People Module Capabilities
  {
    id: 'cap_student_directory',
    code: 'STUDENT_DIRECTORY',
    name: 'Student Directory',
    description: 'View student master records, section rosters, and profile details.',
    moduleId: 'PEOPLE',
    granularPermissions: ['STUDENT_VIEW', 'STUDENT_UPDATE'],
  },
  {
    id: 'cap_parent_directory',
    code: 'PARENT_DIRECTORY',
    name: 'Parent Directory',
    description: 'View guardian profiles, linked student wards, and contact info.',
    moduleId: 'PEOPLE',
    granularPermissions: ['STUDENT_VIEW'],
  },
  {
    id: 'cap_staff_directory',
    code: 'STAFF_DIRECTORY',
    name: 'Staff Directory',
    description: 'View operational staff profiles, departments, and user assignments.',
    moduleId: 'PEOPLE',
    granularPermissions: ['STAFF_PROFILE_MANAGE', 'FACULTY_PROFILE_MANAGE'],
  },
  {
    id: 'cap_user_management',
    code: 'USER_MANAGEMENT',
    name: 'User Account Management',
    description: 'Provision staff user accounts and capability assignments.',
    moduleId: 'PEOPLE',
    granularPermissions: ['manage_users'],
  },

  // Academics Module Capabilities
  {
    id: 'cap_academic_structure',
    code: 'ACADEMIC_STRUCTURE',
    name: 'Academic Structure & Sessions',
    description: 'Configure academic years, class levels, and section capacities.',
    moduleId: 'ACADEMICS',
    granularPermissions: ['ACADEMIC_SETUP', 'CLASS_VIEW', 'SECTION_VIEW'],
  },

  // Administration Module Capabilities
  {
    id: 'cap_organization_settings',
    code: 'ORGANIZATION_SETTINGS',
    name: 'Organization & Branding Settings',
    description: 'School profile info, branding logos, and contact details.',
    moduleId: 'ADMINISTRATION',
    granularPermissions: ['admin.dashboard.view'],
  },
  {
    id: 'cap_security_templates',
    code: 'SECURITY_TEMPLATES',
    name: 'Security & System Role Templates',
    description: 'Manage active roles, permissions, and System Role Templates.',
    moduleId: 'ADMINISTRATION',
    granularPermissions: ['admin.dashboard.view', 'manage_users'],
  },
  {
    id: 'cap_sequences_customization',
    code: 'CUSTOMIZATION_SETTINGS',
    name: 'Auto-Number Sequences & Preferences',
    description: 'Configure auto-incrementing application numbers, roll numbers, and preferences.',
    moduleId: 'ADMINISTRATION',
    granularPermissions: ['admin.dashboard.view'],
  },
];

export class CapabilityEngine {
  /**
   * Evaluates if user context possesses a capability (all or any required permissions).
   */
  public static hasCapability(context: UserCapabilityContext, capabilityCode: string): boolean {
    if (context.isSuperAdmin) return true;
    const capability = SYSTEM_CAPABILITIES.find((c) => c.code === capabilityCode);
    if (!capability) return false;

    return this.hasAnyPermission(context.permissions, capability.granularPermissions);
  }

  /**
   * Evaluates if a permission set contains a given single permission.
   */
  public static hasPermission(userPermissions: string[], permission?: string): boolean {
    if (!permission) return true;
    const permSet = new Set(userPermissions);
    return permSet.has(permission) || permSet.has('*');
  }

  /**
   * Evaluates if a permission set contains ALL given permissions.
   */
  public static hasAllPermissions(userPermissions: string[], permissions?: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    const permSet = new Set(userPermissions);
    if (permSet.has('*')) return true;
    return permissions.every((p) => permSet.has(p));
  }

  /**
   * Evaluates if a permission set contains AT LEAST ONE of the given permissions.
   */
  public static hasAnyPermission(userPermissions: string[], permissions?: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    const permSet = new Set(userPermissions);
    if (permSet.has('*')) return true;
    return permissions.some((p) => permSet.has(p));
  }

  /**
   * Evaluates if a feature package is active in the context.
   */
  public static hasFeature(
    enabledFeatures: string[] | undefined,
    featurePackage?: string,
  ): boolean {
    if (!featurePackage) return true;
    if (!enabledFeatures || enabledFeatures.length === 0) {
      const pkg = FEATURE_PACKAGES[featurePackage as FeaturePackageId];
      return pkg ? pkg.isStage1Active : true;
    }
    return enabledFeatures.includes(featurePackage) || enabledFeatures.includes('*');
  }

  /**
   * Granular UI Element / Action Evaluation:
   * Capability → Permission → Component → Action
   */
  public static canRenderAction(
    context: UserCapabilityContext,
    requiredPermission?: string | string[],
    featurePackage?: string,
  ): boolean {
    if (context.isSuperAdmin) return true;
    if (!this.hasFeature(context.enabledFeaturePackages, featurePackage)) return false;
    if (Array.isArray(requiredPermission)) {
      return this.hasAnyPermission(context.permissions, requiredPermission);
    }
    return this.hasPermission(context.permissions, requiredPermission);
  }

  /**
   * Determines if a menu item can be rendered based on context.
   */
  public static canRenderMenu(item: MenuItem, context: UserCapabilityContext): boolean {
    if (context.isSuperAdmin) return true;
    if (!this.hasFeature(context.enabledFeaturePackages, item.featurePackage)) return false;
    if (item.permission && !this.hasPermission(context.permissions, item.permission)) return false;
    if (item.permissions && !this.hasAnyPermission(context.permissions, item.permissions))
      return false;
    return true;
  }

  /**
   * Filters a menu group list deterministically.
   */
  public static filterMenuGroups(groups: MenuGroup[], context: UserCapabilityContext): MenuGroup[] {
    return groups
      .filter((group) => {
        if (!this.hasFeature(context.enabledFeaturePackages, group.featurePackage)) return false;
        if (group.permission && !this.hasPermission(context.permissions, group.permission))
          return false;
        if (group.permissions && !this.hasAnyPermission(context.permissions, group.permissions))
          return false;
        return true;
      })
      .map((group) => {
        const visibleItems = group.items
          .filter((item) => this.canRenderMenu(item, context))
          .map((item) => {
            if (item.children && item.children.length > 0) {
              const visibleChildren = item.children.filter((child) =>
                this.canRenderMenu(child, context),
              );
              return { ...item, children: visibleChildren };
            }
            return item;
          });

        return { ...group, items: visibleItems };
      })
      .filter((group) => group.items.length > 0);
  }

  /**
   * Determines if a dashboard widget can be rendered.
   */
  public static canRenderWidget(widget: DashboardWidget, context: UserCapabilityContext): boolean {
    if (context.isSuperAdmin) return true;
    if (!this.hasFeature(context.enabledFeaturePackages, widget.featurePackage)) return false;
    if (widget.permission && !this.hasPermission(context.permissions, widget.permission))
      return false;
    if (widget.permissions && !this.hasAnyPermission(context.permissions, widget.permissions))
      return false;
    return true;
  }

  /**
   * Determines if a quick action can be rendered.
   */
  public static canRenderQuickAction(
    action: QuickActionItem,
    context: UserCapabilityContext,
  ): boolean {
    if (context.isSuperAdmin) return true;
    if (!this.hasFeature(context.enabledFeaturePackages, action.featurePackage)) return false;
    if (action.permission && !this.hasPermission(context.permissions, action.permission))
      return false;
    if (action.permissions && !this.hasAnyPermission(context.permissions, action.permissions))
      return false;
    return true;
  }

  /**
   * Determines if a route can be accessed by the user.
   */
  public static canAccessRoute(
    requiredPermission: string | string[] | undefined,
    featurePackage: string | undefined,
    context: UserCapabilityContext,
  ): boolean {
    if (context.isSuperAdmin) return true;
    if (!this.hasFeature(context.enabledFeaturePackages, featurePackage)) return false;

    if (Array.isArray(requiredPermission)) {
      return this.hasAnyPermission(context.permissions, requiredPermission);
    }
    return this.hasPermission(context.permissions, requiredPermission);
  }

  /**
   * Resource CRUD Evaluation Helpers
   */
  public static canView(context: UserCapabilityContext, resourcePermission: string): boolean {
    return this.hasPermission(context.permissions, resourcePermission);
  }

  public static canCreate(context: UserCapabilityContext, resourcePermission: string): boolean {
    return this.hasPermission(context.permissions, resourcePermission);
  }

  public static canEdit(context: UserCapabilityContext, resourcePermission: string): boolean {
    return this.hasPermission(context.permissions, resourcePermission);
  }

  public static canDelete(context: UserCapabilityContext, resourcePermission: string): boolean {
    return this.hasPermission(context.permissions, resourcePermission);
  }
}
