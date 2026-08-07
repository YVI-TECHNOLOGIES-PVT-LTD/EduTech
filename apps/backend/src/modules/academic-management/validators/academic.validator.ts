import { CreateAcademicYearDto } from '../dto/request/create-academic-year.dto';
import { CreateGradeDto } from '../dto/request/create-grade.dto';
import { CreateSectionDto } from '../dto/request/create-section.dto';
import { CreateAcademicYearGradeDto } from '../dto/request/create-academic-year-grade.dto';
import { AcademicValidationError } from '../errors/academic.errors';

export class AcademicValidator {
  static validateCreateAcademicYear(dto: CreateAcademicYearDto): void {
    if (!dto.org_id) throw new AcademicValidationError('Organization ID is required');
    if (!dto.academic_year_name || dto.academic_year_name.trim().length === 0) {
      throw new AcademicValidationError('Academic year name is required');
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

  static validateCreateGrade(dto: CreateGradeDto): void {
    if (!dto.org_id) throw new AcademicValidationError('Organization ID is required');
    if (!dto.grade_code || dto.grade_code.trim().length === 0) {
      throw new AcademicValidationError('Grade code is required');
    }
    if (!dto.grade_name || dto.grade_name.trim().length === 0) {
      throw new AcademicValidationError('Grade name is required');
    }
  }

  static validateCreateSection(dto: CreateSectionDto): void {
    if (!dto.academic_year_grade_id) throw new AcademicValidationError('Academic year grade ID is required');
    if (!dto.section_name || dto.section_name.trim().length === 0) {
      throw new AcademicValidationError('Section name is required');
    }
  }

  static validateCreateAcademicYearGrade(dto: CreateAcademicYearGradeDto): void {
    if (!dto.academic_year_id) throw new AcademicValidationError('Academic year ID is required');
    if (!dto.grade_id) throw new AcademicValidationError('Grade ID is required');
  }
}
