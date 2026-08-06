import { loggerService } from '../../observability/logger.service';

export interface WorkflowAuditRecord {
  workflowId: string;
  definitionKey: string;
  fromState: string;
  toState: string;
  triggerEvent: string;
  actor?: string;
  durationMs: number;
}

export class WorkflowAuditLogger {
  public static log(record: WorkflowAuditRecord): void {
    loggerService.info(`⚙️ [Workflow Transition] ${record.definitionKey} (${record.workflowId}): ${record.fromState} -> ${record.toState} via ${record.triggerEvent}`, {
      workflowId: record.workflowId,
      definitionKey: record.definitionKey,
      fromState: record.fromState,
      toState: record.toState,
      triggerEvent: record.triggerEvent,
      actor: record.actor || 'system',
      durationMs: record.durationMs,
    });
  }
}
