import { AllocationRepository } from '../../repositories/AllocationRepository';

export class RollNumberGenerator {
    constructor(private readonly allocRepo: AllocationRepository) {}

    /**
     * Increments roll number sequence per section.
     */
    public async generateNextRoll(
        schoolId: string,
        academicYearId: string,
        grade: string,
        sectionId: string
    ): Promise<number> {
        let seq = await this.allocRepo.findSequence(schoolId, academicYearId, grade, sectionId);
        if (!seq) {
            seq = {
                id: crypto.randomUUID(),
                school_id: schoolId,
                academic_year_id: academicYearId,
                grade: grade,
                section_id: sectionId,
                current_value: 1
            };
        }

        const roll = seq.current_value;
        seq.current_value = roll + 1;
        await this.allocRepo.saveSequence(seq);

        return roll;
    }
}
