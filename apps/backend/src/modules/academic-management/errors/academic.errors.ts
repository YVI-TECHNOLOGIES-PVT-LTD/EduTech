/**
 * Custom Academic Structure Management Domain Error Hierarchy
 */

export class AcademicError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'ACADEMIC_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
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

export class AcademicValidationError extends AcademicError {
  constructor(message: string) {
    super(message, 400, 'ACADEMIC_VALIDATION_ERROR');
  }
}
