import prisma from '../../../lib/prismaClient';
import { CreateUserDto } from '../dto/request/create-user.dto';
import { UpdateUserDto } from '../dto/request/update-user.dto';
import { user_status } from '../constants/user.constants';

const db: any = prisma;

export class UserRepository {
  static async findById(user_id: string) {
    return db.users.findUnique({
      where: { user_id },
      include: {
        user_roles_user_idTousers: {
          include: {
            roles: true,
          },
        },
      },
    });
  }

  static async findByEmail(email: string) {
    return db.users.findFirst({
      where: { email },
      include: {
        user_roles_user_idTousers: {
          include: {
            roles: true,
          },
        },
      },
    });
  }

  static async create(dto: CreateUserDto, createdBy?: string | null) {
    return db.users.create({
      data: {
        org_id: dto.org_id,
        first_name: dto.first_name,
        last_name: dto.last_name || undefined,
        email: dto.email,
        phone: dto.phone,
        status: (dto.status as any) || user_status.active,
        created_by: createdBy || undefined,
      },
      include: {
        user_roles_user_idTousers: {
          include: {
            roles: true,
          },
        },
      },
    });
  }

  static async update(user_id: string, dto: UpdateUserDto, updatedBy?: string | null) {
    const data: any = { updated_at: new Date() };
    if (dto.first_name !== undefined) data.first_name = dto.first_name;
    if (dto.last_name !== undefined) data.last_name = dto.last_name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (updatedBy) data.updated_by = updatedBy;

    return db.users.update({
      where: { user_id },
      data,
      include: {
        user_roles_user_idTousers: {
          include: {
            roles: true,
          },
        },
      },
    });
  }

  static async updateStatus(user_id: string, status: user_status, updatedBy?: string | null) {
    return db.users.update({
      where: { user_id },
      data: {
        status: status as any,
        updated_at: new Date(),
        updated_by: updatedBy || undefined,
      },
      include: {
        user_roles_user_idTousers: {
          include: {
            roles: true,
          },
        },
      },
    });
  }
}
