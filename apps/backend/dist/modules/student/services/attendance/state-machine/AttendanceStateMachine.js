"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceStateMachine = void 0;
const BusinessRuleError_1 = require("../../../../admission/errors/BusinessRuleError");
class AttendanceStateMachine {
    constructor(attendanceRepo) {
        this.attendanceRepo = attendanceRepo;
    }
    async validateTransition(fromStatus, toStatus, role) {
        const isAllowed = await this.attendanceRepo.getWorkflowRule(fromStatus, toStatus, role);
        if (!isAllowed) {
            const fallbackRules = {
                'PENDING': ['APPROVED', 'REJECTED']
            };
            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError_1.BusinessRuleError(`Invalid attendance workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`);
            }
        }
    }
}
exports.AttendanceStateMachine = AttendanceStateMachine;
