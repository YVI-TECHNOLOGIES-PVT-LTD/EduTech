import { ApplicationStateMachine } from '../state-machine/ApplicationStateMachine';

export class WorkflowValidator {
    constructor(private readonly stateMachine: ApplicationStateMachine) {}

    public async validate(
        fromStatus: string,
        toStatus: string,
        role: string
    ): Promise<void> {
        await this.stateMachine.validateTransition(fromStatus, toStatus, role);
    }
}
