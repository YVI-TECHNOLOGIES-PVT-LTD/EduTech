import {
  IQueueProvider,
  QueueJobPayload,
  QueueEnqueueOptions,
  PriorityLevel,
} from '../contracts/queue.contracts';
import { QueueFactory } from '../factory/queue.factory';
import { IdempotencyManager } from '../idempotency/idempotency.manager';
import { ReliableStrategy, BatchStrategy } from '../strategies/queue.strategies';

export class QueueManager {
  private static instance: QueueManager;
  private provider: IQueueProvider;
  private idempotency = new IdempotencyManager();

  private constructor() {
    const factory = new QueueFactory();
    this.provider = factory.createProvider();
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  public async enqueue<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: QueueEnqueueOptions,
  ): Promise<QueueJobPayload<T>> {
    if (options?.idempotencyKey) {
      if (this.idempotency.isDuplicate(options.idempotencyKey)) {
        const existing = await this.provider.getJob<T>(queueName, options.idempotencyKey);
        if (existing) return existing;
      }
      this.idempotency.markProcessed(options.idempotencyKey);
    }
    return ReliableStrategy.execute(this.provider, queueName, jobName, data, options?.retries);
  }

  public async enqueueBulk<T = any>(
    queueName: string,
    jobs: { name: string; data: T; options?: QueueEnqueueOptions }[],
  ): Promise<QueueJobPayload<T>[]> {
    return BatchStrategy.execute(this.provider, queueName, jobs);
  }

  public async getJob<T = any>(
    queueName: string,
    jobId: string,
  ): Promise<QueueJobPayload<T> | null> {
    return this.provider.getJob<T>(queueName, jobId);
  }

  public async cancelJob(queueName: string, jobId: string): Promise<void> {
    await this.provider.cancelJob(queueName, jobId);
  }

  public async clearQueue(queueName: string): Promise<void> {
    await this.provider.clearQueue(queueName);
  }
}

export const queueManager = QueueManager.getInstance();
