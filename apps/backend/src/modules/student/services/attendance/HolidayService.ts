import { HolidayRepository } from '../../repositories/attendance/HolidayRepository';
import { Holiday } from '../../domain/attendance/Holiday';

export class HolidayService {
    constructor(private readonly holidayRepo: HolidayRepository) {}

    public async createHoliday(
        schoolId: string,
        holidayDate: Date,
        name: string,
        description: string | null
    ): Promise<Holiday> {
        const holiday = new Holiday(
            crypto.randomUUID(),
            schoolId,
            holidayDate,
            name,
            description,
            new Date()
        );
        await this.holidayRepo.saveHoliday(holiday);
        return holiday;
    }
}
