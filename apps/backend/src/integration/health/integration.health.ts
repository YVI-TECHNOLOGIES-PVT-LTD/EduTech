import { IntegrationFactory } from '../factory/integration.factory';

export interface IntegrationHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  connector: string;
  ping: boolean;
  latencyMs: number;
  capabilities: any;
  timestamp: string;
}

export class IntegrationHealthService {
  public static async getStatus(): Promise<IntegrationHealthStatus> {
    const factory = new IntegrationFactory();
    const connector = factory.createConnector();

    const start = process.hrtime.bigint();
    let isPingOk = false;
    try {
      isPingOk = await connector.ping();
    } catch {
      isPingOk = false;
    }
    const end = process.hrtime.bigint();
    const latencyMs = Math.round(Number(end - start) / 100000) / 10;

    return {
      status: isPingOk ? 'ok' : 'degraded',
      connector: connector.name,
      ping: isPingOk,
      latencyMs,
      capabilities: connector.capabilities,
      timestamp: new Date().toISOString(),
    };
  }
}
