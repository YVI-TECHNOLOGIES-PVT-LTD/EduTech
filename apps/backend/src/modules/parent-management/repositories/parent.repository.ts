import prisma from '../../../lib/prismaClient';
import { CreateParentDto } from '../dto/request/create-parent.dto';
import { UpdateParentDto } from '../dto/request/update-parent.dto';

const db: any = prisma;

export class ParentRepository {
  static async findById(parent_id: string) {
    return db.parents.findUnique({
      where: { parent_id },
      include: {
        student_parents: {
          include: { students: true },
        },
        users_parents_user_idTousers: true,
      },
    });
  }

  static async findByPhone(org_id: string, phone: string) {
    return db.parents.findFirst({
      where: { org_id, phone },
    });
  }

  static async findByUserId(org_id: string, user_id: string) {
    return db.parents.findFirst({
      where: { org_id, user_id },
      include: {
        student_parents: {
          include: { students: true },
        },
      },
    });
  }

  static async create(dto: CreateParentDto) {
    return db.parents.create({
      data: {
        org_id: dto.org_id,
        first_name: dto.first_name,
        last_name: dto.last_name || undefined,
        phone: dto.phone,
        email: dto.email || undefined,
        occupation: dto.occupation || undefined,
        user_id: dto.user_id || undefined,
      },
      include: {
        student_parents: {
          include: { students: true },
        },
      },
    });
  }

  static async update(parent_id: string, dto: UpdateParentDto) {
    const data: any = { updated_at: new Date() };
    if (dto.first_name !== undefined) data.first_name = dto.first_name;
    if (dto.last_name !== undefined) data.last_name = dto.last_name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.occupation !== undefined) data.occupation = dto.occupation;
    if (dto.user_id !== undefined) data.user_id = dto.user_id;

    return db.parents.update({
      where: { parent_id },
      data,
      include: {
        student_parents: {
          include: { students: true },
        },
      },
    });
  }

  static async delete(parent_id: string) {
    return db.parents.delete({
      where: { parent_id },
    });
  }
}
