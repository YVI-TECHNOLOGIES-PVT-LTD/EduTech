import { EnrollStudentDto } from '../dto/request/enroll-student.dto';
import { AssignSectionDto } from '../dto/request/assign-section.dto';
import { StudentValidationError } from '../errors/student.errors';

export class EnrollmentValidator {
  static validateEnroll(dto: EnrollStudentDto): void {
    if (!dto.academic_year_grade_id) {
      throw new StudentValidationError('Academic year grade ID is required');
    }
  }

  static validateAssignSection(dto: AssignSectionDto): void {
    if (!dto.section_id) {
      throw new StudentValidationError('Section ID is required');
    }
  }
}
