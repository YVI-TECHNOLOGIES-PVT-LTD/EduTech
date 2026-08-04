"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowValidator = void 0;
class WorkflowValidator {
    constructor(stateMachine) {
        this.stateMachine = stateMachine;
    }
    async validate(fromStatus, toStatus, role) {
        await this.stateMachine.validateTransition(fromStatus, toStatus, role);
    }
}
exports.WorkflowValidator = WorkflowValidator;
