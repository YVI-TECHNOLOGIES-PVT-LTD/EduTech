import { IWorkflowEngine } from '../contracts/workflow.contracts';
import { StatechartEngine, BpmnEngine, MemoryWorkflowEngine, NoopWorkflowEngine } from '../engines/workflow.engines';
import { configuration } from '../../config';

export class WorkflowFactory {
  public createEngine(name?: string): IWorkflowEngine {
    const engineName = name || (configuration as any)?.workflow?.engine || 'memory';

    switch (engineName.toLowerCase()) {
      case 'statechart':
        return new StatechartEngine();
      case 'bpmn':
        return new BpmnEngine();
      case 'noop':
        return new NoopWorkflowEngine();
      case 'memory':
      default:
        return new MemoryWorkflowEngine();
    }
  }
}
