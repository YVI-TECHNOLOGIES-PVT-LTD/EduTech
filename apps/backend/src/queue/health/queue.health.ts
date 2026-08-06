import { QueueFactory } from '../factory/queue.factory';
import { SchedulerManager } from '../schedulers/scheduler.manager';

export interface QueueHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  provider: string;
  ping: boolean;
  latencyMs: number;
  activeSchedulers: number;
  capabilities: any;
  timestamp: string;
}

export class QueueHealthService {
  public static async getStatus(): Promise<QueueHealthStatus> {
    const factory = new QueueFactory();
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
      activeSchedulers: SchedulerManager.getInstance().getActiveCount(),
      capabilities: provider.capabilities,
      timestamp: new Date().toISOString(),
    };
  }
}
