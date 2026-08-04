"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentStateMachine = void 0;
const BusinessRuleError_1 = require("../../../admission/errors/BusinessRuleError");
class StudentStateMachine {
    constructor(studentRepo) {
        this.studentRepo = studentRepo;
    }
    /**
     * Governs state path transitions: ACTIVE, PROMOTED, TRANSFERRED, LEFT, ALUMNI, SUSPENDED.
     */
    async validateTransition(fromStatus, toStatus, role) {
        const isAllowed = await this.studentRepo.getWorkflowRule(fromStatus, toStatus, role);
        if (!isAllowed) {
            const fallbackRules = {
                'NEW': ['ACTIVE'],
                'ACTIVE': ['PROMOTED', 'SUSPENDED', 'TRANSFERRED', 'LEFT', 'ALUMNI'],
                'PROMOTED': ['ACTIVE', 'ALUMNI'],
                'SUSPENDED': ['ACTIVE']
            };
            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError_1.BusinessRuleError(`Invalid student workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`);
            }
        }
    }
}
exports.StudentStateMachine = StudentStateMachine;
