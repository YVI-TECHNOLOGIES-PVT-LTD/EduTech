import { WorkflowContext } from '../context/workflow.context';

export interface DecisionRule {
  id: string;
  conditions: (context: WorkflowContext) => boolean;
  result: any;
}

export class DecisionTable {
  constructor(private rules: DecisionRule[]) {}

  public evaluate(context: WorkflowContext): any | null {
    for (const rule of this.rules) {
      if (rule.conditions(context)) {
        return rule.result;
      }
    }
    return null;
  }
}
