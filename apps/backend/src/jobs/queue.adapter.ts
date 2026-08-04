import { QueueName, JobPayload } from './job.types';
import { QUEUE_CONFIGS } from './job.constants';
import { logger } from '../utils/logger';

export class QueueAdapter {
  private queues: Map<QueueName, JobPayload[]> = new Map();
  private deadLetterQueues: Map<string, JobPayload[]> = new Map();
  private processedJobIds: Set<string> = new Set();

  constructor() {
    Object.keys(QUEUE_CONFIGS).forEach((queue) => {
      this.queues.set(queue as QueueName, []);
      this.deadLetterQueues.set(QUEUE_CONFIGS[queue as QueueName].dlqName, []);
    });
  }

  async enqueue<T>(queueName: QueueName, type: string, data: T): Promise<JobPayload<T>> {
    const config = QUEUE_CONFIGS[queueName];
    const job: JobPayload<T> = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      data,
      createdAt: new Date().toISOString(),
      attempts: 0,
      version: 'v1',
    };

    const queue = this.queues.get(queueName) || [];
    queue.push(job);
    this.queues.set(queueName, queue);

    logger.info(`[Queue ENQUEUE] Job ${job.id} added to ${queueName}`);
    return job;
  }

  async processNext(queueName: QueueName, handler: (job: JobPayload) => Promise<void>): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue || queue.length === 0) return false;

    const job = queue.shift()!;
    const config = QUEUE_CONFIGS[queueName];

    // Idempotency Check
    if (this.processedJobIds.has(job.id)) {
      logger.warn(`[Queue IDEMPOTENCY] Job ${job.id} already processed. Skipping.`);
      return true;
    }

    job.attempts++;

    try {
      await handler(job);
      this.processedJobIds.add(job.id);
      logger.info(`[Queue SUCCESS] Job ${job.id} completed on ${queueName}`);
      return true;
    } catch (err: any) {
      logger.error(`[Queue ERROR] Job ${job.id} failed attempt ${job.attempts}/${config.maxRetries}:`, err);

      if (job.attempts < config.maxRetries) {
        // Re-enqueue for retry after backoff
        setTimeout(() => {
          queue.push(job);
        }, config.backoffMs);
      } else {
        // Send to Dead Letter Queue (DLQ)
        const dlq = this.deadLetterQueues.get(config.dlqName) || [];
        dlq.push(job);
        this.deadLetterQueues.set(config.dlqName, dlq);
        logger.error(`[Queue DLQ] Job ${job.id} moved to ${config.dlqName}`);
      }
      return false;
    }
  }

  getMetrics() {
    const metrics: Record<string, { depth: number; dlqDepth: number }> = {};
    for (const [queueName, config] of Object.entries(QUEUE_CONFIGS)) {
      const q = this.queues.get(queueName as QueueName) || [];
      const dlq = this.deadLetterQueues.get(config.dlqName) || [];
      metrics[queueName] = {
        depth: q.length,
        dlqDepth: dlq.length,
      };
    }
    return metrics;
  }
}

export const queueAdapter = new QueueAdapter();
