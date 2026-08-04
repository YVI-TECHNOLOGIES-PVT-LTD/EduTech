"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveStateMachine = void 0;
const BusinessRuleError_1 = require("../../../../admission/errors/BusinessRuleError");
class LeaveStateMachine {
    /**
     * Governs leave request status transitions.
     */
    validateTransition(fromStatus, toStatus) {
        const allowedTransitions = {
            'DRAFT': ['SUBMITTED'],
            'SUBMITTED': ['APPROVED', 'REJECTED'],
            'APPROVED': ['COMPLETED'],
            'REJECTED': ['DRAFT']
        };
        const isAllowed = allowedTransitions[fromStatus]?.includes(toStatus);
        if (!isAllowed) {
            throw new BusinessRuleError_1.BusinessRuleError(`Invalid student leave request transition from [${fromStatus}] to [${toStatus}].`);
        }
    }
}
exports.LeaveStateMachine = LeaveStateMachine;
