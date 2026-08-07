import { CreateParentDto } from '../dto/request/create-parent.dto';
import { LinkStudentDto } from '../dto/request/link-student.dto';
import { ParentValidationError } from '../errors/parent.errors';

export class ParentValidator {
  static validateCreate(dto: CreateParentDto): void {
    if (!dto.org_id) {
      throw new ParentValidationError('Organization ID is required');
    }
    if (!dto.first_name || dto.first_name.trim().length === 0) {
      throw new ParentValidationError('First name is required');
    }
    if (!dto.phone || dto.phone.trim().length === 0) {
      throw new ParentValidationError('Phone number is required');
    }
  }

  static validateLinkStudent(dto: LinkStudentDto): void {
    if (!dto.student_id) {
      throw new ParentValidationError('Student ID is required');
    }
    if (!dto.relationship) {
      throw new ParentValidationError('Relationship type is required');
    }
  }
}
