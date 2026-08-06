export interface QueueJob<T = any> {
  id: string;
  name: string;
  data: T;
  opts?: {
    attempts?: number;
    delay?: number;
    priority?: number;
  };
}

export interface IQueueService {
  enqueue<T = any>(job: QueueJob<T>): Promise<void>;
  enqueueBulk<T = any>(jobs: QueueJob<T>[]): Promise<void>;
}
