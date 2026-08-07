/**
 * Custom Admission Application Domain Error Hierarchy
 */

export class ApplicationError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'APPLICATION_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ApplicationNotFoundError extends ApplicationError {
  constructor(id: string) {
    super(`Admission application with ID '${id}' was not found`, 404, 'APPLICATION_NOT_FOUND');
  }
}

export class InvalidApplicationStatusTransitionError extends ApplicationError {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Cannot transition application status from '${currentStatus}' to '${targetStatus}'`,
      422,
      'INVALID_STATUS_TRANSITION',
    );
  }
}

export class DuplicateApplicationError extends ApplicationError {
  constructor(leadId: string) {
    super(`An application for lead '${leadId}' already exists`, 409, 'DUPLICATE_APPLICATION');
  }
}

export class DocumentNotFoundError extends ApplicationError {
  constructor(docId: string) {
    super(`Document with ID '${docId}' was not found`, 404, 'DOCUMENT_NOT_FOUND');
  }
}

export class ApplicationValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 400, 'APPLICATION_VALIDATION_ERROR');
  }
}
