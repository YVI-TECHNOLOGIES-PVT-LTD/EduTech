"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
const NotFoundError_1 = require("../../../errors/NotFoundError");
class LeadValidator {
    constructor(leadRepo) {
        this.leadRepo = leadRepo;
    }
    async validate(leadId) {
        const lead = await this.leadRepo.findById(leadId);
        if (!lead) {
            throw new NotFoundError_1.NotFoundError(`Lead with ID ${leadId} not found`);
        }
        // A lead is eligible for application creation unless it is closed (LOST, NOT_INTERESTED)
        // or already in a converted/terminal state.
        const INELIGIBLE_STATUSES = ['LOST', 'NOT_INTERESTED'];
        if (INELIGIBLE_STATUSES.includes(lead.status)) {
            throw new BusinessRuleError_1.BusinessRuleError(`Lead is not eligible for application creation. Status is: ${lead.status}. Only active leads (NEW, CONTACTED, FOLLOW_UP, VISITED, INTERESTED) can be converted to applications.`);
        }
    }
}
exports.LeadValidator = LeadValidator;
