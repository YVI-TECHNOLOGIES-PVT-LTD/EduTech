import prisma from '../../../lib/prismaClient';
import { CreateDesignationDto } from '../dto/request/create-designation.dto';
import { UpdateDesignationDto } from '../dto/request/update-designation.dto';

const db: any = prisma;

export class DesignationRepository {
  static async findById(designation_id: string) {
    return db.designations.findUnique({
      where: { designation_id },
    });
  }

  static async findByName(org_id: string, designation_name: string) {
    return db.designations.findFirst({
      where: { org_id, designation_name },
    });
  }

  static async findAll(org_id?: string) {
    const where: any = {};
    if (org_id) where.org_id = org_id;

    return db.designations.findMany({
      where,
      orderBy: { designation_name: 'asc' },
    });
  }

  static async create(dto: CreateDesignationDto, createdBy?: string | null) {
    return db.designations.create({
      data: {
        org_id: dto.org_id,
        designation_name: dto.designation_name,
        description: dto.description || undefined,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        created_by: createdBy || undefined,
      },
    });
  }

  static async update(designation_id: string, dto: UpdateDesignationDto, updatedBy?: string | null) {
    const data: any = { updated_at: new Date() };
    if (dto.designation_name !== undefined) data.designation_name = dto.designation_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (updatedBy) data.updated_by = updatedBy;

    return db.designations.update({
      where: { designation_id },
      data,
    });
  }
}
