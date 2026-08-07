import { ALLOWED_ENROLLMENT_STATUS_TRANSITIONS } from '../constants/student.constants';
import { InvalidStudentStatusTransitionError, StudentValidationError } from '../errors/student.errors';
import { CreateStudentDto } from '../dto/request/create-student.dto';

export class StudentValidator {
  static validateCreate(dto: CreateStudentDto): void {
    if (!dto.org_id) {
      throw new StudentValidationError('Organization ID is required');
    }
    if (!dto.application_id) {
      throw new StudentValidationError('Application ID is required');
    }
    if (!dto.first_name || dto.first_name.trim().length === 0) {
      throw new StudentValidationError('First name is required');
    }
  }

  static validateStatusTransition(currentStatus: string, targetStatus: string): void {
    if (currentStatus === targetStatus) return;

    const allowed = ALLOWED_ENROLLMENT_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new InvalidStudentStatusTransitionError(String(currentStatus), String(targetStatus));
    }
  }
}
