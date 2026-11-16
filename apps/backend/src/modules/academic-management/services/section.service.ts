import prisma from '../../../lib/prismaClient';
import { SectionRepository, FindAllSectionsOptions } from '../repositories/section.repository';
import { AcademicYearGradeRepository } from '../repositories/academic-year-grade.repository';
import { AcademicValidator } from '../validators/academic.validator';
import {
  SectionNotFoundError,
  AcademicYearGradeNotFoundError,
  DuplicateSectionError,
  StaffNotFoundError,
  InactiveStaffError,
  ConflictOperationError,
} from '../errors/academic.errors';
import { CreateSectionDto } from '../dto/request/create-section.dto';
import { UpdateSectionDto } from '../dto/request/update-section.dto';
import { SectionResponseDto } from '../dto/response/section.response.dto';
import { AcademicMapper } from '../mappers/academic.mapper';
import { AcademicEvents, AcademicEventType } from '../events/academic.events';
import { logger } from '../../../utils/logger';

const db: any = prisma;

export class SectionService {
  static async createSection(
    orgId: string,
    dto: CreateSectionDto,
    performedBy?: string | null,
  ): Promise<SectionResponseDto> {
    AcademicValidator.validateCreateSection(dto);

    const parentMapping = await AcademicYearGradeRepository.findById(
      orgId,
      dto.academic_year_grade_id,
    );
    if (!parentMapping) {
      throw new AcademicYearGradeNotFoundError(dto.academic_year_grade_id);
    }

    const existing = await SectionRepository.findByName(
      orgId,
      dto.academic_year_grade_id,
      dto.section_name,
    );
    if (existing) {
      throw new DuplicateSectionError(dto.section_name);
    }

    if (dto.class_teacher_id) {
      const staffMember = await db.staff.findFirst({
        where: { staff_id: dto.class_teacher_id, org_id: orgId },
      });
      if (!staffMember) {
        throw new StaffNotFoundError(dto.class_teacher_id);
      }
      if (!staffMember.is_active) {
        throw new InactiveStaffError(dto.class_teacher_id);
      }
    }

    const section = await SectionRepository.create(orgId, dto, performedBy);

    logger.info(
      `Section created: ${section.section_id} (${section.section_name}) in org ${orgId}`,
      {
        sectionId: section.section_id,
        name: section.section_name,
        orgId,
        performedBy,
      },
    );

    await AcademicEvents.publish(AcademicEventType.SECTION_CREATED, {
      entityId: section.section_id,
      name: section.section_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toSectionResponseDto(section);
  }

  static async getSectionById(orgId: string, id: string): Promise<SectionResponseDto> {
    const section = await SectionRepository.findById(orgId, id);
    if (!section) {
      throw new SectionNotFoundError(id);
    }
    return AcademicMapper.toSectionResponseDto(section);
  }

  static async getAllSections(orgId: string, options: FindAllSectionsOptions = {}) {
    const result = await SectionRepository.findAll(orgId, options);
    return {
      items: result.items.map(AcademicMapper.toSectionResponseDto),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  static async updateSection(
    orgId: string,
    id: string,
    dto: UpdateSectionDto,
    performedBy?: string | null,
  ): Promise<SectionResponseDto> {
    const existing = await SectionRepository.findById(orgId, id);
    if (!existing) {
      throw new SectionNotFoundError(id);
    }

    if (dto.section_name && dto.section_name !== existing.section_name) {
      const duplicate = await SectionRepository.findByName(
        orgId,
        existing.academic_year_grade_id,
        dto.section_name,
      );
      if (duplicate && duplicate.section_id !== id) {
        throw new DuplicateSectionError(dto.section_name);
      }
    }

    if (dto.class_teacher_id) {
      const staffMember = await db.staff.findFirst({
        where: { staff_id: dto.class_teacher_id, org_id: orgId },
      });
      if (!staffMember) {
        throw new StaffNotFoundError(dto.class_teacher_id);
      }
      if (!staffMember.is_active) {
        throw new InactiveStaffError(dto.class_teacher_id);
      }
    }

    const updated = await SectionRepository.update(orgId, id, dto, performedBy);

    logger.info(`Section updated: ${id} in org ${orgId}`, {
      sectionId: id,
      orgId,
      performedBy,
    });

    await AcademicEvents.publish(AcademicEventType.SECTION_UPDATED, {
      entityId: id,
      name: updated.section_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return AcademicMapper.toSectionResponseDto(updated);
  }

  static async assignClassTeacher(
    orgId: string,
    sectionId: string,
    staffId: string | null,
    performedBy?: string | null,
  ): Promise<SectionResponseDto> {
    const existing = await SectionRepository.findById(orgId, sectionId);
    if (!existing) {
      throw new SectionNotFoundError(sectionId);
    }

    if (staffId) {
      const staffMember = await db.staff.findFirst({
        where: { staff_id: staffId, org_id: orgId },
      });
      if (!staffMember) {
        throw new StaffNotFoundError(staffId);
      }
      if (!staffMember.is_active) {
        throw new InactiveStaffError(staffId);
      }
    }

    const updated = await SectionRepository.assignClassTeacher(
      orgId,
      sectionId,
      staffId,
      performedBy,
    );

    logger.info(`Class teacher assigned to section ${sectionId}: ${staffId} in org ${orgId}`, {
      sectionId,
      staffId,
      orgId,
      performedBy,
    });

    return AcademicMapper.toSectionResponseDto(updated);
  }

  static async getSectionsByAcademicYearGrade(
    orgId: string,
    academicYearGradeId: string,
  ): Promise<SectionResponseDto[]> {
    const parentMapping = await AcademicYearGradeRepository.findById(orgId, academicYearGradeId);
    if (!parentMapping) {
      throw new AcademicYearGradeNotFoundError(academicYearGradeId);
    }

    const sections = await SectionRepository.findByAcademicYearGrade(orgId, academicYearGradeId);
    return sections.map(AcademicMapper.toSectionResponseDto);
  }

  static async deleteSection(orgId: string, id: string): Promise<void> {
    const existing = await SectionRepository.findById(orgId, id);
    if (!existing) {
      throw new SectionNotFoundError(id);
    }

    const enrollmentCount = await SectionRepository.countStudentEnrollments(id);
    if (enrollmentCount > 0) {
      throw new ConflictOperationError(
        `Cannot delete section '${existing.section_name}' because ${enrollmentCount} active student enrollment(s) exist in it. Deactivate the section instead.`,
      );
    }

    await SectionRepository.delete(orgId, id);

    logger.info(`Section deleted: ${id} in org ${orgId}`, {
      sectionId: id,
      orgId,
    });
  }
}
