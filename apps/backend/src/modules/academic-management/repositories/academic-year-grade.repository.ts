import prisma from '../../../lib/prismaClient';
import { CreateAcademicYearGradeDto } from '../dto/request/create-academic-year-grade.dto';
import { UpdateAcademicYearGradeDto } from '../dto/request/update-academic-year-grade.dto';

const db: any = prisma;

export class AcademicYearGradeRepository {
  static async findById(orgId: string, academic_year_grade_id: string) {
    return db.academic_year_grades.findFirst({
      where: {
        academic_year_grade_id,
        academic_years: { org_id: orgId },
      },
      include: {
        academic_years: true,
        grades: true,
        sections: {
          include: {
            staff: {
              include: { users_staff_user_idTousers: true },
            },
          },
          orderBy: { section_name: 'asc' },
        },
      },
    });
  }

  static async findByYearAndGrade(orgId: string, academic_year_id: string, grade_id: string) {
    return db.academic_year_grades.findFirst({
      where: {
        academic_year_id,
        grade_id,
        academic_years: { org_id: orgId },
      },
      include: {
        academic_years: true,
        grades: true,
        sections: true,
      },
    });
  }

  static async findByAcademicYear(orgId: string, academic_year_id: string) {
    return db.academic_year_grades.findMany({
      where: {
        academic_year_id,
        academic_years: { org_id: orgId },
      },
      include: {
        academic_years: true,
        grades: true,
        sections: {
          include: {
            staff: {
              include: { users_staff_user_idTousers: true },
            },
          },
          orderBy: { section_name: 'asc' },
        },
      },
      orderBy: {
        grades: { display_order: 'asc' },
      },
    });
  }

  static async create(orgId: string, dto: CreateAcademicYearGradeDto, createdBy?: string | null) {
    return db.academic_year_grades.create({
      data: {
        academic_year_id: dto.academic_year_id,
        grade_id: dto.grade_id,
        intake_capacity: dto.intake_capacity ?? undefined,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        created_by: createdBy || undefined,
      },
      include: {
        academic_years: true,
        grades: true,
        sections: true,
      },
    });
  }

  static async update(
    orgId: string,
    academic_year_grade_id: string,
    dto: UpdateAcademicYearGradeDto,
    updatedBy?: string | null,
  ) {
    const existing = await this.findById(orgId, academic_year_grade_id);
    if (!existing) return null;

    const data: any = { updated_at: new Date() };
    if (dto.intake_capacity !== undefined) data.intake_capacity = dto.intake_capacity;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (updatedBy) data.updated_by = updatedBy;

    return db.academic_year_grades.update({
      where: { academic_year_grade_id },
      data,
      include: {
        academic_years: true,
        grades: true,
        sections: true,
      },
    });
  }

  static async countSections(academic_year_grade_id: string): Promise<number> {
    return db.sections.count({
      where: { academic_year_grade_id },
    });
  }

  static async delete(orgId: string, academic_year_grade_id: string) {
    const existing = await this.findById(orgId, academic_year_grade_id);
    if (!existing) return null;

    return db.academic_year_grades.delete({
      where: { academic_year_grade_id },
    });
  }
}
