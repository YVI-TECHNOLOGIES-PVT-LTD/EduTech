import prisma from '../../../lib/prismaClient';
import { CreateRoleDto } from '../dto/request/create-role.dto';
import { UpdateRoleDto } from '../dto/request/update-role.dto';

const db: any = prisma;

export class RoleRepository {
  static async findById(role_id: string) {
    return db.roles.findUnique({
      where: { role_id },
    });
  }

  static async findByName(org_id: string, role_name: string) {
    return db.roles.findFirst({
      where: { org_id, role_name },
    });
  }

  static async findAll(org_id?: string) {
    const where: any = {};
    if (org_id) where.org_id = org_id;

    return db.roles.findMany({
      where,
      orderBy: { role_name: 'asc' },
    });
  }

  static async create(dto: CreateRoleDto, createdBy?: string | null) {
    return db.roles.create({
      data: {
        org_id: dto.org_id,
        role_name: dto.role_name,
        description: dto.description || undefined,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        created_by: createdBy || undefined,
      },
    });
  }

  static async update(role_id: string, dto: UpdateRoleDto, updatedBy?: string | null) {
    const data: any = { updated_at: new Date() };
    if (dto.role_name !== undefined) data.role_name = dto.role_name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (updatedBy) data.updated_by = updatedBy;

    return db.roles.update({
      where: { role_id },
      data,
    });
  }
}
