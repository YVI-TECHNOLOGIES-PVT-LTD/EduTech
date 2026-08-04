import { queueAdapter } from './queue.adapter';
import { QueueName, JobPayload } from './job.types';
import { logger } from '../utils/logger';

export class WorkerService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('[WorkerService] Background Worker Runtime started');

    this.intervalId = setInterval(async () => {
      await this.processAllQueues();
    }, 3000);
  }

  stop() {
    if (!this.isRunning) return;
    if (this.intervalId) clearInterval(this.intervalId);
    this.isRunning = false;
    logger.info('[WorkerService] Background Worker Runtime stopped');
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
