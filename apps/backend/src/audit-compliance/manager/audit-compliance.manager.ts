import {
  IAuditStoreProvider,
  AuditEventPayload,
  AuditQueryPayload,
} from '../contracts/audit.contracts';
import { AuditComplianceFactory } from '../factory/audit-compliance.factory';
import { RightToForgetEngine } from '../privacy/gdpr.privacy';
import { storageManager } from '../../storage/manager/storage.manager';
import { StorageKeyBuilder } from '../../storage/keys/storage.keys';
import { queueManager } from '../../queue/manager/queue.manager';
import { AuditComplianceLogger } from '../audit/audit.compliance.logger';
import { AuditComplianceEvents, AuditComplianceEventType } from '../events/audit-compliance.events';

export class AuditComplianceManager {
  private static instance: AuditComplianceManager;
  private provider: IAuditStoreProvider;

  private constructor() {
    const factory = new AuditComplianceFactory();
    this.provider = factory.createProvider();
  }

  public static getInstance(): AuditComplianceManager {
    if (!AuditComplianceManager.instance) {
      AuditComplianceManager.instance = new AuditComplianceManager();
    }
    return AuditComplianceManager.instance;
  }

  public async recordAudit(event: AuditEventPayload): Promise<AuditEventPayload> {
    const recorded = await this.provider.recordAudit(event);
    AuditComplianceLogger.log({
      action: recorded.action,
      resource: recorded.resource,
      user: recorded.userId,
      tenantId: recorded.tenantId,
      hash: recorded.hash || '',
    });
    AuditComplianceEvents.emit(AuditComplianceEventType.RECORDED, recorded.action);
    return recorded;
  }

  public async recordAuditAsync(event: AuditEventPayload): Promise<void> {
    await queueManager.enqueue('audit:dispatch', 'record_audit', event);
  }

  public async queryAudit(query: AuditQueryPayload): Promise<AuditEventPayload[]> {
    return this.provider.queryAudit(query);
  }

  public async verifyIntegrity(): Promise<boolean> {
    const isValid = await this.provider.verifyChain();
    AuditComplianceEvents.emit(AuditComplianceEventType.VERIFIED, 'chain_verification', {
      isValid,
    });
    return isValid;
  }

  public async processRightToForget(userId: string): Promise<any> {
    const result = RightToForgetEngine.processRightToForget(userId);
    AuditComplianceEvents.emit(AuditComplianceEventType.GDPR_PROCESSED, 'right_to_forget', {
      userId,
    });
    return result;
  }

  public async archiveComplianceLogs(logs: AuditEventPayload[]): Promise<string> {
    const filename = `archive-${Date.now()}.json`;
    const storageKey = StorageKeyBuilder.build({
      module: 'audit',
      resource: 'compliance',
      identifier: 'logs',
      filename,
    });
    const buffer = Buffer.from(JSON.stringify(logs, null, 2));
    await storageManager.upload(storageKey, {
      buffer,
      filename,
      mimetype: 'application/json',
      size: buffer.length,
    });
    return storageKey;
  }
}

export const auditComplianceManager = AuditComplianceManager.getInstance();
