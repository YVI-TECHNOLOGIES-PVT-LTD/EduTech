import { CacheFactory } from '../factory/cache.factory';
import { configuration } from '../../config';

export interface CacheHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  provider: string;
  ping: boolean;
  latencyMs: number;
  capabilities: any;
  timestamp: string;
}

export class CacheHealthService {
  public static async getStatus(): Promise<CacheHealthStatus> {
    const factory = new CacheFactory();
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
