import { HolidayRepository } from '../../repositories/attendance/HolidayRepository';
import { WorkingDay } from '../../domain/attendance/WorkingDay';

export class WorkingDayService {
    constructor(private readonly holidayRepo: HolidayRepository) {}

    public async configureWorkingDays(
        schoolId: string,
        academicYearId: string,
        grade: string,
        month: number,
        totalWorkingDays: number
    ): Promise<WorkingDay> {
        const wd = new WorkingDay(
            crypto.randomUUID(),
            schoolId,
            academicYearId,
            grade,
            month,
            totalWorkingDays,
            new Date()
        );
        await this.holidayRepo.saveWorkingDay(wd);
        return wd;
    }
}
