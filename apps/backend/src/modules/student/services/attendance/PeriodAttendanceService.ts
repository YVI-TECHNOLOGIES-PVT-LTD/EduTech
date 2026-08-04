import { AttendanceRepository } from '../../repositories/attendance/AttendanceRepository';
import { StudentRepository } from '../../repositories/StudentRepository';
import { AttendancePeriod } from '../../domain/attendance/AttendancePeriod';

export class PeriodAttendanceService {
    constructor(
        private readonly attendanceRepo: AttendanceRepository,
        private readonly studentRepo: StudentRepository
    ) {}

    public async markPeriod(
        studentId: string,
        academicYearId: string,
        date: Date,
        periodNumber: number,
        subjectId: string | null,
        status: 'PRESENT' | 'ABSENT' | 'LATE',
        markedBy: string | null
    ): Promise<AttendancePeriod> {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error(`Student ${studentId} not found`);
        }

        const period = new AttendancePeriod(
            crypto.randomUUID(),
            studentId,
            academicYearId,
            date,
            periodNumber,
            subjectId,
            status,
            markedBy,
            new Date()
        );
        await this.attendanceRepo.savePeriod(period);

        return period;
    }
}
