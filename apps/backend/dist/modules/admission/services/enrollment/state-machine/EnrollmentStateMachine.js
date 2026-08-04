"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentStateMachine = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class EnrollmentStateMachine {
    constructor(enrollRepo) {
        this.enrollRepo = enrollRepo;
    }
    /**
     * Asserts that dynamic workflow status changes are allowed.
     */
    async validateTransition(fromStatus, toStatus, role) {
        const isAllowed = await this.enrollRepo.getWorkflowRule(fromStatus, toStatus, role);
        if (!isAllowed) {
            const fallbackRules = {
                'OFFER_ACCEPTED': ['PAYMENT_PENDING'],
                'PAYMENT_PENDING': ['PAYMENT_COMPLETED'],
                'PAYMENT_COMPLETED': ['ADMISSION_CONFIRMED'],
                'ADMISSION_CONFIRMED': ['STUDENT_CREATED', 'ENROLLED'],
                'STUDENT_CREATED': ['ENROLLED'],
            };
            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError_1.BusinessRuleError(`Invalid enrollment workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`);
            }
        }
    }
}
exports.EnrollmentStateMachine = EnrollmentStateMachine;
