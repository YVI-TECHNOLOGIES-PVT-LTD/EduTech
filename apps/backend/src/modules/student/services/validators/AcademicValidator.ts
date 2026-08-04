import { AcademicRepository } from '../../repositories/AcademicRepository';
import { BusinessRuleError } from '../../../admission/errors/BusinessRuleError';

export class AcademicValidator {
    constructor(private readonly academicRepo: AcademicRepository) {}

    public async validate(studentId: string): Promise<void> {
        const records = await this.academicRepo.findRecords(studentId);
        if (!records || records.length === 0) {
            throw new BusinessRuleError('No active academic history found for student');
        }
    }
}
