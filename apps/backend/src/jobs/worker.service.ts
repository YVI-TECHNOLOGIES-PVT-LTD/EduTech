import { queueAdapter } from './queue.adapter';
import { QueueName, JobPayload } from './job.types';
import { logger } from '../utils/logger';

export class WorkerService {
  private isRunning = false;
  private isTicking = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.warn(
      '[WorkerService] Background Worker Runtime started in IN_MEMORY_BEST_EFFORT mode (non-durable)',
    );

    this.intervalId = setInterval(async () => {
      if (this.isTicking || !this.isRunning) return;
      this.isTicking = true;
      try {
        await this.processAllQueues();
      } catch (err: any) {
        logger.error('[WorkerService] Unhandled tick error:', err);
      } finally {
        this.isTicking = false;
      }
    }, 3000);
    this.intervalId.unref?.();
  }

  stop() {
    if (!this.isRunning && !this.intervalId) return;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    queueAdapter.clearRetryTimers();
    this.isRunning = false;
    logger.info('[WorkerService] Background Worker Runtime stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isTicking: this.isTicking,
      ...queueAdapter.getRuntimeMetadata(),
    };
  }

  private async processAllQueues() {
    const queues: QueueName[] = [
      'email-queue',
      'sms-queue',
      'push-queue',
      'report-queue',
      'export-queue',
      'import-queue',
      'audit-queue',
    ];

    for (const q of queues) {
      await queueAdapter.processNext(q, async (job: JobPayload) => {
        logger.info(`[Worker Executed] Handled ${job.type} (ID: ${job.id}) on ${q}`);
      });
    }
  }
}

export const workerService = new WorkerService();
