import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';

export enum WorkflowEventType {
  STARTED = 'WorkflowStarted',
  STEP_STARTED = 'StepStarted',
  STEP_COMPLETED = 'StepCompleted',
  COMPENSATED = 'WorkflowCompensated',
  COMPLETED = 'WorkflowCompleted',
}

export class WorkflowEvents {
  private static metrics = MetricsRegistry.getInstance();

  public static emit(type: WorkflowEventType, workflowId: string, meta?: Record<string, any>): void {
    this.metrics.incrementCounter(`workflow_${type.toLowerCase()}_total`);
    loggerService.debug(`⚙️ [Workflow Event: ${type}] Workflow ID: ${workflowId}`, meta);
  }
}
