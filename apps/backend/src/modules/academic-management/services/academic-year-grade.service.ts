import { AcademicYearGradeRepository } from '../repositories/academic-year-grade.repository';
import { AcademicYearRepository } from '../repositories/academic-year.repository';
import { GradeRepository } from '../repositories/grade.repository';
import { AcademicValidator } from '../validators/academic.validator';
import { AcademicYearGradeNotFoundError, AcademicYearNotFoundError, GradeNotFoundError } from '../errors/academic.errors';
import { CreateAcademicYearGradeDto } from '../dto/request/create-academic-year-grade.dto';
import { UpdateAcademicYearGradeDto } from '../dto/request/update-academic-year-grade.dto';
import { AcademicYearGradeResponseDto } from '../dto/response/academic-year-grade.response.dto';
import { AcademicMapper } from '../mappers/academic.mapper';
import { AcademicEvents, AcademicEventType } from '../events/academic.events';
import { logger } from '../../../utils/logger';

export class AcademicYearGradeService {
  static async createAcademicYearGrade(dto: CreateAcademicYearGradeDto, performedBy?: string | null): Promise<AcademicYearGradeResponseDto> {
    AcademicValidator.validateCreateAcademicYearGrade(dto);

    const year = await AcademicYearRepository.findById(dto.academic_year_id);
    if (!year) throw new AcademicYearNotFoundError(dto.academic_year_id);

    const grade = await GradeRepository.findById(dto.grade_id);
    if (!grade) throw new GradeNotFoundError(dto.grade_id);

    const existing = await AcademicYearGradeRepository.findByYearAndGrade(dto.academic_year_id, dto.grade_id);
    if (existing) return AcademicMapper.toAcademicYearGradeResponseDto(existing);

    const mapping = await AcademicYearGradeRepository.create(dto, performedBy);

    logger.info(`AY-Grade mapping created: ${mapping.academic_year_grade_id}`, {
      academicYearGradeId: mapping.academic_year_grade_id,
      academicYearId: dto.academic_year_id,
      gradeId: dto.grade_id,
      performedBy,
    });

    // Post-commit event emission
    await AcademicEvents.publish(AcademicEventType.YEAR_GRADE_CREATED, {
      entityId: mapping.academic_year_grade_id,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toAcademicYearGradeResponseDto(mapping);
  }

  static async getAcademicYearGradeById(id: string): Promise<AcademicYearGradeResponseDto> {
    const mapping = await AcademicYearGradeRepository.findById(id);
    if (!mapping) throw new AcademicYearGradeNotFoundError(id);
    return AcademicMapper.toAcademicYearGradeResponseDto(mapping);
  }

  static async updateAcademicYearGrade(id: string, dto: UpdateAcademicYearGradeDto, performedBy?: string | null): Promise<AcademicYearGradeResponseDto> {
    const existing = await AcademicYearGradeRepository.findById(id);
    if (!existing) throw new AcademicYearGradeNotFoundError(id);

    const updated = await AcademicYearGradeRepository.update(id, dto, performedBy);

    logger.info(`AY-Grade mapping updated: ${id}`, { academicYearGradeId: id, performedBy });

    // Post-commit event emission
    await AcademicEvents.publish(AcademicEventType.YEAR_GRADE_UPDATED, {
      entityId: id,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toAcademicYearGradeResponseDto(updated);
  }

  static async getAcademicYearGradesByYear(academicYearId: string): Promise<AcademicYearGradeResponseDto[]> {
    const mappings = await AcademicYearGradeRepository.findByAcademicYear(academicYearId);
    return mappings.map(AcademicMapper.toAcademicYearGradeResponseDto);
  }
}
