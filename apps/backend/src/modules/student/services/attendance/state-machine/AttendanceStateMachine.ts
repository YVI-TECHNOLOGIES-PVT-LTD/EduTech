import { AttendanceRepository } from '../../../repositories/attendance/AttendanceRepository';
import { BusinessRuleError } from '../../../../admission/errors/BusinessRuleError';

export class AttendanceStateMachine {
    constructor(private readonly attendanceRepo: AttendanceRepository) {}

    public async validateTransition(
        fromStatus: string,
        toStatus: string,
        role: string
    ): Promise<void> {
        const isAllowed = await this.attendanceRepo.getWorkflowRule(fromStatus, toStatus, role);
        
        if (!isAllowed) {
            const fallbackRules: Record<string, string[]> = {
                'PENDING': ['APPROVED', 'REJECTED']
            };

            const allowed = fallbackRules[fromStatus]?.includes(toStatus);
            if (!allowed) {
                throw new BusinessRuleError(
                    `Invalid attendance workflow transition from [${fromStatus}] to [${toStatus}] for role [${role}].`
                );
            }
        }
    }
}
