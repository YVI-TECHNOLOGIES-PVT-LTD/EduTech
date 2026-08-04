"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamStateMachine = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class ExamStateMachine {
    constructor(examRepo) {
        this.examRepo = examRepo;
    }
    async validateTransition(fromStatus, toStatus, role) {
        const isAllowed = await this.examRepo.getWorkflowRule(fromStatus, toStatus, role);
        if (!isAllowed) {
            // Fallback for safety/testing
            const fallbackRules = {
                'SCHEDULED': ['ONGOING'],
                'ONGOING': ['COMPLETED'],
                'COMPLETED': ['EVALUATED']
            };
            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError_1.BusinessRuleError(`Invalid exam workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`);
            }
        }
    }
}
exports.ExamStateMachine = ExamStateMachine;
