import { QueueJobPayload } from '../contracts/queue.contracts';
import { QueueManager } from '../manager/queue.manager';
import { loggerService } from '../../observability/logger.service';

export class SchedulerManager {
  private static instance: SchedulerManager;
  private activeTimers = new Map<string, NodeJS.Timeout>();

  public static getInstance(): SchedulerManager {
    if (!SchedulerManager.instance) {
      SchedulerManager.instance = new SchedulerManager();
    }
    return SchedulerManager.instance;
  }

  public scheduleInterval(queueName: string, jobName: string, data: any, intervalMs: number): string {
    const timerId = `sched_${queueName}_${jobName}_${Date.now()}`;
    const timer = setInterval(async () => {
      loggerService.debug(`⏰ Executing scheduled interval job: ${jobName} on queue ${queueName}`);
      await QueueManager.getInstance().enqueue(queueName, jobName, data);
    }, intervalMs);

    this.activeTimers.set(timerId, timer);
    return timerId;
  }

  public cancelSchedule(timerId: string): void {
    const timer = this.activeTimers.get(timerId);
    if (timer) {
      clearInterval(timer);
      this.activeTimers.delete(timerId);
    }
  }

  public getActiveCount(): number {
    return this.activeTimers.size;
  }
}

export const schedulerManager = SchedulerManager.getInstance();
