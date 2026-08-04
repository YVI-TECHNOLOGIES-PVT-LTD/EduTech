import { StudentRepository } from '../../repositories/StudentRepository';
import { BusinessRuleError } from '../../../admission/errors/BusinessRuleError';

export class IdentityValidator {
    constructor(private readonly studentRepo: StudentRepository) {}

    public async validate(studentId: string): Promise<void> {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }

        if (student.status !== 'ACTIVE' && student.status !== 'PROMOTED') {
            throw new BusinessRuleError(`ID cards can only be generated for ACTIVE or PROMOTED students.`);
        }
    }
}
