"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentStateMachine = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class DocumentStateMachine {
    constructor(docRepo) {
        this.docRepo = docRepo;
    }
    /**
     * Checks transitions integrity dynamically based on database review rules.
     */
    async validateTransition(fromStatus, toStatus, role) {
        const isAllowed = await this.docRepo.getWorkflowRule(fromStatus, toStatus, role);
        if (!isAllowed) {
            // Fallback definitions for local testing / seeds safety
            const fallbackRules = {
                'UPLOADED': ['PENDING_VERIFICATION'],
                'PENDING_VERIFICATION': ['VERIFIED', 'REJECTED', 'CORRECTION_REQUIRED'],
                'REJECTED': ['REUPLOADED'],
                'CORRECTION_REQUIRED': ['REUPLOADED'],
                'REUPLOADED': ['PENDING_VERIFICATION']
            };
            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError_1.BusinessRuleError(`Invalid document workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`);
            }
        }
    }
}
exports.DocumentStateMachine = DocumentStateMachine;
