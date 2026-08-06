export interface AuditCapabilities {
  readonly supportsHashChain: boolean;
  readonly supportsDigitalSignature: boolean;
  readonly supportsArchive: boolean;
  readonly supportsReplay: boolean;
  readonly supportsEncryption: boolean;
  readonly supportsCompression: boolean;
}

export interface AuditEventPayload {
  id?: string;
  tenantId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  payload?: any;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
  hash?: string;
  previousHash?: string;
}

export interface AuditQueryPayload {
  tenantId?: string;
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface IAuditStoreProvider {
  readonly name: string;
  readonly capabilities: AuditCapabilities;
  recordAudit(event: AuditEventPayload): Promise<AuditEventPayload>;
  queryAudit(query: AuditQueryPayload): Promise<AuditEventPayload[]>;
  verifyChain(): Promise<boolean>;
  ping(): Promise<boolean>;
}
