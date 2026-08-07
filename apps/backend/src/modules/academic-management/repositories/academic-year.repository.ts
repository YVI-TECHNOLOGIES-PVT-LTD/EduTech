import { academic_year_status } from '../constants/academic.constants';
import prisma from '../../../lib/prismaClient';
import { CreateAcademicYearDto } from '../dto/request/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/request/update-academic-year.dto';

const db: any = prisma;

export class AcademicYearRepository {
  static async findById(academic_year_id: string) {
    return db.academic_years.findUnique({
      where: { academic_year_id },
      include: {
        academic_year_grades: {
          include: { grades: true, sections: true },
        },
      },
    });
  }

  static async findByName(org_id: string, academic_year_name: string) {
    return db.academic_years.findFirst({
      where: { org_id, academic_year_name },
    });
  }

  static async findAll(org_id?: string) {
    const where: any = {};
    if (org_id) where.org_id = org_id;

    return db.academic_years.findMany({
      where,
      orderBy: { start_date: 'desc' },
      include: {
        academic_year_grades: {
          include: { grades: true, sections: true },
        },
      },
    });
  }

  static async create(dto: CreateAcademicYearDto, createdBy?: string | null) {
    return db.academic_years.create({
      data: {
        org_id: dto.org_id,
        academic_year_name: dto.academic_year_name,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        status: dto.status || academic_year_status.planning,
        created_by: createdBy || undefined,
      },
    });
  }

  static async update(
    academic_year_id: string,
    dto: UpdateAcademicYearDto,
    updatedBy?: string | null,
  ) {
    const data: any = { updated_at: new Date() };
    if (dto.academic_year_name !== undefined) data.academic_year_name = dto.academic_year_name;
    if (dto.start_date !== undefined) data.start_date = new Date(dto.start_date);
    if (dto.end_date !== undefined) data.end_date = new Date(dto.end_date);
    if (dto.status !== undefined) data.status = dto.status;
    if (updatedBy) data.updated_by = updatedBy;

    return db.academic_years.update({
      where: { academic_year_id },
      data,
    });
  }
}
