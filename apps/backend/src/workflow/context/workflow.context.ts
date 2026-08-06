export interface WorkflowContextOptions {
  workflowId: string;
  tenantId?: string;
  initiator?: string;
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class WorkflowContext {
  public readonly workflowId: string;
  public readonly tenantId?: string;
  public readonly initiator?: string;
  public variables: Record<string, any>;
  public metadata: Record<string, any>;

  constructor(options: WorkflowContextOptions) {
    this.workflowId = options.workflowId;
    this.tenantId = options.tenantId;
    this.initiator = options.initiator;
    this.variables = options.variables || {};
    this.metadata = options.metadata || {};
  }

  public getVariable<T = any>(key: string): T | undefined {
    return this.variables[key];
  }

  public setVariable(key: string, value: any): void {
    this.variables[key] = value;
  }
}
