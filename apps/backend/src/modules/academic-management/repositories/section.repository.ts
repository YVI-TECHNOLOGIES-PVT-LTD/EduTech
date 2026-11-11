import prisma from '../../../lib/prismaClient';
import { CreateSectionDto } from '../dto/request/create-section.dto';
import { UpdateSectionDto } from '../dto/request/update-section.dto';

const db: any = prisma;

export interface FindAllSectionsOptions {
  academic_year_id?: string;
  academic_year_grade_id?: string;
  grade_id?: string;
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class SectionRepository {
  static async findById(orgId: string, section_id: string) {
    return db.sections.findFirst({
      where: {
        section_id,
        academic_year_grades: {
          academic_years: { org_id: orgId },
        },
      },
      include: {
        academic_year_grades: {
          include: { academic_years: true, grades: true },
        },
        staff: {
          include: {
            users_staff_user_idTousers: true,
            designations: true,
          },
        },
      },
    });
  }

  static async findByName(orgId: string, academic_year_grade_id: string, section_name: string) {
    return db.sections.findFirst({
      where: {
        academic_year_grade_id,
        section_name: { equals: section_name, mode: 'insensitive' },
        academic_year_grades: {
          academic_years: { org_id: orgId },
        },
      },
      include: {
        staff: {
          include: { users_staff_user_idTousers: true },
        },
      },
    });
  }

  static async findByAcademicYearGrade(orgId: string, academic_year_grade_id: string) {
    return db.sections.findMany({
      where: {
        academic_year_grade_id,
        academic_year_grades: {
          academic_years: { org_id: orgId },
        },
      },
      orderBy: { section_name: 'asc' },
      include: {
        staff: {
          include: {
            users_staff_user_idTousers: true,
            designations: true,
          },
        },
      },
    });
  }

  static async findAll(orgId: string, options: FindAllSectionsOptions = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      academic_year_grades: {
        academic_years: { org_id: orgId },
      },
    };

    if (options.academic_year_id) {
      where.academic_year_grades.academic_year_id = options.academic_year_id;
    }

    if (options.academic_year_grade_id) {
      where.academic_year_grade_id = options.academic_year_grade_id;
    }

    if (options.grade_id) {
      where.academic_year_grades.grade_id = options.grade_id;
    }

    if (options.search) {
      where.section_name = { contains: options.search, mode: 'insensitive' };
    }

    if (options.is_active !== undefined) {
      where.is_active = options.is_active;
    }

    const sortField = options.sortBy || 'section_name';
    const sortOrder = options.sortOrder || 'asc';

    const [items, total] = await Promise.all([
      db.sections.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
        include: {
          academic_year_grades: {
            include: { grades: true, academic_years: true },
          },
          staff: {
            include: {
              users_staff_user_idTousers: true,
              designations: true,
            },
          },
        },
      }),
      db.sections.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async create(orgId: string, dto: CreateSectionDto, createdBy?: string | null) {
    return db.sections.create({
      data: {
        academic_year_grade_id: dto.academic_year_grade_id,
        section_name: dto.section_name,
        class_teacher_id: dto.class_teacher_id || undefined,
        room_no: dto.room_no || undefined,
        capacity: dto.capacity ?? undefined,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        created_by: createdBy || undefined,
      },
      include: {
        academic_year_grades: {
          include: { grades: true, academic_years: true },
        },
        staff: {
          include: {
            users_staff_user_idTousers: true,
            designations: true,
          },
        },
      },
    });
  }

  static async update(
    orgId: string,
    section_id: string,
    dto: UpdateSectionDto,
    updatedBy?: string | null,
  ) {
    const existing = await this.findById(orgId, section_id);
    if (!existing) return null;

    const data: any = { updated_at: new Date() };
    if (dto.section_name !== undefined) data.section_name = dto.section_name;
    if (dto.class_teacher_id !== undefined) data.class_teacher_id = dto.class_teacher_id;
    if (dto.room_no !== undefined) data.room_no = dto.room_no;
    if (dto.capacity !== undefined) data.capacity = dto.capacity;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (updatedBy) data.updated_by = updatedBy;

    return db.sections.update({
      where: { section_id },
      data,
      include: {
        academic_year_grades: {
          include: { grades: true, academic_years: true },
        },
        staff: {
          include: {
            users_staff_user_idTousers: true,
            designations: true,
          },
        },
      },
    });
  }

  static async assignClassTeacher(
    orgId: string,
    section_id: string,
    staff_id: string | null,
    updatedBy?: string | null,
  ) {
    const existing = await this.findById(orgId, section_id);
    if (!existing) return null;

    return db.sections.update({
      where: { section_id },
      data: {
        class_teacher_id: staff_id,
        updated_at: new Date(),
        updated_by: updatedBy || undefined,
      },
      include: {
        academic_year_grades: {
          include: { grades: true, academic_years: true },
        },
        staff: {
          include: {
            users_staff_user_idTousers: true,
            designations: true,
          },
        },
      },
    });
  }

  static async countStudentEnrollments(section_id: string): Promise<number> {
    return db.student_enrollments.count({
      where: { section_id },
    });
  }

  static async delete(orgId: string, section_id: string) {
    const existing = await this.findById(orgId, section_id);
    if (!existing) return null;

    return db.sections.delete({
      where: { section_id },
    });
  }
}
