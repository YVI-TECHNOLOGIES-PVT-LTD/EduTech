import prisma from '../../../lib/prismaClient';
import { CreateSectionDto } from '../dto/request/create-section.dto';
import { UpdateSectionDto } from '../dto/request/update-section.dto';

const db: any = prisma;

export class SectionRepository {
  static async findById(section_id: string) {
    return db.sections.findUnique({
      where: { section_id },
      include: {
        academic_year_grades: {
          include: { academic_years: true, grades: true },
        },
        staff: {
          include: { users_staff_user_idTousers: true },
        },
      },
    });
  }

  static async findByName(academic_year_grade_id: string, section_name: string) {
    return db.sections.findFirst({
      where: { academic_year_grade_id, section_name },
    });
  }

  static async findByAcademicYearGrade(academic_year_grade_id: string) {
    return db.sections.findMany({
      where: { academic_year_grade_id },
      orderBy: { section_name: 'asc' },
      include: {
        staff: {
          include: { users_staff_user_idTousers: true },
        },
      },
    });
  }

  static async create(dto: CreateSectionDto, createdBy?: string | null) {
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
        staff: {
          include: { users_staff_user_idTousers: true },
        },
      },
    });
  }

  static async update(section_id: string, dto: UpdateSectionDto, updatedBy?: string | null) {
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
        staff: {
          include: { users_staff_user_idTousers: true },
        },
      },
    });
  }
}
