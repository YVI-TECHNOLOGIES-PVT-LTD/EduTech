import { WorkflowFactory } from '../factory/workflow.factory';

export interface WorkflowHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  engine: string;
  ping: boolean;
  latencyMs: number;
  capabilities: any;
  timestamp: string;
}

export class WorkflowHealthService {
  public static async getStatus(): Promise<WorkflowHealthStatus> {
    const factory = new WorkflowFactory();
    const engine = factory.createEngine();

    const start = process.hrtime.bigint();
    let isPingOk = false;
    try {
      isPingOk = await engine.ping();
    } catch {
      isPingOk = false;
    }
    const end = process.hrtime.bigint();
    const latencyMs = Math.round(Number(end - start) / 100000) / 10;

    return {
      status: isPingOk ? 'ok' : 'degraded',
      engine: engine.name,
      ping: isPingOk,
      latencyMs,
      capabilities: engine.capabilities,
      timestamp: new Date().toISOString(),
    };
  }
}
