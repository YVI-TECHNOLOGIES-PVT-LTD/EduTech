/**
 * EduTrack ERP — System Roles & Role Templates
 * Explicit separation between Active System Roles and Role Templates.
 *
 * Active System Roles (Stage-1):
 * - FRONT_OFFICE (Consolidated operational staff super-role)
 * - PARENT (Isolated self-service portal persona)
 * - SUPER_ADMIN (Platform SaaS provisioning only)
 *
 * Role Templates (Stage-2 Inactive Skeletons for Role Splitting):
 * - RECEPTIONIST
 * - COUNSELLOR
 * - FINANCE_EXECUTIVE
 * - REGISTRAR
 * - PRINCIPAL
 *
 * Template Lifecycle:
 * Role Template → Clone → Custom Role → Assign Users → Deactivate → Archive
 */

export type RoleLifecycleState =
  'SYSTEM_ROLE' | 'ROLE_TEMPLATE' | 'CLONED_DRAFT' | 'ACTIVE_ASSIGNED' | 'DEACTIVATED' | 'ARCHIVED';

export interface SystemRoleDefinition {
  id: string;
  name: string;
  code: string;
  description: string;
  type: 'ACTIVE_SYSTEM_ROLE' | 'ROLE_TEMPLATE';
  lifecycleState: RoleLifecycleState;
  isLocked: boolean;
  isHiddenInNormalUI: boolean;
  assignedCapabilities: string[];
  defaultPermissions: string[];
  allowedFeaturePackages: string[];
}

export const ACTIVE_SYSTEM_ROLES: Record<string, SystemRoleDefinition> = {
  SUPER_ADMIN: {
    id: 'role_super_admin',
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Platform SaaS administrator for organization provisioning and tenant setup.',
    type: 'ACTIVE_SYSTEM_ROLE',
    lifecycleState: 'SYSTEM_ROLE',
    isLocked: true,
    isHiddenInNormalUI: false,
    assignedCapabilities: ['*'],
    defaultPermissions: ['*'],
    allowedFeaturePackages: ['CORE_PLATFORM', 'ADMINISTRATION'],
  },
  FRONT_OFFICE: {
    id: 'role_front_office',
    name: 'Front Office',
    code: 'FRONT_OFFICE',
    description:
      'Stage-1 active operational persona owning 100% of admissions, inquiries, fee collection, directory, academics, and settings capabilities.',
    type: 'ACTIVE_SYSTEM_ROLE',
    lifecycleState: 'ACTIVE_ASSIGNED',
    isLocked: true,
    isHiddenInNormalUI: false,
    assignedCapabilities: [
      'LEAD_MANAGEMENT',
      'APPLICATION_REVIEW',
      'DOCUMENT_VERIFICATION',
      'ENTRANCE_ASSESSMENT',
      'FEE_COLLECTION',
      'STUDENT_ENROLLMENT',
      'STUDENT_DIRECTORY',
      'PARENT_DIRECTORY',
      'STAFF_DIRECTORY',
      'USER_MANAGEMENT',
      'ACADEMIC_STRUCTURE',
      'ORGANIZATION_SETTINGS',
      'SECURITY_TEMPLATES',
      'CUSTOMIZATION_SETTINGS',
    ],
    defaultPermissions: [
      'admission.review',
      'admission.view_all',
      'admission.create',
      'admission.recommend',
      'admission.approve',
      'admission.reject',
      'admission.enrol',
      'admission.enquiry.create',
      'admission.enquiry.view',
      'admission.leads.manage',
      'admission.visitors.manage',
      'admission.application.create',
      'admission.application.update',
      'admission.application.submit',
      'admission.application.view',
      'STUDENT_CREATE',
      'STUDENT_VIEW',
      'STUDENT_UPDATE',
      'STAFF_PROFILE_MANAGE',
      'FACULTY_PROFILE_MANAGE',
      'fees.view',
      'fees.structure.view',
      'fees.demand.view',
      'fees.payment.collect',
      'fees.receipt.generate',
      'admin.dashboard.view',
      'admission.dashboard.view',
      'fees.dashboard.view',
      'manage_users',
      'ACADEMIC_SETUP',
    ],
    allowedFeaturePackages: [
      'CORE_PLATFORM',
      'ADMISSIONS',
      'PEOPLE',
      'ACADEMICS',
      'ADMINISTRATION',
    ],
  },
  PARENT: {
    id: 'role_parent',
    name: 'Parent',
    code: 'PARENT',
    description: 'Isolated self-service parent portal persona.',
    type: 'ACTIVE_SYSTEM_ROLE',
    lifecycleState: 'ACTIVE_ASSIGNED',
    isLocked: true,
    isHiddenInNormalUI: false,
    assignedCapabilities: ['PARENT_SELF_SERVICE'],
    defaultPermissions: ['DASHBOARD_VIEW_PARENT', 'admission.view_own', 'parent.dashboard.view'],
    allowedFeaturePackages: ['CORE_PLATFORM'],
  },
};

export const ROLE_TEMPLATES: Record<string, SystemRoleDefinition> = {
  RECEPTIONIST: {
    id: 'tpl_receptionist',
    name: 'Receptionist',
    code: 'RECEPTIONIST',
    description: 'Role Template for front desk visitor logging, inquiries, and lead management.',
    type: 'ROLE_TEMPLATE',
    lifecycleState: 'ROLE_TEMPLATE',
    isLocked: true,
    isHiddenInNormalUI: true,
    assignedCapabilities: ['LEAD_MANAGEMENT'],
    defaultPermissions: [
      'admission.enquiry.create',
      'admission.enquiry.view',
      'admission.leads.manage',
      'admission.visitors.manage',
      'admission.application.view',
    ],
    allowedFeaturePackages: ['ADMISSIONS'],
  },
  COUNSELLOR: {
    id: 'tpl_counsellor',
    name: 'Counsellor',
    code: 'COUNSELLOR',
    description: 'Role Template for lead counseling, applicant followups, and document audit.',
    type: 'ROLE_TEMPLATE',
    lifecycleState: 'ROLE_TEMPLATE',
    isLocked: true,
    isHiddenInNormalUI: true,
    assignedCapabilities: [
      'LEAD_MANAGEMENT',
      'APPLICATION_REVIEW',
      'DOCUMENT_VERIFICATION',
      'ENTRANCE_ASSESSMENT',
    ],
    defaultPermissions: [
      'admission.review',
      'admission.view_all',
      'admission.recommend',
      'admission.enquiry.view',
      'admission.leads.manage',
      'admission.application.view',
      'admission.application.update',
    ],
    allowedFeaturePackages: ['ADMISSIONS'],
  },
  FINANCE_EXECUTIVE: {
    id: 'tpl_finance_executive',
    name: 'Finance Executive',
    code: 'FINANCE_EXECUTIVE',
    description:
      'Role Template for fee vouchers, deposit collections, receipts, and fee demand generation.',
    type: 'ROLE_TEMPLATE',
    lifecycleState: 'ROLE_TEMPLATE',
    isLocked: true,
    isHiddenInNormalUI: true,
    assignedCapabilities: ['FEE_COLLECTION'],
    defaultPermissions: [
      'fees.view',
      'fees.structure.manage',
      'fees.demand.generate',
      'fees.payment.collect',
      'fees.structure.view',
      'fees.demand.view',
      'fees.payment.view',
      'fees.receipt.generate',
      'fees.waiver.approve',
      'fees.refund.process',
      'fees.dashboard.view',
    ],
    allowedFeaturePackages: ['ADMISSIONS', 'ADMINISTRATION'],
  },
  REGISTRAR: {
    id: 'tpl_registrar',
    name: 'Registrar',
    code: 'REGISTRAR',
    description:
      'Role Template for final admission approval, student enrollment, section assignment, and SIS records.',
    type: 'ROLE_TEMPLATE',
    lifecycleState: 'ROLE_TEMPLATE',
    isLocked: true,
    isHiddenInNormalUI: true,
    assignedCapabilities: ['STUDENT_ENROLLMENT', 'STUDENT_DIRECTORY', 'PARENT_DIRECTORY'],
    defaultPermissions: [
      'admission.review',
      'admission.approve',
      'admission.reject',
      'admission.enrol',
      'STUDENT_CREATE',
      'STUDENT_VIEW',
      'STUDENT_UPDATE',
      'STUDENT_ASSIGN_SECTION',
    ],
    allowedFeaturePackages: ['ADMISSIONS', 'PEOPLE'],
  },
  PRINCIPAL: {
    id: 'tpl_principal',
    name: 'Principal',
    code: 'PRINCIPAL',
    description:
      'Role Template for executive approval overrides, school structure setup, and staff oversight.',
    type: 'ROLE_TEMPLATE',
    lifecycleState: 'ROLE_TEMPLATE',
    isLocked: true,
    isHiddenInNormalUI: true,
    assignedCapabilities: [
      'APPLICATION_REVIEW',
      'ENTRANCE_ASSESSMENT',
      'STAFF_DIRECTORY',
      'ACADEMIC_STRUCTURE',
      'ORGANIZATION_SETTINGS',
    ],
    defaultPermissions: [
      'admin.dashboard.view',
      'admission.review',
      'admission.approve',
      'admission.reject',
      'STUDENT_VIEW',
      'STAFF_PROFILE_MANAGE',
      'FACULTY_PROFILE_MANAGE',
      'fees.view',
      'ACADEMIC_SETUP',
    ],
    allowedFeaturePackages: ['ADMISSIONS', 'PEOPLE', 'ACADEMICS', 'ADMINISTRATION'],
  },
};

export const SYSTEM_ROLE_TEMPLATES = ROLE_TEMPLATES;
export const SYSTEM_TEMPLATES = ROLE_TEMPLATES;

/**
 * Role Template Lifecycle Engine
 */
export class TemplateLifecycleEngine {
  public static cloneTemplate(templateCode: string, customRoleName: string): SystemRoleDefinition {
    const source = ROLE_TEMPLATES[templateCode];
    if (!source) throw new Error(`Role template '${templateCode}' not found.`);

    return {
      id: `custom_${source.code.toLowerCase()}_${Date.now()}`,
      name: customRoleName,
      code: `CUSTOM_${source.code}_${Date.now()}`,
      description: `Custom operational role derived from Role Template '${source.name}'.`,
      type: 'ROLE_TEMPLATE',
      lifecycleState: 'CLONED_DRAFT',
      isLocked: false,
      isHiddenInNormalUI: false,
      assignedCapabilities: [...source.assignedCapabilities],
      defaultPermissions: [...source.defaultPermissions],
      allowedFeaturePackages: [...source.allowedFeaturePackages],
    };
  }

  public static activateRole(role: SystemRoleDefinition): SystemRoleDefinition {
    return { ...role, lifecycleState: 'ACTIVE_ASSIGNED' };
  }

  public static deactivateRole(role: SystemRoleDefinition): SystemRoleDefinition {
    return { ...role, lifecycleState: 'DEACTIVATED' };
  }

  public static archiveRole(role: SystemRoleDefinition): SystemRoleDefinition {
    return { ...role, lifecycleState: 'ARCHIVED' };
  }
}
