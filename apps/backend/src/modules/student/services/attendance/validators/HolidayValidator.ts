import { HolidayRepository } from '../../../repositories/attendance/HolidayRepository';
import { BusinessRuleError } from '../../../../admission/errors/BusinessRuleError';

export class HolidayValidator {
    constructor(private readonly holidayRepo: HolidayRepository) {}

    public async validateWorkingDay(schoolId: string, date: Date): Promise<void> {
        const holiday = await this.holidayRepo.findHolidayByDate(schoolId, date);
        if (holiday) {
            throw new BusinessRuleError(`Cannot mark attendance on a holiday: ${holiday.name}`);
        }
    }
}
