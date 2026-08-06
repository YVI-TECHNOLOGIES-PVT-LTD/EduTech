import { SearchFactory } from '../factory/search.factory';

export interface SearchHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  provider: string;
  ping: boolean;
  latencyMs: number;
  capabilities: any;
  timestamp: string;
}

export class SearchHealthService {
  public static async getStatus(): Promise<SearchHealthStatus> {
    const factory = new SearchFactory();
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
