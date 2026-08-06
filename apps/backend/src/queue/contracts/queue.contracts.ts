export enum PriorityLevel {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
  BACKGROUND = 5,
}

export type JobState =
  | 'Waiting'
  | 'Active'
  | 'Delayed'
  | 'Completed'
  | 'Failed'
  | 'Retrying'
  | 'Cancelled'
  | 'DeadLetter';

export interface JobMetadata {
  jobId: string;
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  tenantId?: string;
  userId?: string;
  priority: PriorityLevel;
  attemptsMade: number;
  maxRetries: number;
  createdAt: Date;
  scheduledAt?: Date;
}

export interface QueueJobPayload<T = any> {
  id: string;
  name: string;
  data: T;
  metadata: JobMetadata;
  state: JobState;
}

export interface QueueCapabilities {
  readonly supportsDelay: boolean;
  readonly supportsRepeat: boolean;
  readonly supportsPriority: boolean;
  readonly supportsRateLimit: boolean;
  readonly supportsBulk: boolean;
}

export interface QueueEnqueueOptions {
  priority?: PriorityLevel;
  delayMs?: number;
  retries?: number;
  backoffMs?: number;
  idempotencyKey?: string;
  repeatCron?: string;
}

export interface IQueueProvider {
  readonly name: string;
  readonly capabilities: QueueCapabilities;
  enqueue<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: QueueEnqueueOptions,
  ): Promise<QueueJobPayload<T>>;
  enqueueBulk<T = any>(
    queueName: string,
    jobs: { name: string; data: T; options?: QueueEnqueueOptions }[],
  ): Promise<QueueJobPayload<T>[]>;
  getJob<T = any>(queueName: string, jobId: string): Promise<QueueJobPayload<T> | null>;
  cancelJob(queueName: string, jobId: string): Promise<void>;
  clearQueue(queueName: string): Promise<void>;
  ping(): Promise<boolean>;
}

export interface WorkerLifecycleHooks {
  beforeStart?(): Promise<void>;
  afterStart?(): Promise<void>;
  beforeJob?(job: QueueJobPayload): Promise<void>;
  afterJob?(job: QueueJobPayload, result: any): Promise<void>;
  onRetry?(job: QueueJobPayload, error: any): Promise<void>;
  onFailure?(job: QueueJobPayload, error: any): Promise<void>;
  beforeShutdown?(): Promise<void>;
  afterShutdown?(): Promise<void>;
}
