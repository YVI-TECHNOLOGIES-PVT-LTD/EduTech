import crypto from 'crypto';
import {
  IAuditStoreProvider,
  AuditCapabilities,
  AuditEventPayload,
  AuditQueryPayload,
} from '../contracts/audit.contracts';
import { HashChainEngine, ChainVerifier } from '../engine/audit.chain';

export class MemoryAuditProvider implements IAuditStoreProvider {
  constructor(public readonly name: string = 'memory') {}

  public readonly capabilities: AuditCapabilities = {
    supportsHashChain: true,
    supportsDigitalSignature: true,
    supportsArchive: true,
    supportsReplay: true,
    supportsEncryption: true,
    supportsCompression: true,
  };

  private events: AuditEventPayload[] = [];

  public async recordAudit(event: AuditEventPayload): Promise<AuditEventPayload> {
    const prevHash = HashChainEngine.getLastHash();
    const id = event.id || crypto.randomUUID();
    const timestamp = event.timestamp || new Date();

    const record: AuditEventPayload = {
      ...event,
      id,
      timestamp,
      previousHash: prevHash,
    };

    const hash = HashChainEngine.calculateHash(record, prevHash);
    record.hash = hash;

    HashChainEngine.updateLastHash(hash);
    this.events.push(record);
    return record;
  }

  public async queryAudit(query: AuditQueryPayload): Promise<AuditEventPayload[]> {
    let filtered = this.events;
    if (query.tenantId) filtered = filtered.filter((e) => e.tenantId === query.tenantId);
    if (query.userId) filtered = filtered.filter((e) => e.userId === query.userId);
    if (query.action) filtered = filtered.filter((e) => e.action === query.action);

    const offset = query.offset || 0;
    const limit = query.limit || 50;
    return filtered.slice(offset, offset + limit);
  }

  public async verifyChain(): Promise<boolean> {
    return ChainVerifier.verifyChain(this.events).isValid;
  }

  public async ping(): Promise<boolean> {
    return true;
  }
}

export class NoopAuditProvider implements IAuditStoreProvider {
  constructor(public readonly name: string = 'noop') {}

  public readonly capabilities: AuditCapabilities = {
    supportsHashChain: false,
    supportsDigitalSignature: false,
    supportsArchive: false,
    supportsReplay: false,
    supportsEncryption: false,
    supportsCompression: false,
  };

  public async recordAudit(event: AuditEventPayload): Promise<AuditEventPayload> {
    return event;
  }
  public async queryAudit(_query: AuditQueryPayload): Promise<AuditEventPayload[]> {
    return [];
  }
  public async verifyChain(): Promise<boolean> {
    return true;
  }
  public async ping(): Promise<boolean> {
    return true;
  }
}

export class PostgresAuditProvider extends MemoryAuditProvider {
  constructor() {
    super('postgres');
  }
}

export class FileAuditProvider extends MemoryAuditProvider {
  constructor() {
    super('file');
  }
}
