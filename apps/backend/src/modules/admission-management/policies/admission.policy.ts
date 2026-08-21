import { PERMISSIONS } from '../../../rbac/permissions';

export class AdmissionPolicy {
  static canView(): string {
    return PERMISSIONS.APPLICATION_VIEW;
  }

  static canCreate(): string {
    return PERMISSIONS.APPLICATION_CREATE;
  }

  static canUpdate(): string {
    return PERMISSIONS.APPLICATION_UPDATE;
  }

  static canDelete(): string {
    return PERMISSIONS.APPLICATION_DELETE;
  }

  static canUploadDocument(): string {
    return PERMISSIONS.APPLICATION_UPDATE;
  }

  static canManageDocuments(): string {
    return PERMISSIONS.ADMISSION_REVIEW;
  }

  static canManageAssessments(): string {
    return PERMISSIONS.ADMISSION_RECOMMEND;
  }

  static canManageDecisions(): string {
    return PERMISSIONS.ADMISSION_APPROVE;
  }

  static canManagePayments(): string {
    return PERMISSIONS.FEES_VIEW;
  }
}
