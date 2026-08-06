import { IAuditStoreProvider } from '../contracts/audit.contracts';
import {
  PostgresAuditProvider,
  FileAuditProvider,
  MemoryAuditProvider,
  NoopAuditProvider,
} from '../providers/audit.providers';
import { configuration } from '../../config';

export class AuditComplianceFactory {
  public createProvider(name?: string): IAuditStoreProvider {
    const providerName = name || (configuration as any)?.auditCompliance?.provider || 'memory';

    switch (providerName.toLowerCase()) {
      case 'postgres':
        return new PostgresAuditProvider();
      case 'file':
        return new FileAuditProvider();
      case 'noop':
        return new NoopAuditProvider();
      case 'memory':
      default:
        return new MemoryAuditProvider();
    }
  }
}
