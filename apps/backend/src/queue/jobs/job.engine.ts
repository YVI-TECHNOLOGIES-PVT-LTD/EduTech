import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';
import { JobMetadata, PriorityLevel } from '../contracts/queue.contracts';
import { RequestContextProviderStore } from '../../core/request-context/request-context.provider';
import { TraceContextProviderStore } from '../../observability/trace/trace.engine';

const jobContextStorage = new AsyncLocalStorage<JobMetadata>();

export class JobContextProviderStore {
  public static run(metadata: JobMetadata, callback: () => void): void {
    jobContextStorage.run(metadata, callback);
  }

  public static current(): JobMetadata | undefined {
    return jobContextStorage.getStore();
  }
}

export class JobBuilder {
  public static formatQueueName(module: string, queueName: string, version = 'v1'): string {
    const env = process.env.NODE_ENV || 'development';
    return `${env}:edutrack:${module}:${queueName}:${version}`;
  }

  public static createMetadata(priority = PriorityLevel.NORMAL, maxRetries = 3): JobMetadata {
    const reqCtx = RequestContextProviderStore.current();
    const traceCtx = TraceContextProviderStore.current();

    return {
      jobId: `job_${crypto.randomUUID().replace(/-/g, '')}`,
      requestId: reqCtx?.requestId,
      correlationId: reqCtx?.correlationId,
      traceId: traceCtx?.traceId,
      tenantId: reqCtx?.tenantId || reqCtx?.user?.orgId,
      userId: reqCtx?.user?.id,
      priority,
      attemptsMade: 0,
      maxRetries,
      createdAt: new Date(),
    };
  }
}

export class JobSerializer {
  public static serialize<T>(data: T): string {
    return JSON.stringify(data);
  }

  public static deserialize<T>(payload: string): T {
    return JSON.parse(payload);
  }
}
