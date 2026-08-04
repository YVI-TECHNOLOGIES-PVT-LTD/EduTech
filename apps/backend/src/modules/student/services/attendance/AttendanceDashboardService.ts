import { ReportRepository } from '../../repositories/attendance/ReportRepository';

export class AttendanceDashboardService {
    constructor(private readonly reportRepo: ReportRepository) {}

    public async recordDashboardMetrics(
        schoolId: string,
        date: Date,
        metrics: {
            totalEnrolled: number;
            totalPresent: number;
            totalAbsent: number;
            totalLate: number;
            averageAttendancePercentage: number;
        }
    ): Promise<void> {
        await this.reportRepo.saveDashboardMetrics({
            id: crypto.randomUUID(),
            schoolId,
            date,
            ...metrics
        });
    }
}
