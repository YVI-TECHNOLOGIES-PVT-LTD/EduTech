import { StudentValidator } from '../../validators/StudentValidator';
import { AttendanceValidator } from './AttendanceValidator';
import { SessionValidator } from './SessionValidator';
import { LeaveValidator } from './LeaveValidator';
import { HolidayValidator } from './HolidayValidator';
import { CorrectionValidator } from './CorrectionValidator';
import { BiometricValidator } from './BiometricValidator';

export class AttendanceValidationCoordinator {
    constructor(
        private readonly studentVal: StudentValidator,
        private readonly attendanceVal: AttendanceValidator,
        private readonly sessionVal: SessionValidator,
        private readonly leaveVal: LeaveValidator,
        private readonly holidayVal: HolidayValidator,
        private readonly correctionVal: CorrectionValidator,
        private readonly biometricVal: BiometricValidator
    ) {}

    public async validateDailyMarking(
        studentId: string,
        schoolId: string,
        date: Date,
        sessionId: string
    ): Promise<void> {
        await this.studentVal.validate(studentId);
        await this.holidayVal.validateWorkingDay(schoolId, date);
        await this.attendanceVal.validateDuplicate(studentId, sessionId);
    }

    public async validateLeaveApplication(
        studentId: string,
        leaveTypeId: string,
        requestedDays: number
    ): Promise<void> {
        await this.studentVal.validate(studentId);
        await this.leaveVal.validateBalance(studentId, leaveTypeId, requestedDays);
    }
}
