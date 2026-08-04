"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveValidator = void 0;
const BusinessRuleError_1 = require("../../../../admission/errors/BusinessRuleError");
class LeaveValidator {
    constructor(leaveRepo) {
        this.leaveRepo = leaveRepo;
    }
    /**
     * Checks if requested leave days exceed the policy maximum count.
     */
    async validateBalance(studentId, leaveTypeId, requestedDays) {
        const type = await this.leaveRepo.findLeaveTypeById(leaveTypeId);
        if (!type) {
            throw new Error(`Leave type ID ${leaveTypeId} not found`);
        }
        const approvedDays = await this.leaveRepo.countApprovedLeaveDays(studentId, leaveTypeId);
        if ((approvedDays + requestedDays) > type.max_days) {
            throw new BusinessRuleError_1.BusinessRuleError(`Leave balance exceeded. Approved: ${approvedDays} days, Requested: ${requestedDays} days. Limit: ${type.max_days} days.`);
        }
    }
}
exports.LeaveValidator = LeaveValidator;
