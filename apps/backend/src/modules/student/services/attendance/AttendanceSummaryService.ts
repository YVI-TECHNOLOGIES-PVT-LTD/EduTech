import { ReportRepository } from '../../repositories/attendance/ReportRepository';
import { HolidayRepository } from '../../repositories/attendance/HolidayRepository';
import { StudentRepository } from '../../repositories/StudentRepository';
import { AttendanceSummary } from '../../domain/attendance/AttendanceSummary';
import { AttendancePercentageCalculator } from './AttendancePercentageCalculator';

export class AttendanceSummaryService {
    constructor(
        private readonly reportRepo: ReportRepository,
        private readonly holidayRepo: HolidayRepository,
        private readonly studentRepo: StudentRepository,
        private readonly calc: AttendancePercentageCalculator
    ) {}

    public async calculateMonthlySummary(
        studentId: string,
        academicYearId: string,
        month: number
    ): Promise<AttendanceSummary> {
        const student = await this.studentRepo.findById(studentId);
        if (!student) throw new Error('Student not found');

        const present = await this.reportRepo.countAttendanceByStatus(studentId, academicYearId, month, 'PRESENT');
        const absent = await this.reportRepo.countAttendanceByStatus(studentId, academicYearId, month, 'ABSENT');
        const late = await this.reportRepo.countAttendanceByStatus(studentId, academicYearId, month, 'LATE');

        let totalWorking = 22;
        const config = await this.holidayRepo.findWorkingDay(student.schoolId, academicYearId, 'Grade 1', month);
        if (config) {
            totalWorking = config.totalWorkingDays;
        }

        const percentage = this.calc.calculatePercentage(present, totalWorking);

        let summary = await this.reportRepo.findSummary(studentId, academicYearId, month);
        if (!summary) {
            summary = new AttendanceSummary(
                crypto.randomUUID(),
                studentId,
                academicYearId,
                month,
                present,
                absent,
                late,
                percentage,
                new Date()
            );
        } else {
            summary = new AttendanceSummary(
                summary.id,
                studentId,
                academicYearId,
                month,
                present,
                absent,
                late,
                percentage,
                new Date()
            );
        }

        await this.reportRepo.saveSummary(summary);
        return summary;
    }
}
