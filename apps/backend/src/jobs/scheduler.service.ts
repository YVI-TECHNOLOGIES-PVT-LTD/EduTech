import { logger } from '../utils/logger';
import { cacheService } from '../cache/cache.service';

export class SchedulerService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('[SchedulerService] Centralized System Scheduler started');

    // Run scheduled maintenance every 10 minutes
    this.intervalId = setInterval(async () => {
      await this.runScheduledTasks();
    }, 10 * 60 * 1000);
  }

  stop() {
    if (!this.isRunning) return;
    if (this.intervalId) clearInterval(this.intervalId);
    this.isRunning = false;
    logger.info('[SchedulerService] Centralized System Scheduler stopped');
  }

  private async runScheduledTasks() {
    logger.info('[Scheduler] Running periodic maintenance tasks...');
    // Expired cache cleanup trigger
    await cacheService.invalidatePattern('v1:cache:temp:*');
    logger.info('[Scheduler] Completed periodic maintenance tasks.');
  }
}

export const schedulerService = new SchedulerService();
