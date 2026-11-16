import { logger } from '../utils/logger';
import { cacheService } from '../cache/cache.service';

export class SchedulerService {
  private isRunning = false;
  private isTicking = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.warn(
      '[SchedulerService] Centralized System Scheduler started in IN_MEMORY_BEST_EFFORT mode (non-durable)',
    );

    // Run scheduled maintenance every 10 minutes
    this.intervalId = setInterval(
      async () => {
        if (this.isTicking || !this.isRunning) return;
        this.isTicking = true;
        try {
          await this.runScheduledTasks();
        } catch (err: any) {
          logger.error('[SchedulerService] Unhandled scheduled tick error:', err);
        } finally {
          this.isTicking = false;
        }
      },
      10 * 60 * 1000,
    );
    this.intervalId.unref?.();
  }

  stop() {
    if (!this.isRunning && !this.intervalId) return;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('[SchedulerService] Centralized System Scheduler stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isTicking: this.isTicking,
      mode: 'IN_MEMORY_BEST_EFFORT' as const,
      durable: false as const,
      persistence: 'volatile_process_memory' as const,
      intervalMs: 10 * 60 * 1000,
    };
  }

  private async runScheduledTasks() {
    logger.info('[Scheduler] Running periodic maintenance tasks...');
    // Expired cache cleanup trigger
    await cacheService.invalidatePattern('v1:cache:temp:*');
    logger.info('[Scheduler] Completed periodic maintenance tasks.');
  }
}

export const schedulerService = new SchedulerService();
