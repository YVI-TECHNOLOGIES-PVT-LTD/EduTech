import prisma from '../../../lib/prismaClient';
import { CreateAcademicYearGradeDto } from '../dto/request/create-academic-year-grade.dto';
import { UpdateAcademicYearGradeDto } from '../dto/request/update-academic-year-grade.dto';

const db: any = prisma;

export class AcademicYearGradeRepository {
  static async findById(academic_year_grade_id: string) {
    return db.academic_year_grades.findUnique({
      where: { academic_year_grade_id },
      include: {
        academic_years: true,
        grades: true,
        sections: {
          include: {
            staff: {
              include: { users_staff_user_idTousers: true },
            },
          },
        },
      },
    });
  }

  static async findByYearAndGrade(academic_year_id: string, grade_id: string) {
    return db.academic_year_grades.findFirst({
      where: { academic_year_id, grade_id },
    });
  }

  static async findByAcademicYear(academic_year_id: string) {
    return db.academic_year_grades.findMany({
      where: { academic_year_id },
      include: {
        grades: true,
        sections: {
          include: {
            staff: {
              include: { users_staff_user_idTousers: true },
            },
          },
        },
      },
    });
  }

  static async create(dto: CreateAcademicYearGradeDto, createdBy?: string | null) {
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

  static async update(academic_year_grade_id: string, dto: UpdateAcademicYearGradeDto, updatedBy?: string | null) {
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
}
