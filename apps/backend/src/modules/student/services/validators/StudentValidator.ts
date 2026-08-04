import { StudentRepository } from '../../repositories/StudentRepository';
import { NotFoundError } from '../../../admission/errors/NotFoundError';
import { BusinessRuleError } from '../../../admission/errors/BusinessRuleError';

export class StudentValidator {
    constructor(private readonly studentRepo: StudentRepository) {}

    public async validate(studentId: string): Promise<void> {
        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new NotFoundError(`Student with ID ${studentId} not found`);
        }

        if (student.deletedAt) {
            throw new BusinessRuleError('Student record is soft-deleted');
        }
    }
}
