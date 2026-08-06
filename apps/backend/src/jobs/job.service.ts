import { QueueName, JobPayload } from './job.types';
import { queueManager } from '../queue/manager/queue.manager';
import { QueueHealthService } from '../queue/health/queue.health';

export class JobService {
  private static instance: JobService;

  public static getInstance(): JobService {
    if (!JobService.instance) {
      JobService.instance = new JobService();
    }
    return JobService.instance;
  }

  async enqueue<T>(queueName: QueueName, type: string, data: T): Promise<JobPayload<T>> {
    const job = await queueManager.enqueue<T>(queueName, type, data);
    return {
      id: job.id,
      queueName,
      type,
      data: job.data,
      status: job.state as any,
      createdAt:
        typeof job.metadata.createdAt === 'string'
          ? job.metadata.createdAt
          : job.metadata.createdAt.toISOString(),
    };
  }

  async getMetrics() {
    const health = await QueueHealthService.getStatus();
    return {
      provider: health.provider,
      status: health.status,
      activeSchedulers: health.activeSchedulers,
      latencyMs: health.latencyMs,
    };
  }
}

export const jobService = JobService.getInstance();
