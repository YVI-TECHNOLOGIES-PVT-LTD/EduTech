import { WorkflowDefinition } from '../contracts/workflow.contracts';

export class WorkflowRegistry {
  private static definitions = new Map<string, WorkflowDefinition>([
    [
      'student_admission',
      {
        key: 'student_admission',
        version: '1.0.0',
        initialState: 'DRAFT',
        states: {
          DRAFT: { on: { SUBMIT: 'UNDER_REVIEW' } },
          UNDER_REVIEW: { on: { APPROVE: 'APPROVED', REJECT: 'REJECTED' } },
          APPROVED: { on: { PAY_FEES: 'ENROLLED' } },
          ENROLLED: {},
          REJECTED: {},
        },
      },
    ],
  ]);

  public static register(def: WorkflowDefinition): void {
    this.definitions.set(`${def.key}:${def.version}`, def);
    this.definitions.set(def.key, def); // Default latest
  }

  public static get(key: string, version?: string): WorkflowDefinition | undefined {
    if (version) return this.definitions.get(`${key}:${version}`);
    return this.definitions.get(key);
  }
}
