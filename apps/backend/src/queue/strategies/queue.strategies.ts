import { IQueueProvider, QueueJobPayload, QueueEnqueueOptions, PriorityLevel } from '../contracts/queue.contracts';

export class FireAndForgetStrategy {
  public static async execute<T>(provider: IQueueProvider, queueName: string, jobName: string, data: T): Promise<QueueJobPayload<T>> {
    return provider.enqueue(queueName, jobName, data, { retries: 0 });
  }
}

export class ReliableStrategy {
  public static async execute<T>(provider: IQueueProvider, queueName: string, jobName: string, data: T, retries = 3): Promise<QueueJobPayload<T>> {
    return provider.enqueue(queueName, jobName, data, { retries });
  }
}

export class PriorityStrategy {
  public static async execute<T>(provider: IQueueProvider, queueName: string, jobName: string, data: T, priority: PriorityLevel): Promise<QueueJobPayload<T>> {
    return provider.enqueue(queueName, jobName, data, { priority });
  }
}

export class ScheduledStrategy {
  public static async execute<T>(provider: IQueueProvider, queueName: string, jobName: string, data: T, delayMs: number): Promise<QueueJobPayload<T>> {
    return provider.enqueue(queueName, jobName, data, { delayMs });
  }
}

export class BatchStrategy {
  public static async execute<T>(provider: IQueueProvider, queueName: string, jobs: { name: string; data: T; options?: QueueEnqueueOptions }[]): Promise<QueueJobPayload<T>[]> {
    return provider.enqueueBulk(queueName, jobs);
  }
}
