import { AcademicYearRepository } from '../repositories/academic-year.repository';
import { AcademicValidator } from '../validators/academic.validator';
import { AcademicYearNotFoundError, DuplicateAcademicYearError } from '../errors/academic.errors';
import { CreateAcademicYearDto } from '../dto/request/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/request/update-academic-year.dto';
import { AcademicYearResponseDto } from '../dto/response/academic-year.response.dto';
import { AcademicMapper } from '../mappers/academic.mapper';
import { AcademicEvents, AcademicEventType } from '../events/academic.events';
import { logger } from '../../../utils/logger';

export class AcademicYearService {
  static async createAcademicYear(
    dto: CreateAcademicYearDto,
    performedBy?: string | null,
  ): Promise<AcademicYearResponseDto> {
    AcademicValidator.validateCreateAcademicYear(dto);

    const existing = await AcademicYearRepository.findByName(dto.org_id, dto.academic_year_name);
    if (existing) {
      throw new DuplicateAcademicYearError(dto.academic_year_name);
    }

    const year = await AcademicYearRepository.create(dto, performedBy);

    logger.info(`Academic year created: ${year.academic_year_id} (${year.academic_year_name})`, {
      academicYearId: year.academic_year_id,
      name: year.academic_year_name,
      performedBy,
    });

    // Post-commit event emission
    await AcademicEvents.publish(AcademicEventType.YEAR_CREATED, {
      entityId: year.academic_year_id,
      name: year.academic_year_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toAcademicYearResponseDto(year);
  }

  static async getAcademicYearById(id: string): Promise<AcademicYearResponseDto> {
    const year = await AcademicYearRepository.findById(id);
    if (!year) {
      throw new AcademicYearNotFoundError(id);
    }
    return AcademicMapper.toAcademicYearResponseDto(year);
  }

  static async updateAcademicYear(
    id: string,
    dto: UpdateAcademicYearDto,
    performedBy?: string | null,
  ): Promise<AcademicYearResponseDto> {
    const existing = await AcademicYearRepository.findById(id);
    if (!existing) {
      throw new AcademicYearNotFoundError(id);
    }

    const updated = await AcademicYearRepository.update(id, dto, performedBy);

    logger.info(`Academic year updated: ${id}`, { academicYearId: id, performedBy });

    // Post-commit event emission
    await AcademicEvents.publish(AcademicEventType.YEAR_UPDATED, {
      entityId: id,
      name: updated.academic_year_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toAcademicYearResponseDto(updated);
  }

  static async getAllAcademicYears(orgId?: string): Promise<AcademicYearResponseDto[]> {
    const years = await AcademicYearRepository.findAll(orgId);
    return years.map(AcademicMapper.toAcademicYearResponseDto);
  }
}
