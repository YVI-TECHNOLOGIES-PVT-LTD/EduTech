export interface WorkflowCapabilities {
  readonly supportsStatecharts: boolean;
  readonly supportsBpmn: boolean;
  readonly supportsCompensation: boolean;
  readonly supportsTimers: boolean;
  readonly supportsHumanTasks: boolean;
  readonly supportsParallelSteps: boolean;
}

export interface StateTransitionPayload {
  workflowId: string;
  definitionKey: string;
  triggerEvent: string;
  payload?: any;
}

export interface WorkflowStateResult {
  workflowId: string;
  definitionKey: string;
  currentState: string;
  previousState?: string;
  status: 'active' | 'completed' | 'suspended' | 'failed' | 'compensated';
  variables: Record<string, any>;
  updatedAt: Date;
}

export interface WorkflowDefinition {
  key: string;
  version: string;
  initialState: string;
  states: Record<
    string,
    {
      on?: Record<string, string>; // Event -> TargetState
      guards?: string[];
      entryActions?: string[];
      exitActions?: string[];
      compensationActions?: string[];
    }
  >;
}

export interface IWorkflowEngine {
  readonly name: string;
  readonly capabilities: WorkflowCapabilities;
  startWorkflow(definitionKey: string, initialVariables?: Record<string, any>): Promise<WorkflowStateResult>;
  transition(payload: StateTransitionPayload): Promise<WorkflowStateResult>;
  getWorkflowState(workflowId: string): Promise<WorkflowStateResult | null>;
  compensate(workflowId: string): Promise<WorkflowStateResult>;
  ping(): Promise<boolean>;
}
