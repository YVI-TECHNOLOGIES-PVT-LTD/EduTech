"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewStateMachine = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class InterviewStateMachine {
    constructor(interviewRepo) {
        this.interviewRepo = interviewRepo;
    }
    async validateTransition(fromStatus, toStatus, role) {
        const isAllowed = await this.interviewRepo.getWorkflowRule(fromStatus, toStatus, role);
        if (!isAllowed) {
            // Fallback for safety/testing
            const fallbackRules = {
                'SCHEDULED': ['COMPLETED', 'EVALUATED'],
                'COMPLETED': ['EVALUATED'],
            };
            const normalizedRole = role.toUpperCase();
            const examCellRoles = new Set(['EXAM_CELL', 'EXAM_CELL_ADMIN', 'ADMIN']);
            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError_1.BusinessRuleError(`Invalid interview workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`);
            }
            if (!examCellRoles.has(normalizedRole) &&
                normalizedRole !== 'PANEL_MEMBER' &&
                toStatus === 'EVALUATED') {
                throw new BusinessRuleError_1.BusinessRuleError(`Invalid interview workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`);
            }
            return;
        }
    }
}
exports.InterviewStateMachine = InterviewStateMachine;
