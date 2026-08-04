import { AttendanceRepository } from '../../../repositories/attendance/AttendanceRepository';
import { BusinessRuleError } from '../../../../admission/errors/BusinessRuleError';

export class AttendanceValidator {
    constructor(private readonly attendanceRepo: AttendanceRepository) {}

    public async validateDuplicate(studentId: string, sessionId: string): Promise<void> {
        const existing = await this.attendanceRepo.findByStudentAndSession(studentId, sessionId);
        if (existing) {
            throw new BusinessRuleError('Attendance has already been marked for this student in the session.');
        }
    }
}
