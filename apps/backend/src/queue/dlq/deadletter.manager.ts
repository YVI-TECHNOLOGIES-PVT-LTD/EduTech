import { QueueJobPayload } from '../contracts/queue.contracts';
import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';

export class DeadLetterManager {
  private static dlqStore = new Map<string, QueueJobPayload[]>();
  private static metrics = MetricsRegistry.getInstance();

  public static formatDlqName(queueName: string): string {
    return `${queueName}:dlq`;
  }

  public static async moveToDlq(
    queueName: string,
    job: QueueJobPayload,
    error: any,
  ): Promise<void> {
    const dlqName = this.formatDlqName(queueName);
    job.state = 'DeadLetter';

    const list = this.dlqStore.get(dlqName) || [];
    list.push(job);
    this.dlqStore.set(dlqName, list);

    this.metrics.incrementCounter('queue_dlq_total');
    loggerService.error(`☠️ [Dead Letter Queue] Job ${job.id} moved to ${dlqName}`, error, {
      jobId: job.id,
      queue: queueName,
      dlq: dlqName,
      attempts: job.metadata.attemptsMade,
    });
  }

  public static getDlqJobs(queueName: string): QueueJobPayload[] {
    const dlqName = this.formatDlqName(queueName);
    return this.dlqStore.get(dlqName) || [];
  }

  public static getDlqSize(queueName: string): number {
    return this.getDlqJobs(queueName).length;
  }
}
