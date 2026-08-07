/**
 * Custom Student Management Domain Error Hierarchy
 */

export class StudentError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'STUDENT_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StudentNotFoundError extends StudentError {
  constructor(id: string) {
    super(`Student with ID '${id}' was not found`, 404, 'STUDENT_NOT_FOUND');
  }
}

export class InvalidStudentStatusTransitionError extends StudentError {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Cannot transition student enrollment status from '${currentStatus}' to '${targetStatus}'`,
      422,
      'INVALID_STATUS_TRANSITION'
    );
  }
}

export class DuplicateAdmissionNumberError extends StudentError {
  constructor(admissionNo: string) {
    super(`Student with admission number '${admissionNo}' already exists in organization`, 409, 'DUPLICATE_ADMISSION_NUMBER');
  }
}

export class DuplicateApplicationStudentError extends StudentError {
  constructor(applicationId: string) {
    super(`Student profile already exists for application '${applicationId}'`, 409, 'DUPLICATE_APPLICATION_STUDENT');
  }
}

export class EnrollmentNotFoundError extends StudentError {
  constructor(id: string) {
    super(`Enrollment record with ID '${id}' was not found`, 404, 'ENROLLMENT_NOT_FOUND');
  }
}

export class StudentValidationError extends StudentError {
  constructor(message: string) {
    super(message, 400, 'STUDENT_VALIDATION_ERROR');
  }
}
