import prisma from '../../../lib/prismaClient';
import { CreateGradeDto } from '../dto/request/create-grade.dto';
import { UpdateGradeDto } from '../dto/request/update-grade.dto';

const db: any = prisma;

export interface FindAllGradesOptions {
  search?: string;
  board?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class GradeRepository {
  static async findById(orgId: string, grade_id: string) {
    return db.grades.findFirst({
      where: {
        grade_id,
        org_id: orgId,
      },
      include: {
        academic_year_grades: {
          include: {
            academic_years: true,
          },
        },
      },
    });
  }

  static async findByCode(orgId: string, grade_code: string) {
    return db.grades.findFirst({
      where: {
        org_id: orgId,
        grade_code: { equals: grade_code, mode: 'insensitive' },
      },
    });
  }

  static async findByName(orgId: string, grade_name: string) {
    return db.grades.findFirst({
      where: {
        org_id: orgId,
        grade_name: { equals: grade_name, mode: 'insensitive' },
      },
    });
  }

  static async findByCodeOrName(orgId: string, code: string, name: string) {
    return db.grades.findFirst({
      where: {
        org_id: orgId,
        OR: [
          { grade_code: { equals: code, mode: 'insensitive' } },
          { grade_name: { equals: name, mode: 'insensitive' } },
        ],
      },
    });
  }

  static async findAll(orgId: string, options: FindAllGradesOptions = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      org_id: orgId,
    };

    if (options.search) {
      where.OR = [
        { grade_name: { contains: options.search, mode: 'insensitive' } },
        { grade_code: { contains: options.search, mode: 'insensitive' } },
        { board: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.is_active !== undefined) {
      where.is_active = options.is_active;
    }

    if (options.board) {
      where.board = { equals: options.board, mode: 'insensitive' };
    }

    const sortField = options.sortBy || 'display_order';
    const sortOrder = options.sortOrder || 'asc';

    const [items, total] = await Promise.all([
      db.grades.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
      }),
      db.grades.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async create(orgId: string, dto: CreateGradeDto, createdBy?: string | null) {
    return db.grades.create({
      data: {
        org_id: orgId,
        grade_code: dto.grade_code,
        grade_name: dto.grade_name,
        board: dto.board || undefined,
        display_order: dto.display_order ?? 1,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        created_by: createdBy || undefined,
      },
    });
  }

  static async update(
    orgId: string,
    grade_id: string,
    dto: UpdateGradeDto,
    updatedBy?: string | null,
  ) {
    const data: any = { updated_at: new Date() };
    if (dto.grade_code !== undefined) data.grade_code = dto.grade_code;
    if (dto.grade_name !== undefined) data.grade_name = dto.grade_name;
    if (dto.board !== undefined) data.board = dto.board;
    if (dto.display_order !== undefined) data.display_order = dto.display_order;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (updatedBy) data.updated_by = updatedBy;

    await db.grades.updateMany({
      where: { grade_id, org_id: orgId },
      data,
    });

    return this.findById(orgId, grade_id);
  }
}
