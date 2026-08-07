import { PERMISSIONS } from '../../../rbac/permissions';

export class AdmissionPolicy {
  static canView(): string {
    return PERMISSIONS.ADMISSION_VIEW_ALL || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canCreate(): string {
    return PERMISSIONS.ADMISSION_CREATE || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canUpdate(): string {
    return PERMISSIONS.ADMISSION_REVIEW || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canDelete(): string {
    return PERMISSIONS.ADMISSION_REJECT || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canManageDocuments(): string {
    return PERMISSIONS.ADMISSION_REVIEW || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canManageAssessments(): string {
    return PERMISSIONS.ADMISSION_RECOMMEND || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canManageDecisions(): string {
    return PERMISSIONS.ADMISSION_APPROVE || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }

  static canManagePayments(): string {
    return PERMISSIONS.ADMISSION_FEES_INITIALIZE || PERMISSIONS.ADMISSION_LEADS_MANAGE;
  }
}
