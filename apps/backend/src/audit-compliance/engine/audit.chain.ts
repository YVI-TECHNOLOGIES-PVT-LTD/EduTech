import crypto from 'crypto';
import { AuditEventPayload } from '../contracts/audit.contracts';

export class HashChainEngine {
  private static lastHash = '0000000000000000000000000000000000000000000000000000000000000000';

  public static calculateHash(event: AuditEventPayload, previousHash: string): string {
    const raw = `${event.id}:${event.tenantId || ''}:${event.userId || ''}:${event.action}:${event.resource}:${event.timestamp?.toISOString() || ''}:${previousHash}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public static getLastHash(): string {
    return this.lastHash;
  }

  public static updateLastHash(hash: string): void {
    this.lastHash = hash;
  }
}

export class ChainVerifier {
  public static verifyChain(events: AuditEventPayload[]): {
    isValid: boolean;
    brokenAtIndex?: number;
  } {
    let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const expectedHash = HashChainEngine.calculateHash(event, prevHash);
      if (event.hash && event.hash !== expectedHash) {
        return { isValid: false, brokenAtIndex: i };
      }
      prevHash = event.hash || expectedHash;
    }

    return { isValid: true };
  }
}
