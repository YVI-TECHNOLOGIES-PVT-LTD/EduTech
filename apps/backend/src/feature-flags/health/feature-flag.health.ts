import { FeatureFlagFactory } from '../factory/feature-flag.factory';
import { FeatureFlagRegistry } from '../registry/flag.registry';

export interface FeatureFlagHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  provider: string;
  ping: boolean;
  registeredFlagsCount: number;
  latencyMs: number;
  capabilities: any;
  timestamp: string;
}

export class FeatureFlagHealthService {
  public static async getStatus(): Promise<FeatureFlagHealthStatus> {
    const factory = new FeatureFlagFactory();
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
      registeredFlagsCount: FeatureFlagRegistry.getAll().length,
      latencyMs,
      capabilities: provider.capabilities,
      timestamp: new Date().toISOString(),
    };
  }
}
