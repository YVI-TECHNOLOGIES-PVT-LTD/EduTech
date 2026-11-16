import {
  AcademicYearRepository,
  FindAllAcademicYearsOptions,
} from '../repositories/academic-year.repository';
import { AcademicValidator } from '../validators/academic.validator';
import { AcademicYearNotFoundError, DuplicateAcademicYearError } from '../errors/academic.errors';
import { CreateAcademicYearDto } from '../dto/request/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/request/update-academic-year.dto';
import { AcademicYearResponseDto } from '../dto/response/academic-year.response.dto';
import { AcademicMapper } from '../mappers/academic.mapper';
import { AcademicEvents, AcademicEventType } from '../events/academic.events';
import { logger } from '../../../utils/logger';
import { academic_year_status } from '../constants/academic.constants';

export class AcademicYearService {
  static async createAcademicYear(
    orgId: string,
    dto: CreateAcademicYearDto,
    performedBy?: string | null,
  ): Promise<AcademicYearResponseDto> {
    dto.org_id = orgId;
    AcademicValidator.validateCreateAcademicYear(dto);

    const existing = await AcademicYearRepository.findByName(orgId, dto.academic_year_name);
    if (existing) {
      throw new DuplicateAcademicYearError(dto.academic_year_name);
    }

    const year = await AcademicYearRepository.create(orgId, dto, performedBy);

    logger.info(
      `Academic year created: ${year.academic_year_id} (${year.academic_year_name}) in org ${orgId}`,
      {
        academicYearId: year.academic_year_id,
        name: year.academic_year_name,
        orgId,
        performedBy,
      },
    );

    await AcademicEvents.publish(AcademicEventType.YEAR_CREATED, {
      entityId: year.academic_year_id,
      name: year.academic_year_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toAcademicYearResponseDto(year);
  }

  static async getAcademicYearById(orgId: string, id: string): Promise<AcademicYearResponseDto> {
    const year = await AcademicYearRepository.findById(orgId, id);
    if (!year) {
      throw new AcademicYearNotFoundError(id);
    }
    const dto = AcademicMapper.toAcademicYearResponseDto(year);
    if (year.academic_year_grades) {
      dto.grade_offerings = year.academic_year_grades.map(
        AcademicMapper.toAcademicYearGradeResponseDto,
      );
    }
    return dto;
  }

  static async getAllAcademicYears(orgId: string, options: FindAllAcademicYearsOptions = {}) {
    const result = await AcademicYearRepository.findAll(orgId, options);
    return {
      items: result.items.map(AcademicMapper.toAcademicYearResponseDto),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  static async getCurrentAcademicYear(orgId: string): Promise<AcademicYearResponseDto | null> {
    const year = await AcademicYearRepository.findCurrent(orgId);
    if (!year) return null;
    return AcademicMapper.toAcademicYearResponseDto(year);
  }

  static async setCurrentAcademicYear(
    orgId: string,
    id: string,
    performedBy?: string | null,
  ): Promise<AcademicYearResponseDto> {
    const existing = await AcademicYearRepository.findById(orgId, id);
    if (!existing) {
      throw new AcademicYearNotFoundError(id);
    }

    const updated = await AcademicYearRepository.setCurrent(orgId, id, performedBy);
    logger.info(`Academic year ${id} set as current (teaching) for org ${orgId}`, {
      academicYearId: id,
      orgId,
      performedBy,
    });

    return AcademicMapper.toAcademicYearResponseDto(updated);
  }

  static async updateAcademicYear(
    orgId: string,
    id: string,
    dto: UpdateAcademicYearDto,
    performedBy?: string | null,
  ): Promise<AcademicYearResponseDto> {
    const existing = await AcademicYearRepository.findById(orgId, id);
    if (!existing) {
      throw new AcademicYearNotFoundError(id);
    }

    AcademicValidator.validateUpdateAcademicYear(
      {
        start_date: existing.start_date,
        end_date: existing.end_date,
        status: existing.status,
      },
      dto,
    );

    if (dto.academic_year_name && dto.academic_year_name !== existing.academic_year_name) {
      const duplicate = await AcademicYearRepository.findByName(orgId, dto.academic_year_name);
      if (duplicate && duplicate.academic_year_id !== id) {
        throw new DuplicateAcademicYearError(dto.academic_year_name);
      }
    }

    const updated = await AcademicYearRepository.update(orgId, id, dto, performedBy);

    logger.info(`Academic year updated: ${id} in org ${orgId}`, {
      academicYearId: id,
      orgId,
      performedBy,
    });

    await AcademicEvents.publish(AcademicEventType.YEAR_UPDATED, {
      entityId: id,
      name: updated.academic_year_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toAcademicYearResponseDto(updated);
  }

  static async archiveAcademicYear(
    orgId: string,
    id: string,
    performedBy?: string | null,
  ): Promise<AcademicYearResponseDto> {
    const existing = await AcademicYearRepository.findById(orgId, id);
    if (!existing) {
      throw new AcademicYearNotFoundError(id);
    }

    const updated = await AcademicYearRepository.update(
      orgId,
      id,
      { status: academic_year_status.archived as any },
      performedBy,
    );

    logger.info(`Academic year archived: ${id} in org ${orgId}`, {
      academicYearId: id,
      orgId,
      performedBy,
    });

    return AcademicMapper.toAcademicYearResponseDto(updated);
  }
}
