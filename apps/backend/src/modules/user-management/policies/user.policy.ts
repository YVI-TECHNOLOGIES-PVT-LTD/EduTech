import { PERMISSIONS } from '../../../rbac/permissions';

export class UserPolicy {
  static canView(): string {
    return PERMISSIONS.ADMISSION_VIEW_ALL || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canCreate(): string {
    return PERMISSIONS.ADMISSION_ENROL || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canUpdate(): string {
    return PERMISSIONS.ADMISSION_REVIEW || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canManageRoles(): string {
    return PERMISSIONS.ADMISSION_REVIEW || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }
}
