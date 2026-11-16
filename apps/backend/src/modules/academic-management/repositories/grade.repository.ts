import prisma from '../../../lib/prismaClient';
import { CreateGradeDto } from '../dto/request/create-grade.dto';
import { UpdateGradeDto } from '../dto/request/update-grade.dto';

const db: any = prisma;

export class GradeRepository {
  static async findById(grade_id: string) {
    return db.grades.findUnique({
      where: { grade_id },
    });
  }

  static async findByCodeOrName(org_id: string, code: string, name: string) {
    return db.grades.findFirst({
      where: {
        org_id,
        OR: [{ grade_code: code }, { grade_name: name }],
      },
    });
  }

  static async findAll(org_id?: string) {
    const where: any = {};
    if (org_id) where.org_id = org_id;

    return db.grades.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });
  }

  static async create(dto: CreateGradeDto, createdBy?: string | null) {
    return db.grades.create({
      data: {
        org_id: dto.org_id,
        grade_code: dto.grade_code,
        grade_name: dto.grade_name,
        board: dto.board || undefined,
        display_order: dto.display_order ?? 1,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        created_by: createdBy || undefined,
      },
    });
  }

  static async update(grade_id: string, dto: UpdateGradeDto, updatedBy?: string | null) {
    const data: any = { updated_at: new Date() };
    if (dto.grade_code !== undefined) data.grade_code = dto.grade_code;
    if (dto.grade_name !== undefined) data.grade_name = dto.grade_name;
    if (dto.board !== undefined) data.board = dto.board;
    if (dto.display_order !== undefined) data.display_order = dto.display_order;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (updatedBy) data.updated_by = updatedBy;

    return db.grades.update({
      where: { grade_id },
      data,
    });
  }
}
