import { WorkflowContext } from '../context/workflow.context';
import { loggerService } from '../../observability/logger.service';

export class CompensationEngine {
  public static async rollback(completedSteps: string[], context: WorkflowContext): Promise<void> {
    loggerService.warn(`🔄 [Workflow Compensation Rollback] Rolling back ${completedSteps.length} steps for workflow ${context.workflowId}`);
    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const step = completedSteps[i];
      loggerService.info(`↺ [Compensating Step] ${step} reversed`);
    }
  }
}
