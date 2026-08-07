import { PERMISSIONS } from '@/shared/constants/permissions';

export interface PermissionGroup {
  groupName: string;
  permissions: { code: string; label: string; description: string }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    groupName: 'Organization',
    permissions: [
      {
        code: PERMISSIONS.ORGANIZATION_READ,
        label: 'View Profile',
        description: 'View organization details and settings',
      },
      {
        code: PERMISSIONS.ORGANIZATION_WRITE,
        label: 'Update Profile',
        description: 'Modify organization profile and settings',
      },
      {
        code: PERMISSIONS.ORGANIZATION_DELETE,
        label: 'Delete Organization',
        description: 'Danger zone: Remove organization',
      },
    ],
  },
  {
    groupName: 'User Management & RBAC',
    permissions: [
      {
        code: PERMISSIONS.USER_READ,
        label: 'View Users',
        description: 'Access user directory and profiles',
      },
      {
        code: PERMISSIONS.USER_WRITE,
        label: 'Manage Users',
        description: 'Create and update user accounts',
      },
      {
        code: PERMISSIONS.USER_DELETE,
        label: 'Delete Users',
        description: 'Deactivate or delete user accounts',
      },
      {
        code: PERMISSIONS.ROLE_READ,
        label: 'View Roles',
        description: 'View RBAC roles and assigned permissions',
      },
      {
        code: PERMISSIONS.ROLE_WRITE,
        label: 'Manage Roles',
        description: 'Create and edit RBAC roles',
      },
      {
        code: PERMISSIONS.PERMISSION_ASSIGN,
        label: 'Assign Permissions',
        description: 'Grant or revoke permissions',
      },
    ],
  },
  {
    groupName: 'HR & Staff',
    permissions: [
      {
        code: PERMISSIONS.DEPARTMENT_READ,
        label: 'View Departments',
        description: 'View organizational department tree',
      },
      {
        code: PERMISSIONS.DEPARTMENT_WRITE,
        label: 'Manage Departments',
        description: 'Create and edit departments',
      },
      {
        code: PERMISSIONS.DESIGNATION_READ,
        label: 'View Designations',
        description: 'View job designations',
      },
      {
        code: PERMISSIONS.DESIGNATION_WRITE,
        label: 'Manage Designations',
        description: 'Create and edit designations',
      },
      {
        code: PERMISSIONS.STAFF_READ,
        label: 'View Staff',
        description: 'View staff directory and details',
      },
      {
        code: PERMISSIONS.STAFF_WRITE,
        label: 'Manage Staff',
        description: 'Add, update or offboard staff',
      },
    ],
  },
  {
    groupName: 'Academics',
    permissions: [
      {
        code: PERMISSIONS.ACADEMIC_YEAR_READ,
        label: 'View Academic Years',
        description: 'Access academic session list',
      },
      {
        code: PERMISSIONS.ACADEMIC_YEAR_WRITE,
        label: 'Manage Academic Years',
        description: 'Create or activate academic sessions',
      },
      {
        code: PERMISSIONS.GRADE_READ,
        label: 'View Grades',
        description: 'Access grade/class list',
      },
      {
        code: PERMISSIONS.GRADE_WRITE,
        label: 'Manage Grades',
        description: 'Create and update grades',
      },
      {
        code: PERMISSIONS.SECTION_READ,
        label: 'View Sections',
        description: 'Access section list',
      },
      {
        code: PERMISSIONS.SECTION_WRITE,
        label: 'Manage Sections',
        description: 'Create and edit sections',
      },
    ],
  },
  {
    groupName: 'CRM & Lead Management',
    permissions: [
      {
        code: PERMISSIONS.LEAD_READ,
        label: 'View Leads',
        description: 'Access lead pipeline and details',
      },
      {
        code: PERMISSIONS.LEAD_WRITE,
        label: 'Manage Leads',
        description: 'Create, update or assign leads',
      },
      { code: PERMISSIONS.LEAD_DELETE, label: 'Delete Leads', description: 'Remove lead records' },
      {
        code: PERMISSIONS.LEAD_ACTIVITY_WRITE,
        label: 'Log Activities',
        description: 'Record calls, visits and counselling notes',
      },
    ],
  },
  {
    groupName: 'Admissions Pipeline',
    permissions: [
      {
        code: PERMISSIONS.APPLICATION_READ,
        label: 'View Applications',
        description: 'Access admission application list',
      },
      {
        code: PERMISSIONS.APPLICATION_WRITE,
        label: 'Manage Applications',
        description: 'Create or update application records',
      },
      {
        code: PERMISSIONS.APPLICATION_DECIDE,
        label: 'Make Decision',
        description: 'Approve, reject or request changes on application',
      },
      {
        code: PERMISSIONS.ASSESSMENT_WRITE,
        label: 'Conduct Assessment',
        description: 'Record test/interview assessment scores',
      },
      {
        code: PERMISSIONS.FEE_PAYMENT_COLLECT,
        label: 'Collect Admission Fee',
        description: 'Process admission fee payment',
      },
    ],
  },
  {
    groupName: 'Students & Enrollment',
    permissions: [
      {
        code: PERMISSIONS.STUDENT_READ,
        label: 'View Students',
        description: 'Access student directory and profiles',
      },
      {
        code: PERMISSIONS.STUDENT_WRITE,
        label: 'Manage Students',
        description: 'Update student profile information',
      },
      {
        code: PERMISSIONS.STUDENT_ENROLL,
        label: 'Execute Enrollment',
        description: 'Execute final Stage-1 student enrollment',
      },
      {
        code: PERMISSIONS.PARENT_READ,
        label: 'View Parents',
        description: 'View linked parent/guardian profiles',
      },
      {
        code: PERMISSIONS.PARENT_WRITE,
        label: 'Manage Parents',
        description: 'Create or update parent profiles',
      },
    ],
  },
  {
    groupName: 'System & Reports',
    permissions: [
      {
        code: PERMISSIONS.SETTINGS_READ,
        label: 'View Settings',
        description: 'Access system configuration',
      },
      {
        code: PERMISSIONS.SETTINGS_WRITE,
        label: 'Manage Settings',
        description: 'Modify system preferences and masters',
      },
      {
        code: PERMISSIONS.REPORTS_VIEW,
        label: 'View Reports',
        description: 'Access reports and operational dashboards',
      },
      {
        code: PERMISSIONS.AUDIT_READ,
        label: 'View Audit Trail',
        description: 'Inspect system activity and audit logs',
      },
    ],
  },
];
