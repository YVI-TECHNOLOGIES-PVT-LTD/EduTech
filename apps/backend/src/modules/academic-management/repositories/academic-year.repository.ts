import prisma from '../../../lib/prismaClient';
import { CreateAcademicYearDto } from '../dto/request/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/request/update-academic-year.dto';
import { academic_year_status } from '../constants/academic.constants';

const db: any = prisma;

export interface FindAllAcademicYearsOptions {
  search?: string;
  status?: string;
  is_current?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AcademicYearRepository {
  static async findById(orgId: string, academic_year_id: string) {
    return db.academic_years.findFirst({
      where: {
        academic_year_id,
        org_id: orgId,
      },
      include: {
        academic_year_grades: {
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
          orderBy: {
            grades: { display_order: 'asc' },
          },
        },
      },
    });
  }

  static async findByName(orgId: string, academic_year_name: string) {
    return db.academic_years.findFirst({
      where: {
        org_id: orgId,
        academic_year_name: { equals: academic_year_name, mode: 'insensitive' },
      },
    });
  }

  static async findAll(orgId: string, options: FindAllAcademicYearsOptions = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      org_id: orgId,
    };

    if (options.search) {
      where.academic_year_name = {
        contains: options.search,
        mode: 'insensitive',
      };
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.is_current) {
      where.status = {
        in: [
          academic_year_status.teaching,
          academic_year_status.open,
          academic_year_status.admissions_open,
        ],
      };
    }

    const sortField = options.sortBy || 'start_date';
    const sortOrder = options.sortOrder || 'desc';

    const [items, total] = await Promise.all([
      db.academic_years.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
        include: {
          academic_year_grades: {
            include: { grades: true, sections: true },
          },
        },
      }),
      db.academic_years.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async findCurrent(orgId: string) {
    const teachingYear = await db.academic_years.findFirst({
      where: {
        org_id: orgId,
        status: academic_year_status.teaching,
      },
      include: {
        academic_year_grades: {
          include: { grades: true, sections: true },
        },
      },
    });

    if (teachingYear) return teachingYear;

    return db.academic_years.findFirst({
      where: {
        org_id: orgId,
        status: {
          in: [academic_year_status.open, academic_year_status.admissions_open],
        },
      },
      orderBy: { start_date: 'desc' },
      include: {
        academic_year_grades: {
          include: { grades: true, sections: true },
        },
      },
    });
  }

  static async create(orgId: string, dto: CreateAcademicYearDto, createdBy?: string | null) {
    return db.academic_years.create({
      data: {
        org_id: orgId,
        academic_year_name: dto.academic_year_name,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        status: dto.status || academic_year_status.planning,
        created_by: createdBy || undefined,
      },
    });
  }

  static async update(
    orgId: string,
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

    // Use updateMany to guarantee org_id boundary check in query
    await db.academic_years.updateMany({
      where: { academic_year_id, org_id: orgId },
      data,
    });

    return this.findById(orgId, academic_year_id);
  }

  static async setCurrent(orgId: string, academic_year_id: string, updatedBy?: string | null) {
    return db.$transaction(async (tx: any) => {
      // 1. Demote any currently teaching academic year to open
      await tx.academic_years.updateMany({
        where: {
          org_id: orgId,
          status: academic_year_status.teaching,
          academic_year_id: { not: academic_year_id },
        },
        data: {
          status: academic_year_status.open,
          updated_at: new Date(),
          updated_by: updatedBy || undefined,
        },
      });

      // 2. Promote target year to teaching
      await tx.academic_years.updateMany({
        where: {
          org_id: orgId,
          academic_year_id,
        },
        data: {
          status: academic_year_status.teaching,
          updated_at: new Date(),
          updated_by: updatedBy || undefined,
        },
      });

      return tx.academic_years.findFirst({
        where: { org_id: orgId, academic_year_id },
        include: {
          academic_year_grades: {
            include: { grades: true, sections: true },
          },
        },
      });
    });
  }
}
