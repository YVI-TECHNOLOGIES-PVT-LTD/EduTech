import { AllocationRepository } from '../../repositories/AllocationRepository';
import { BusinessRuleError } from '../../../admission/errors/BusinessRuleError';

export class SectionCapacityValidator {
    constructor(private readonly allocRepo: AllocationRepository) {}

    /**
     * Checks section headcount against configured class capacity limit.
     */
    public async validate(
        academicYearId: string,
        grade: string,
        sectionId: string,
        maxCapacity: number = 30
    ): Promise<void> {
        const count = await this.allocRepo.countSectionStudents(academicYearId, grade, sectionId);
        if (count >= maxCapacity) {
            throw new BusinessRuleError(
                `Class allocation failed. Section has reached maximum student capacity limit of ${maxCapacity}.`
            );
        }
    }
}
