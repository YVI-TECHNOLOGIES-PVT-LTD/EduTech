/**
 * Custom Staff Management Domain Error Hierarchy
 */

export class StaffError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'STAFF_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StaffNotFoundError extends StaffError {
  constructor(id: string) {
    super(`Staff profile with ID '${id}' was not found`, 404, 'STAFF_NOT_FOUND');
  }
}

export class DesignationNotFoundError extends StaffError {
  constructor(id: string) {
    super(`Designation with ID '${id}' was not found`, 404, 'DESIGNATION_NOT_FOUND');
  }
}

export class DuplicateEmployeeCodeError extends StaffError {
  constructor(code: string) {
    super(
      `Staff with employee code '${code}' already exists in organization`,
      409,
      'DUPLICATE_EMPLOYEE_CODE',
    );
  }
}

export class DuplicateUserStaffError extends StaffError {
  constructor(userId: string) {
    super(`Staff record already exists for user ID '${userId}'`, 409, 'DUPLICATE_USER_STAFF');
  }
}

export class DuplicateDesignationNameError extends StaffError {
  constructor(name: string) {
    super(
      `Designation with name '${name}' already exists in organization`,
      409,
      'DUPLICATE_DESIGNATION_NAME',
    );
  }
}

export class StaffValidationError extends StaffError {
  constructor(message: string) {
    super(message, 400, 'STAFF_VALIDATION_ERROR');
  }
}
