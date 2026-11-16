import { CreateUserDto } from '../dto/request/create-user.dto';
import { CreateRoleDto } from '../dto/request/create-role.dto';
import { UserValidationError } from '../errors/user.errors';

export class UserValidator {
  static validateCreate(dto: CreateUserDto): void {
    if (!dto.org_id) {
      throw new UserValidationError('Organization ID is required');
    }
    if (!dto.first_name || dto.first_name.trim().length === 0) {
      throw new UserValidationError('First name is required');
    }
    if (!dto.email || !dto.email.includes('@')) {
      throw new UserValidationError('Valid email address is required');
    }
    if (!dto.phone || dto.phone.trim().length === 0) {
      throw new UserValidationError('Phone number is required');
    }
  }

  static validateCreateRole(dto: CreateRoleDto): void {
    if (!dto.org_id) {
      throw new UserValidationError('Organization ID is required');
    }
    if (!dto.role_name || dto.role_name.trim().length === 0) {
      throw new UserValidationError('Role name is required');
    }
  }
}
