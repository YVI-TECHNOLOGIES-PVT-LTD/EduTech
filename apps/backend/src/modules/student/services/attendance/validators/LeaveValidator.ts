import { LeaveRepository } from '../../../repositories/attendance/LeaveRepository';
import { BusinessRuleError } from '../../../../admission/errors/BusinessRuleError';

export class LeaveValidator {
    constructor(private readonly leaveRepo: LeaveRepository) {}

    /**
     * Checks if requested leave days exceed the policy maximum count.
     */
    public async validateBalance(
        studentId: string,
        leaveTypeId: string,
        requestedDays: number
    ): Promise<void> {
        const type = await this.leaveRepo.findLeaveTypeById(leaveTypeId);
        if (!type) {
            throw new Error(`Leave type ID ${leaveTypeId} not found`);
        }

        const approvedDays = await this.leaveRepo.countApprovedLeaveDays(studentId, leaveTypeId);
        if ((approvedDays + requestedDays) > type.max_days) {
            throw new BusinessRuleError(
                `Leave balance exceeded. Approved: ${approvedDays} days, Requested: ${requestedDays} days. Limit: ${type.max_days} days.`
            );
        }
    }
}
