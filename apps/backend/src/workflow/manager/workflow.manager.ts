import { IWorkflowEngine, StateTransitionPayload, WorkflowStateResult } from '../contracts/workflow.contracts';
import { WorkflowFactory } from '../factory/workflow.factory';
import { CompensationEngine } from '../compensation/compensation.engine';
import { WorkflowContext } from '../context/workflow.context';
import { cacheManager } from '../../cache/manager/cache.manager';
import { queueManager } from '../../queue/manager/queue.manager';
import { WorkflowAuditLogger } from '../audit/workflow.audit';
import { WorkflowEvents, WorkflowEventType } from '../events/workflow.events';

export class WorkflowManager {
  private static instance: WorkflowManager;
  private engine: IWorkflowEngine;

  private constructor() {
    const factory = new WorkflowFactory();
    this.engine = factory.createEngine();
  }

  public static getInstance(): WorkflowManager {
    if (!WorkflowManager.instance) {
      WorkflowManager.instance = new WorkflowManager();
    }
    return WorkflowManager.instance;
  }

  public async startWorkflow(definitionKey: string, initialVariables?: Record<string, any>): Promise<WorkflowStateResult> {
    const result = await this.engine.startWorkflow(definitionKey, initialVariables);
    await cacheManager.set(`workflow:state:${result.workflowId}`, result, { ttlSeconds: 3600 });
    WorkflowEvents.emit(WorkflowEventType.STARTED, result.workflowId, { definitionKey });
    return result;
  }

  public async transition(payload: StateTransitionPayload): Promise<WorkflowStateResult> {
    const start = process.hrtime.bigint();
    const result = await this.engine.transition(payload);

    await cacheManager.set(`workflow:state:${result.workflowId}`, result, { ttlSeconds: 3600 });
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1000000;

    WorkflowAuditLogger.log({
      workflowId: result.workflowId,
      definitionKey: result.definitionKey,
      fromState: result.previousState || 'UNKNOWN',
      toState: result.currentState,
      triggerEvent: payload.triggerEvent,
      durationMs,
    });
    WorkflowEvents.emit(WorkflowEventType.STEP_COMPLETED, result.workflowId, { nextState: result.currentState });

    return result;
  }

  public async getWorkflowState(workflowId: string): Promise<WorkflowStateResult | null> {
    const cached = await cacheManager.get<WorkflowStateResult>(`workflow:state:${workflowId}`);
    if (cached) return cached;
    return this.engine.getWorkflowState(workflowId);
  }

  public async compensate(workflowId: string): Promise<WorkflowStateResult> {
    const context = new WorkflowContext({ workflowId });
    await CompensationEngine.rollback(['INITIAL_STEP'], context);
    const result = await this.engine.compensate(workflowId);
    WorkflowEvents.emit(WorkflowEventType.COMPENSATED, workflowId);
    return result;
  }

  public async executeAsync(payload: StateTransitionPayload): Promise<void> {
    await queueManager.enqueue('workflow:dispatch', 'transition_workflow', payload);
  }
}

export const workflowManager = WorkflowManager.getInstance();
