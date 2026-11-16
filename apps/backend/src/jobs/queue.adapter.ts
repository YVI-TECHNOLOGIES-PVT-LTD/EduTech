import { QueueName, JobPayload } from './job.types';
import { QUEUE_CONFIGS } from './job.constants';
import { logger } from '../utils/logger';

export class QueueAdapter {
  private static readonly MAX_PROCESSED_HISTORY = 5000;
  private queues: Map<QueueName, JobPayload[]> = new Map();
  private deadLetterQueues: Map<string, JobPayload[]> = new Map();
  private processedJobIds: Set<string> = new Set();
  private processedOrder: string[] = [];
  private retryTimers: Set<NodeJS.Timeout> = new Set();

  constructor() {
    Object.keys(QUEUE_CONFIGS).forEach((queue) => {
      this.queues.set(queue as QueueName, []);
      this.deadLetterQueues.set(QUEUE_CONFIGS[queue as QueueName].dlqName, []);
    });
  }

  private recordProcessedJob(jobId: string): void {
    if (this.processedJobIds.has(jobId)) return;
    this.processedJobIds.add(jobId);
    this.processedOrder.push(jobId);

    while (this.processedOrder.length > QueueAdapter.MAX_PROCESSED_HISTORY) {
      const oldest = this.processedOrder.shift();
      if (oldest) {
        this.processedJobIds.delete(oldest);
      }
    }
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

    logger.info(
      `[Queue ENQUEUE] Job ${job.id} added to ${queueName} (maxRetries=${config.maxRetries})`,
    );
    return job;
  }

  async processNext(
    queueName: QueueName,
    handler: (job: JobPayload) => Promise<void>,
  ): Promise<boolean> {
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
      this.recordProcessedJob(job.id);
      logger.info(`[Queue SUCCESS] Job ${job.id} completed on ${queueName}`);
      return true;
    } catch (err: any) {
      logger.error(
        `[Queue ERROR] Job ${job.id} failed attempt ${job.attempts}/${config.maxRetries}:`,
        err,
      );

      if (job.attempts < config.maxRetries) {
        // Re-enqueue for retry after backoff (tracked + unref'd for clean shutdown)
        const timer = setTimeout(() => {
          this.retryTimers.delete(timer);
          queue.push(job);
        }, config.backoffMs);
        timer.unref?.();
        this.retryTimers.add(timer);
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

  clearRetryTimers(): void {
    for (const timer of this.retryTimers) {
      clearTimeout(timer);
    }
    this.retryTimers.clear();
  }

  getRuntimeMetadata() {
    return {
      mode: 'IN_MEMORY_BEST_EFFORT' as const,
      durable: false as const,
      persistence: 'volatile_process_memory' as const,
      processedHistorySize: this.processedJobIds.size,
      maxProcessedHistory: QueueAdapter.MAX_PROCESSED_HISTORY,
      pendingRetryTimers: this.retryTimers.size,
      warning: 'In-memory queue is non-durable across restarts and single-instance only.',
    };
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
