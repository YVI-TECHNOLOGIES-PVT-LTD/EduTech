import { GradeRepository } from '../repositories/grade.repository';
import { AcademicValidator } from '../validators/academic.validator';
import { GradeNotFoundError, DuplicateGradeError } from '../errors/academic.errors';
import { CreateGradeDto } from '../dto/request/create-grade.dto';
import { UpdateGradeDto } from '../dto/request/update-grade.dto';
import { GradeResponseDto } from '../dto/response/grade.response.dto';
import { AcademicMapper } from '../mappers/academic.mapper';
import { AcademicEvents, AcademicEventType } from '../events/academic.events';
import { logger } from '../../../utils/logger';

export class GradeService {
  static async createGrade(dto: CreateGradeDto, performedBy?: string | null): Promise<GradeResponseDto> {
    AcademicValidator.validateCreateGrade(dto);

    const existing = await GradeRepository.findByCodeOrName(dto.org_id, dto.grade_code, dto.grade_name);
    if (existing) {
      throw new DuplicateGradeError(dto.grade_code);
    }

    const grade = await GradeRepository.create(dto, performedBy);

    logger.info(`Grade created: ${grade.grade_id} (${grade.grade_code})`, {
      gradeId: grade.grade_id,
      code: grade.grade_code,
      performedBy,
    });

    // Post-commit event emission
    await AcademicEvents.publish(AcademicEventType.GRADE_CREATED, {
      entityId: grade.grade_id,
      code: grade.grade_code,
      name: grade.grade_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toGradeResponseDto(grade);
  }

  static async getGradeById(id: string): Promise<GradeResponseDto> {
    const grade = await GradeRepository.findById(id);
    if (!grade) {
      throw new GradeNotFoundError(id);
    }
    return AcademicMapper.toGradeResponseDto(grade);
  }

  static async updateGrade(id: string, dto: UpdateGradeDto, performedBy?: string | null): Promise<GradeResponseDto> {
    const existing = await GradeRepository.findById(id);
    if (!existing) {
      throw new GradeNotFoundError(id);
    }

    const updated = await GradeRepository.update(id, dto, performedBy);

    logger.info(`Grade updated: ${id}`, { gradeId: id, performedBy });

    // Post-commit event emission
    await AcademicEvents.publish(AcademicEventType.GRADE_UPDATED, {
      entityId: id,
      code: updated.grade_code,
      name: updated.grade_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toGradeResponseDto(updated);
  }

  static async getAllGrades(orgId?: string): Promise<GradeResponseDto[]> {
    const grades = await GradeRepository.findAll(orgId);
    return grades.map(AcademicMapper.toGradeResponseDto);
  }
}
