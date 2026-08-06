import { QueueJobPayload, WorkerLifecycleHooks } from '../contracts/queue.contracts';
import { JobContextProviderStore } from '../jobs/job.engine';
import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';
import { DeadLetterManager } from '../dlq/deadletter.manager';

export type JobProcessor<T = any> = (job: QueueJobPayload<T>) => Promise<any>;

export class WorkerManager {
  private static instance: WorkerManager;
  private processors = new Map<string, JobProcessor>();
  private hooks: WorkerLifecycleHooks = {};
  private metrics = MetricsRegistry.getInstance();

  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  public registerHooks(hooks: WorkerLifecycleHooks): void {
    this.hooks = { ...this.hooks, ...hooks };
  }

  public registerProcessor<T>(jobName: string, processor: JobProcessor<T>): void {
    this.processors.set(jobName, processor);
    loggerService.info(`👷 Registered worker processor for job: ${jobName}`);
  }

  public async processJob(job: QueueJobPayload): Promise<any> {
    const processor = this.processors.get(job.name);
    if (!processor) {
      loggerService.warn(`⚠️ No worker processor registered for job: ${job.name}`);
      return;
    }

    job.state = 'Active';
    if (this.hooks.beforeJob) await this.hooks.beforeJob(job);

    const start = process.hrtime.bigint();
    try {
      let result: any;
      JobContextProviderStore.run(job.metadata, async () => {
        result = await processor(job);
      });

      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1000000;

      job.state = 'Completed';
      this.metrics.incrementCounter('jobs_completed_total');
      this.metrics.recordDuration('job_execution_duration_ms', durationMs);

      if (this.hooks.afterJob) await this.hooks.afterJob(job, result);
      return result;
    } catch (err: any) {
      job.metadata.attemptsMade++;
      this.metrics.incrementCounter('jobs_failed_total');

      if (job.metadata.attemptsMade >= job.metadata.maxRetries) {
        await DeadLetterManager.moveToDlq(job.name, job, err);
        if (this.hooks.onFailure) await this.hooks.onFailure(job, err);
      } else {
        job.state = 'Retrying';
        if (this.hooks.onRetry) await this.hooks.onRetry(job, err);
      }
      throw err;
    }
  }
}

export const workerManager = WorkerManager.getInstance();
