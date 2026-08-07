import { SectionRepository } from '../repositories/section.repository';
import { AcademicYearGradeRepository } from '../repositories/academic-year-grade.repository';
import { AcademicValidator } from '../validators/academic.validator';
import {
  SectionNotFoundError,
  AcademicYearGradeNotFoundError,
  DuplicateSectionError,
} from '../errors/academic.errors';
import { CreateSectionDto } from '../dto/request/create-section.dto';
import { UpdateSectionDto } from '../dto/request/update-section.dto';
import { SectionResponseDto } from '../dto/response/section.response.dto';
import { AcademicMapper } from '../mappers/academic.mapper';
import { AcademicEvents, AcademicEventType } from '../events/academic.events';
import { logger } from '../../../utils/logger';

export class SectionService {
  static async createSection(
    dto: CreateSectionDto,
    performedBy?: string | null,
  ): Promise<SectionResponseDto> {
    AcademicValidator.validateCreateSection(dto);

    const parentMapping = await AcademicYearGradeRepository.findById(dto.academic_year_grade_id);
    if (!parentMapping) {
      throw new AcademicYearGradeNotFoundError(dto.academic_year_grade_id);
    }

    const existing = await SectionRepository.findByName(
      dto.academic_year_grade_id,
      dto.section_name,
    );
    if (existing) {
      throw new DuplicateSectionError(dto.section_name);
    }

    const section = await SectionRepository.create(dto, performedBy);

    logger.info(`Section created: ${section.section_id} (${section.section_name})`, {
      sectionId: section.section_id,
      name: section.section_name,
      performedBy,
    });

    // Post-commit event emission
    await AcademicEvents.publish(AcademicEventType.SECTION_CREATED, {
      entityId: section.section_id,
      name: section.section_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toSectionResponseDto(section);
  }

  static async getSectionById(id: string): Promise<SectionResponseDto> {
    const section = await SectionRepository.findById(id);
    if (!section) {
      throw new SectionNotFoundError(id);
    }
    return AcademicMapper.toSectionResponseDto(section);
  }

  static async updateSection(
    id: string,
    dto: UpdateSectionDto,
    performedBy?: string | null,
  ): Promise<SectionResponseDto> {
    const existing = await SectionRepository.findById(id);
    if (!existing) {
      throw new SectionNotFoundError(id);
    }

    const updated = await SectionRepository.update(id, dto, performedBy);

    logger.info(`Section updated: ${id}`, { sectionId: id, performedBy });

    // Post-commit event emission
    await AcademicEvents.publish(AcademicEventType.SECTION_UPDATED, {
      entityId: id,
      name: updated.section_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toSectionResponseDto(updated);
  }

  static async getSectionsByAcademicYearGrade(
    academicYearGradeId: string,
  ): Promise<SectionResponseDto[]> {
    const sections = await SectionRepository.findByAcademicYearGrade(academicYearGradeId);
    return sections.map(AcademicMapper.toSectionResponseDto);
  }
}
