import crypto from 'crypto';
import { IWorkflowEngine, WorkflowCapabilities, StateTransitionPayload, WorkflowStateResult } from '../contracts/workflow.contracts';
import { WorkflowRegistry } from '../registry/workflow.registry';
import { StateMachine } from '../state/workflow.state';
import { WorkflowContext } from '../context/workflow.context';
import { DeliveryTracker } from '../../notification/tracking/delivery.tracker';

export class MemoryWorkflowEngine implements IWorkflowEngine {
  public readonly name = 'memory';
  public readonly capabilities: WorkflowCapabilities = {
    supportsStatecharts: true,
    supportsBpmn: true,
    supportsCompensation: true,
    supportsTimers: true,
    supportsHumanTasks: true,
    supportsParallelSteps: true,
  };

  private instances = new Map<string, WorkflowStateResult>();

  public async startWorkflow(definitionKey: string, initialVariables?: Record<string, any>): Promise<WorkflowStateResult> {
    const def = WorkflowRegistry.get(definitionKey);
    if (!def) throw new Error(`Workflow definition ${definitionKey} not found in registry.`);

    const workflowId = crypto.randomUUID();
    const result: WorkflowStateResult = {
      workflowId,
      definitionKey,
      currentState: def.initialState,
      status: 'active',
      variables: initialVariables || {},
      updatedAt: new Date(),
    };

    this.instances.set(workflowId, result);
    return result;
  }

  public async transition(payload: StateTransitionPayload): Promise<WorkflowStateResult> {
    const instance = this.instances.get(payload.workflowId);
    if (!instance) throw new Error(`Workflow instance ${payload.workflowId} not found.`);

    const def = WorkflowRegistry.get(instance.definitionKey);
    if (!def) throw new Error(`Workflow definition ${instance.definitionKey} not found.`);

    const context = new WorkflowContext({ workflowId: instance.workflowId, variables: instance.variables });
    const { nextState, success } = StateMachine.transition(def, instance.currentState, payload.triggerEvent, context);

    if (!success) {
      throw new Error(`Invalid transition trigger ${payload.triggerEvent} from state ${instance.currentState}`);
    }

    instance.previousState = instance.currentState;
    instance.currentState = nextState;
    instance.updatedAt = new Date();

    if (payload.payload) {
      instance.variables = { ...instance.variables, ...payload.payload };
    }

    this.instances.set(instance.workflowId, instance);
    return instance;
  }

  public async getWorkflowState(workflowId: string): Promise<WorkflowStateResult | null> {
    return this.instances.get(workflowId) || null;
  }

  public async compensate(workflowId: string): Promise<WorkflowStateResult> {
    const instance = this.instances.get(workflowId);
    if (!instance) throw new Error(`Workflow instance ${workflowId} not found.`);
    instance.status = 'compensated';
    instance.updatedAt = new Date();
    this.instances.set(workflowId, instance);
    return instance;
  }

  public async ping(): Promise<boolean> { return true; }
}

export class NoopWorkflowEngine implements IWorkflowEngine {
  public readonly name = 'noop';
  public readonly capabilities: WorkflowCapabilities = {
    supportsStatecharts: false,
    supportsBpmn: false,
    supportsCompensation: false,
    supportsTimers: false,
    supportsHumanTasks: false,
    supportsParallelSteps: false,
  };

  public async startWorkflow(_definitionKey: string): Promise<WorkflowStateResult> {
    return { workflowId: 'noop', definitionKey: 'noop', currentState: 'COMPLETED', status: 'completed', variables: {}, updatedAt: new Date() };
  }
  public async transition(_payload: StateTransitionPayload): Promise<WorkflowStateResult> {
    return { workflowId: 'noop', definitionKey: 'noop', currentState: 'COMPLETED', status: 'completed', variables: {}, updatedAt: new Date() };
  }
  public async getWorkflowState(_workflowId: string): Promise<WorkflowStateResult | null> { return null; }
  public async compensate(_workflowId: string): Promise<WorkflowStateResult> {
    return { workflowId: 'noop', definitionKey: 'noop', currentState: 'COMPENSATED', status: 'compensated', variables: {}, updatedAt: new Date() };
  }
  public async ping(): Promise<boolean> { return true; }
}

export class StatechartEngine extends MemoryWorkflowEngine {
  public override readonly name = 'statechart';
}

export class BpmnEngine extends MemoryWorkflowEngine {
  public override readonly name = 'bpmn';
}
