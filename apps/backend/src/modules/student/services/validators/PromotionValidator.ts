import { StudentRepository } from '../../repositories/StudentRepository';
import { BusinessRuleError } from '../../../admission/errors/BusinessRuleError';

export class PromotionValidator {
    constructor(private readonly studentRepo: StudentRepository) {}

    public async validate(studentId: string): Promise<void> {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }

        if (student.status !== 'ACTIVE' && student.status !== 'PROMOTED') {
            throw new BusinessRuleError(`Only ACTIVE or PROMOTED students are eligible for promotion. Current: ${student.status}`);
        }
    }
}
