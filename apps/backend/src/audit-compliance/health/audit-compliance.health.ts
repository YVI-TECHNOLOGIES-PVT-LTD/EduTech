import { AuditComplianceFactory } from '../factory/audit-compliance.factory';

export interface AuditComplianceHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  provider: string;
  ping: boolean;
  latencyMs: number;
  capabilities: any;
  timestamp: string;
}

export class AuditComplianceHealthService {
  public static async getStatus(): Promise<AuditComplianceHealthStatus> {
    const factory = new AuditComplianceFactory();
    const provider = factory.createProvider();

    const start = process.hrtime.bigint();
    let isPingOk = false;
    try {
      isPingOk = await provider.ping();
    } catch {
      isPingOk = false;
    }
    const end = process.hrtime.bigint();
    const latencyMs = Math.round(Number(end - start) / 100000) / 10;

    return {
      status: isPingOk ? 'ok' : 'degraded',
      provider: provider.name,
      ping: isPingOk,
      latencyMs,
      capabilities: provider.capabilities,
      timestamp: new Date().toISOString(),
    };
  }
}
