"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferStateMachine = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class OfferStateMachine {
    constructor(offerRepo) {
        this.offerRepo = offerRepo;
    }
    async validateTransition(fromStatus, toStatus, role) {
        const isAllowed = await this.offerRepo.getWorkflowRule(fromStatus, toStatus, role);
        if (!isAllowed) {
            // Fallback for safety/testing
            const fallbackRules = {
                'GENERATED': ['SENT'],
                'SENT': ['ACCEPTED', 'EXPIRED'],
                'ACCEPTED': ['ENROLLED']
            };
            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError_1.BusinessRuleError(`Invalid offer workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`);
            }
        }
    }
}
exports.OfferStateMachine = OfferStateMachine;
