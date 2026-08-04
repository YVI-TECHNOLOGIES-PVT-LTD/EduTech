"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RollNumberGenerator = void 0;
class RollNumberGenerator {
    constructor(allocRepo) {
        this.allocRepo = allocRepo;
    }
    /**
     * Increments roll number sequence per section.
     */
    async generateNextRoll(schoolId, academicYearId, grade, sectionId) {
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
exports.RollNumberGenerator = RollNumberGenerator;
