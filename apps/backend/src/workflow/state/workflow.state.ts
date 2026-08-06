import { WorkflowDefinition, WorkflowStateResult } from '../contracts/workflow.contracts';
import { WorkflowContext } from '../context/workflow.context';
import { loggerService } from '../../observability/logger.service';

export class TransitionGuard {
  public static canTransition(
    def: WorkflowDefinition,
    fromState: string,
    triggerEvent: string,
    context: WorkflowContext
  ): boolean {
    const stateConfig = def.states[fromState];
    if (!stateConfig || !stateConfig.on) return false;
    return Boolean(stateConfig.on[triggerEvent]);
  }
}

export class ActionExecutor {
  public static async executeActions(actions?: string[], context?: WorkflowContext): Promise<void> {
    if (!actions || actions.length === 0) return;
    for (const action of actions) {
      loggerService.info(`⚡ [Workflow Action Executed] ${action} (Workflow: ${context?.workflowId})`);
    }
  }
}

export class StateMachine {
  public static transition(
    def: WorkflowDefinition,
    currentState: string,
    event: string,
    context: WorkflowContext
  ): { nextState: string; success: boolean } {
    const canDo = TransitionGuard.canTransition(def, currentState, event, context);
    if (!canDo) {
      return { nextState: currentState, success: false };
    }

    const nextState = def.states[currentState].on![event];
    return { nextState, success: true };
  }
}
