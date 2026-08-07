/**
 * Custom Lead Domain Error Hierarchy
 */

export class LeadError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'LEAD_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LeadNotFoundError extends LeadError {
  constructor(leadId: string) {
    super(`Lead with ID '${leadId}' was not found`, 404, 'LEAD_NOT_FOUND');
  }
}

export class InvalidLeadStatusTransitionError extends LeadError {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      `Cannot transition lead status from '${currentStatus}' to '${targetStatus}'`,
      422,
      'INVALID_STATUS_TRANSITION'
    );
  }
}

export class DuplicateLeadError extends LeadError {
  constructor(field: string, value: string) {
    super(`Lead with ${field} '${value}' already exists`, 409, 'DUPLICATE_LEAD');
  }
}

export class LeadAssignmentError extends LeadError {
  constructor(message: string) {
    super(message, 400, 'LEAD_ASSIGNMENT_ERROR');
  }
}

export class LeadValidationError extends LeadError {
  constructor(message: string) {
    super(message, 400, 'LEAD_VALIDATION_ERROR');
  }
}
