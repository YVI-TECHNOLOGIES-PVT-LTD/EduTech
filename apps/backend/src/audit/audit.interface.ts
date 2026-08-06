export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'ACCESS';

export interface AuditActor {
  id: string;
  orgId: string;
  email?: string;
  ip?: string;
}

export interface AuditResource {
  type: string;
  id?: string;
  tenantId?: string;
}

export interface AuditEvent {
  action: AuditAction;
  actor: AuditActor;
  resource: AuditResource;
  timestamp: string;
  details?: Record<string, any>;
}

export interface IAuditService {
  logEvent(event: AuditEvent): Promise<void>;
}
