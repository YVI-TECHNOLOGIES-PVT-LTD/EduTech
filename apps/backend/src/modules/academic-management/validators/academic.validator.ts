import { CreateAcademicYearDto } from '../dto/request/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/request/update-academic-year.dto';
import { CreateGradeDto } from '../dto/request/create-grade.dto';
import { CreateSectionDto } from '../dto/request/create-section.dto';
import { CreateAcademicYearGradeDto } from '../dto/request/create-academic-year-grade.dto';
import { AcademicValidationError, InvalidStatusTransitionError } from '../errors/academic.errors';
import { academic_year_status } from '../constants/academic.constants';

// Permitted status lifecycle forward transitions
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  planning: ['planning', 'admissions_open', 'open', 'archived'],
  admissions_open: ['admissions_open', 'open', 'teaching', 'archived'],
  open: ['open', 'teaching', 'examinations', 'closed', 'archived'],
  teaching: ['teaching', 'examinations', 'closed', 'archived'],
  examinations: ['examinations', 'teaching', 'closed', 'archived'],
  closed: ['closed', 'archived'],
  archived: ['archived'], // Terminal state
};

export class AcademicValidator {
  static validateCreateAcademicYear(dto: CreateAcademicYearDto): void {
    if (!dto.org_id) throw new AcademicValidationError('Organization ID is required');
    if (!dto.academic_year_name || dto.academic_year_name.trim().length === 0) {
      throw new AcademicValidationError('Academic year name is required');
    }
    if (dto.academic_year_name.length > 30) {
      throw new AcademicValidationError('Academic year name must not exceed 30 characters');
    }
    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AcademicValidationError('Start date and end date must be valid dates');
    }
    if (start >= end) {
      throw new AcademicValidationError('Start date must be strictly before end date');
    }
  }

  static validateUpdateAcademicYear(
    existing: { start_date: Date; end_date: Date; status: string },
    dto: UpdateAcademicYearDto,
  ): void {
    const newStart = dto.start_date ? new Date(dto.start_date) : new Date(existing.start_date);
    const newEnd = dto.end_date ? new Date(dto.end_date) : new Date(existing.end_date);

    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      throw new AcademicValidationError('Updated start date and end date must be valid dates');
    }
    if (newStart >= newEnd) {
      throw new AcademicValidationError('Start date must be strictly before end date');
    }

    if (dto.status && dto.status !== existing.status) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(dto.status)) {
        throw new InvalidStatusTransitionError(existing.status, dto.status);
      }
    }
  }

  static validateCreateGrade(dto: CreateGradeDto): void {
    if (!dto.org_id) throw new AcademicValidationError('Organization ID is required');
    if (!dto.grade_code || dto.grade_code.trim().length === 0) {
      throw new AcademicValidationError('Grade code is required');
    }
    if (dto.grade_code.length > 20) {
      throw new AcademicValidationError('Grade code must not exceed 20 characters');
    }
    if (!dto.grade_name || dto.grade_name.trim().length === 0) {
      throw new AcademicValidationError('Grade name is required');
    }
    if (dto.grade_name.length > 50) {
      throw new AcademicValidationError('Grade name must not exceed 50 characters');
    }
    if (dto.display_order !== undefined && dto.display_order < 0) {
      throw new AcademicValidationError('Display order must be a non-negative integer');
    }
  }

  static validateCreateSection(dto: CreateSectionDto): void {
    if (!dto.academic_year_grade_id) {
      throw new AcademicValidationError('Academic year grade ID is required');
    }
    if (!dto.section_name || dto.section_name.trim().length === 0) {
      throw new AcademicValidationError('Section name is required');
    }
    if (dto.section_name.length > 20) {
      throw new AcademicValidationError('Section name must not exceed 20 characters');
    }
    if (dto.capacity !== undefined && dto.capacity !== null && dto.capacity <= 0) {
      throw new AcademicValidationError('Section capacity must be greater than 0');
    }
  }

  static validateCreateAcademicYearGrade(dto: CreateAcademicYearGradeDto): void {
    if (!dto.academic_year_id) throw new AcademicValidationError('Academic year ID is required');
    if (!dto.grade_id) throw new AcademicValidationError('Grade ID is required');
    if (
      dto.intake_capacity !== undefined &&
      dto.intake_capacity !== null &&
      dto.intake_capacity <= 0
    ) {
      throw new AcademicValidationError('Intake capacity must be greater than 0');
    }
  }
}
