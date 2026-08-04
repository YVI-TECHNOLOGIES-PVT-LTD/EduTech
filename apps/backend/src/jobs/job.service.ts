import { QueueName, JobPayload } from './job.types';
import { queueAdapter } from './queue.adapter';
import { logger } from '../utils/logger';

export class JobService {
  private static instance: JobService;

  private constructor() {
    logger.info('[JobService] Initialized JobService abstraction layer');
  }

  public static getInstance(): JobService {
    if (!JobService.instance) {
      JobService.instance = new JobService();
    }
    return JobService.instance;
  }

  async enqueue<T>(queueName: QueueName, type: string, data: T): Promise<JobPayload<T>> {
    return queueAdapter.enqueue<T>(queueName, type, data);
  }

  async getMetrics() {
    return queueAdapter.getMetrics();
  }
}

export const jobService = JobService.getInstance();
