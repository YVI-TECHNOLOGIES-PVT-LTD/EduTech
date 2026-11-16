import { CreateStaffDto } from '../dto/request/create-staff.dto';
import { CreateDesignationDto } from '../dto/request/create-designation.dto';
import { StaffValidationError } from '../errors/staff.errors';

export class StaffValidator {
  static validateCreate(dto: CreateStaffDto): void {
    if (!dto.org_id) {
      throw new StaffValidationError('Organization ID is required');
    }
    if (!dto.user_id) {
      throw new StaffValidationError('User ID is required');
    }
    if (!dto.employee_code || dto.employee_code.trim().length === 0) {
      throw new StaffValidationError('Employee code is required');
    }
  }

  static validateCreateDesignation(dto: CreateDesignationDto): void {
    if (!dto.org_id) {
      throw new StaffValidationError('Organization ID is required');
    }
    if (!dto.designation_name || dto.designation_name.trim().length === 0) {
      throw new StaffValidationError('Designation name is required');
    }
  }
}
