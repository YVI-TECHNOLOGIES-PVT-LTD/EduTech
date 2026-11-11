import { GradeRepository, FindAllGradesOptions } from '../repositories/grade.repository';
import { AcademicValidator } from '../validators/academic.validator';
import { GradeNotFoundError, DuplicateGradeError } from '../errors/academic.errors';
import { CreateGradeDto } from '../dto/request/create-grade.dto';
import { UpdateGradeDto } from '../dto/request/update-grade.dto';
import { GradeResponseDto } from '../dto/response/grade.response.dto';
import { AcademicMapper } from '../mappers/academic.mapper';
import { AcademicEvents, AcademicEventType } from '../events/academic.events';
import { logger } from '../../../utils/logger';

export class GradeService {
  static async createGrade(
    orgId: string,
    dto: CreateGradeDto,
    performedBy?: string | null,
  ): Promise<GradeResponseDto> {
    dto.org_id = orgId;
    AcademicValidator.validateCreateGrade(dto);

    const existingByCode = await GradeRepository.findByCode(orgId, dto.grade_code);
    if (existingByCode) {
      throw new DuplicateGradeError(dto.grade_code);
    }

    const existingByName = await GradeRepository.findByName(orgId, dto.grade_name);
    if (existingByName) {
      throw new DuplicateGradeError(dto.grade_name);
    }

    const grade = await GradeRepository.create(orgId, dto, performedBy);

    logger.info(`Grade created: ${grade.grade_id} (${grade.grade_code}) in org ${orgId}`, {
      gradeId: grade.grade_id,
      code: grade.grade_code,
      name: grade.grade_name,
      orgId,
      performedBy,
    });

    await AcademicEvents.publish(AcademicEventType.GRADE_CREATED, {
      entityId: grade.grade_id,
      code: grade.grade_code,
      name: grade.grade_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toGradeResponseDto(grade);
  }

  static async getGradeById(orgId: string, id: string): Promise<GradeResponseDto> {
    const grade = await GradeRepository.findById(orgId, id);
    if (!grade) {
      throw new GradeNotFoundError(id);
    }
    return AcademicMapper.toGradeResponseDto(grade);
  }

  static async updateGrade(
    orgId: string,
    id: string,
    dto: UpdateGradeDto,
    performedBy?: string | null,
  ): Promise<GradeResponseDto> {
    const existing = await GradeRepository.findById(orgId, id);
    if (!existing) {
      throw new GradeNotFoundError(id);
    }

    if (dto.grade_code && dto.grade_code !== existing.grade_code) {
      const duplicateCode = await GradeRepository.findByCode(orgId, dto.grade_code);
      if (duplicateCode && duplicateCode.grade_id !== id) {
        throw new DuplicateGradeError(dto.grade_code);
      }
    }

    if (dto.grade_name && dto.grade_name !== existing.grade_name) {
      const duplicateName = await GradeRepository.findByName(orgId, dto.grade_name);
      if (duplicateName && duplicateName.grade_id !== id) {
        throw new DuplicateGradeError(dto.grade_name);
      }
    }

    const updated = await GradeRepository.update(orgId, id, dto, performedBy);

    logger.info(`Grade updated: ${id} in org ${orgId}`, {
      gradeId: id,
      orgId,
      performedBy,
    });

    await AcademicEvents.publish(AcademicEventType.GRADE_UPDATED, {
      entityId: id,
      code: updated.grade_code,
      name: updated.grade_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toGradeResponseDto(updated);
  }

  static async getAllGrades(orgId: string, options: FindAllGradesOptions = {}) {
    const result = await GradeRepository.findAll(orgId, options);
    return {
      items: result.items.map(AcademicMapper.toGradeResponseDto),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
