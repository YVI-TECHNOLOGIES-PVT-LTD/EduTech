import { StudentRepository } from '../../repositories/StudentRepository';
import { BusinessRuleError } from '../../../admission/errors/BusinessRuleError';

export class TransferValidator {
    constructor(private readonly studentRepo: StudentRepository) {}

    public async validate(studentId: string): Promise<void> {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }

        if (student.status !== 'ACTIVE') {
            throw new BusinessRuleError(`Only ACTIVE students can initiate transfers. Current: ${student.status}`);
        }
    }
}
