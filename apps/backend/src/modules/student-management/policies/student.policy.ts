import { PERMISSIONS } from '../../../rbac/permissions';

export class StudentPolicy {
  static canView(): string {
    return PERMISSIONS.ADMISSION_VIEW_ALL || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canCreate(): string {
    return PERMISSIONS.ADMISSION_ENROL || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canUpdate(): string {
    return PERMISSIONS.ADMISSION_REVIEW || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canDelete(): string {
    return PERMISSIONS.ADMISSION_REJECT || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canManageEnrollment(): string {
    return PERMISSIONS.ADMISSION_ENROL || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canManageParents(): string {
    return PERMISSIONS.ADMISSION_REVIEW || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }
}
