import { loggerService } from '../../observability/logger.service';

export interface AuditLogDetails {
  action: string;
  resource: string;
  user?: string;
  tenantId?: string;
  hash: string;
}

export class AuditComplianceLogger {
  public static log(details: AuditLogDetails): void {
    loggerService.info(
      `🛡️ [Audit Recorded] Action: ${details.action}, Resource: ${details.resource}, User: ${details.user || 'system'} (Hash: ${details.hash.substring(0, 10)}...)`,
      details,
    );
  }
}
