/**
 * Custom Academic Structure Management Domain Error Hierarchy
 */

export class AcademicError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 400,
    code: string = 'ACADEMIC_ERROR',
    details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AcademicYearNotFoundError extends AcademicError {
  constructor(id: string) {
    super(`Academic year with ID '${id}' was not found`, 404, 'ACADEMIC_YEAR_NOT_FOUND');
  }
}

export class GradeNotFoundError extends AcademicError {
  constructor(id: string) {
    super(`Grade with ID '${id}' was not found`, 404, 'GRADE_NOT_FOUND');
  }
}

export class SectionNotFoundError extends AcademicError {
  constructor(id: string) {
    super(`Section with ID '${id}' was not found`, 404, 'SECTION_NOT_FOUND');
  }
}

export class AcademicYearGradeNotFoundError extends AcademicError {
  constructor(id: string) {
    super(`Academic Year Grade mapping with ID '${id}' was not found`, 404, 'AY_GRADE_NOT_FOUND');
  }
}

export class StaffNotFoundError extends AcademicError {
  constructor(id: string) {
    super(
      `Staff member with ID '${id}' was not found in this organization`,
      404,
      'STAFF_NOT_FOUND',
    );
  }
}

export class InactiveStaffError extends AcademicError {
  constructor(id: string) {
    super(
      `Staff member with ID '${id}' is inactive and cannot be assigned as class teacher`,
      400,
      'INACTIVE_STAFF',
    );
  }
}

export class CrossTenantAccessError extends AcademicError {
  constructor(resource: string = 'Resource') {
    super(`${resource} was not found`, 404, 'NOT_FOUND');
  }
}

export class DuplicateAcademicYearError extends AcademicError {
  constructor(name: string) {
    super(`Academic year '${name}' already exists in organization`, 409, 'DUPLICATE_ACADEMIC_YEAR');
  }
}

export class DuplicateGradeError extends AcademicError {
  constructor(codeOrName: string) {
    super(`Grade '${codeOrName}' already exists in organization`, 409, 'DUPLICATE_GRADE');
  }
}

export class DuplicateSectionError extends AcademicError {
  constructor(sectionName: string) {
    super(
      `Section '${sectionName}' already exists in this grade mapping`,
      409,
      'DUPLICATE_SECTION',
    );
  }
}

export class ConflictOperationError extends AcademicError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_OPERATION', details);
  }
}

export class InvalidStatusTransitionError extends AcademicError {
  constructor(fromStatus: string, toStatus: string) {
    super(
      `Invalid academic year status transition from '${fromStatus}' to '${toStatus}'`,
      400,
      'INVALID_STATUS_TRANSITION',
    );
  }
}

export class AcademicValidationError extends AcademicError {
  constructor(message: string, details?: any) {
    super(message, 400, 'ACADEMIC_VALIDATION_ERROR', details);
  }
}
