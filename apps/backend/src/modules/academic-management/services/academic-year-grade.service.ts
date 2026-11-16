import { AcademicYearGradeRepository } from '../repositories/academic-year-grade.repository';
import { AcademicYearRepository } from '../repositories/academic-year.repository';
import { GradeRepository } from '../repositories/grade.repository';
import { AcademicValidator } from '../validators/academic.validator';
import {
  AcademicYearGradeNotFoundError,
  AcademicYearNotFoundError,
  GradeNotFoundError,
  ConflictOperationError,
} from '../errors/academic.errors';
import { CreateAcademicYearGradeDto } from '../dto/request/create-academic-year-grade.dto';
import { UpdateAcademicYearGradeDto } from '../dto/request/update-academic-year-grade.dto';
import { AcademicYearGradeResponseDto } from '../dto/response/academic-year-grade.response.dto';
import { AcademicMapper } from '../mappers/academic.mapper';
import { AcademicEvents, AcademicEventType } from '../events/academic.events';
import { logger } from '../../../utils/logger';

export class AcademicYearGradeService {
  static async createAcademicYearGrade(
    orgId: string,
    dto: CreateAcademicYearGradeDto,
    performedBy?: string | null,
  ): Promise<AcademicYearGradeResponseDto> {
    AcademicValidator.validateCreateAcademicYearGrade(dto);

    const year = await AcademicYearRepository.findById(orgId, dto.academic_year_id);
    if (!year) throw new AcademicYearNotFoundError(dto.academic_year_id);

    const grade = await GradeRepository.findById(orgId, dto.grade_id);
    if (!grade) throw new GradeNotFoundError(dto.grade_id);

    const existing = await AcademicYearGradeRepository.findByYearAndGrade(
      orgId,
      dto.academic_year_id,
      dto.grade_id,
    );
    if (existing) {
      throw new ConflictOperationError(
        `Grade '${grade.grade_name}' is already offered in academic year '${year.academic_year_name}'`,
      );
    }

    const mapping = await AcademicYearGradeRepository.create(orgId, dto, performedBy);

    logger.info(`AY-Grade mapping created: ${mapping.academic_year_grade_id} in org ${orgId}`, {
      academicYearGradeId: mapping.academic_year_grade_id,
      academicYearId: dto.academic_year_id,
      gradeId: dto.grade_id,
      orgId,
      performedBy,
    });

    await AcademicEvents.publish(AcademicEventType.YEAR_GRADE_CREATED, {
      entityId: mapping.academic_year_grade_id,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toAcademicYearGradeResponseDto(mapping);
  }

  static async getAcademicYearGradeById(
    orgId: string,
    id: string,
  ): Promise<AcademicYearGradeResponseDto> {
    const mapping = await AcademicYearGradeRepository.findById(orgId, id);
    if (!mapping) throw new AcademicYearGradeNotFoundError(id);
    return AcademicMapper.toAcademicYearGradeResponseDto(mapping);
  }

  static async updateAcademicYearGrade(
    orgId: string,
    id: string,
    dto: UpdateAcademicYearGradeDto,
    performedBy?: string | null,
  ): Promise<AcademicYearGradeResponseDto> {
    const existing = await AcademicYearGradeRepository.findById(orgId, id);
    if (!existing) throw new AcademicYearGradeNotFoundError(id);

    const updated = await AcademicYearGradeRepository.update(orgId, id, dto, performedBy);

    logger.info(`AY-Grade mapping updated: ${id} in org ${orgId}`, {
      academicYearGradeId: id,
      orgId,
      performedBy,
    });

    await AcademicEvents.publish(AcademicEventType.YEAR_GRADE_UPDATED, {
      entityId: id,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toAcademicYearGradeResponseDto(updated);
  }

  static async getAcademicYearGradesByYear(
    orgId: string,
    academicYearId: string,
  ): Promise<AcademicYearGradeResponseDto[]> {
    const year = await AcademicYearRepository.findById(orgId, academicYearId);
    if (!year) throw new AcademicYearNotFoundError(academicYearId);

    const mappings = await AcademicYearGradeRepository.findByAcademicYear(orgId, academicYearId);
    return mappings.map(AcademicMapper.toAcademicYearGradeResponseDto);
  }

  static async deleteAcademicYearGrade(orgId: string, id: string): Promise<void> {
    const existing = await AcademicYearGradeRepository.findById(orgId, id);
    if (!existing) throw new AcademicYearGradeNotFoundError(id);

    const sectionCount = await AcademicYearGradeRepository.countSections(id);
    if (sectionCount > 0) {
      throw new ConflictOperationError(
        `Cannot remove grade offering because ${sectionCount} active section(s) exist under it. Remove or reassign sections first.`,
      );
    }

    await AcademicYearGradeRepository.delete(orgId, id);

    logger.info(`AY-Grade mapping deleted: ${id} in org ${orgId}`, {
      academicYearGradeId: id,
      orgId,
    });
  }
}
