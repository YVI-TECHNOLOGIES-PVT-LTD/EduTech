import { PERMISSIONS } from '../../../rbac/permissions';

export class LeadPolicy {
  static canView(): string {
    return PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canCreate(): string {
    return PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canUpdate(): string {
    return PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canDelete(): string {
    return PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canAssign(): string {
    return PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }
}
