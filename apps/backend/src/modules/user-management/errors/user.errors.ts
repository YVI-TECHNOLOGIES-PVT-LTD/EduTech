/**
 * Custom User & Role Administration Domain Error Hierarchy
 */

export class UserError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'USER_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UserNotFoundError extends UserError {
  constructor(id: string) {
    super(`User profile with ID '${id}' was not found`, 404, 'USER_NOT_FOUND');
  }
}

export class RoleNotFoundError extends UserError {
  constructor(id: string) {
    super(`Role with ID '${id}' was not found`, 404, 'ROLE_NOT_FOUND');
  }
}

export class DuplicateUserEmailError extends UserError {
  constructor(email: string) {
    super(`User with email '${email}' already exists`, 409, 'DUPLICATE_USER_EMAIL');
  }
}

export class DuplicateRoleNameError extends UserError {
  constructor(name: string) {
    super(`Role with name '${name}' already exists in organization`, 409, 'DUPLICATE_ROLE_NAME');
  }
}

export class UserValidationError extends UserError {
  constructor(message: string) {
    super(message, 400, 'USER_VALIDATION_ERROR');
  }
}
