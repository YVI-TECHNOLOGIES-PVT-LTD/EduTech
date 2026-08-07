/**
 * Custom Parent Management Domain Error Hierarchy
 */

export class ParentError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'PARENT_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ParentNotFoundError extends ParentError {
  constructor(id: string) {
    super(`Parent with ID '${id}' was not found`, 404, 'PARENT_NOT_FOUND');
  }
}

export class DuplicateParentError extends ParentError {
  constructor(phone: string) {
    super(`Parent with phone number '${phone}' already exists`, 409, 'DUPLICATE_PARENT');
  }
}

export class ParentValidationError extends ParentError {
  constructor(message: string) {
    super(message, 400, 'PARENT_VALIDATION_ERROR');
  }
}
