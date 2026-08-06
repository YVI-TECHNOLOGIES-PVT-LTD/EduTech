import {
  IQueueProvider,
  QueueCapabilities,
  QueueJobPayload,
  QueueEnqueueOptions,
  PriorityLevel,
} from '../contracts/queue.contracts';
import { JobBuilder } from '../jobs/job.engine';

export class InMemoryQueueProvider implements IQueueProvider {
  public readonly name = 'memory';
  public readonly capabilities: QueueCapabilities = {
    supportsDelay: true,
    supportsRepeat: true,
    supportsPriority: true,
    supportsRateLimit: true,
    supportsBulk: true,
  };

  private queues = new Map<string, QueueJobPayload[]>();

  public async enqueue<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: QueueEnqueueOptions,
  ): Promise<QueueJobPayload<T>> {
    const metadata = JobBuilder.createMetadata(
      options?.priority || PriorityLevel.NORMAL,
      options?.retries || 3,
    );
    const job: QueueJobPayload<T> = {
      id: metadata.jobId,
      name: jobName,
      data,
      metadata,
      state: options?.delayMs ? 'Delayed' : 'Waiting',
    };

    const list = this.queues.get(queueName) || [];
    list.push(job);
    this.queues.set(queueName, list);

    return job;
  }

  public async enqueueBulk<T = any>(
    queueName: string,
    jobs: { name: string; data: T; options?: QueueEnqueueOptions }[],
  ): Promise<QueueJobPayload<T>[]> {
    return Promise.all(jobs.map((j) => this.enqueue(queueName, j.name, j.data, j.options)));
  }

  public async getJob<T = any>(
    queueName: string,
    jobId: string,
  ): Promise<QueueJobPayload<T> | null> {
    const list = this.queues.get(queueName) || [];
    const found = list.find((j) => j.id === jobId);
    return (found as QueueJobPayload<T>) || null;
  }

  public async cancelJob(queueName: string, jobId: string): Promise<void> {
    const list = this.queues.get(queueName) || [];
    const index = list.findIndex((j) => j.id === jobId);
    if (index !== -1) {
      list[index].state = 'Cancelled';
    }
  }

  public async clearQueue(queueName: string): Promise<void> {
    this.queues.set(queueName, []);
  }

  public async ping(): Promise<boolean> {
    return true;
  }
}

export class NoopQueueProvider implements IQueueProvider {
  public readonly name = 'noop';
  public readonly capabilities: QueueCapabilities = {
    supportsDelay: false,
    supportsRepeat: false,
    supportsPriority: false,
    supportsRateLimit: false,
    supportsBulk: false,
  };

  public async enqueue<T = any>(
    queueName: string,
    jobName: string,
    data: T,
  ): Promise<QueueJobPayload<T>> {
    const metadata = JobBuilder.createMetadata();
    return { id: metadata.jobId, name: jobName, data, metadata, state: 'Completed' };
  }

  public async enqueueBulk<T = any>(
    queueName: string,
    jobs: { name: string; data: T }[],
  ): Promise<QueueJobPayload<T>[]> {
    return jobs.map((j) => ({
      id: `noop_${Math.random()}`,
      name: j.name,
      data: j.data,
      metadata: JobBuilder.createMetadata(),
      state: 'Completed',
    }));
  }

  public async getJob<T = any>(
    _queueName: string,
    _jobId: string,
  ): Promise<QueueJobPayload<T> | null> {
    return null;
  }
  public async cancelJob(_queueName: string, _jobId: string): Promise<void> {}
  public async clearQueue(_queueName: string): Promise<void> {}
  public async ping(): Promise<boolean> {
    return true;
  }
}

export class BullMQQueueProvider implements IQueueProvider {
  public readonly name = 'bullmq';
  public readonly capabilities: QueueCapabilities = {
    supportsDelay: true,
    supportsRepeat: true,
    supportsPriority: true,
    supportsRateLimit: true,
    supportsBulk: true,
  };

  private memoryFallback = new InMemoryQueueProvider();

  public async enqueue<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: QueueEnqueueOptions,
  ): Promise<QueueJobPayload<T>> {
    return this.memoryFallback.enqueue(queueName, jobName, data, options);
  }

  public async enqueueBulk<T = any>(
    queueName: string,
    jobs: { name: string; data: T; options?: QueueEnqueueOptions }[],
  ): Promise<QueueJobPayload<T>[]> {
    return this.memoryFallback.enqueueBulk(queueName, jobs);
  }

  public async getJob<T = any>(
    queueName: string,
    jobId: string,
  ): Promise<QueueJobPayload<T> | null> {
    return this.memoryFallback.getJob<T>(queueName, jobId);
  }

  public async cancelJob(queueName: string, jobId: string): Promise<void> {
    await this.memoryFallback.cancelJob(queueName, jobId);
  }

  public async clearQueue(queueName: string): Promise<void> {
    await this.memoryFallback.clearQueue(queueName);
  }

  public async ping(): Promise<boolean> {
    return true;
  }
}
