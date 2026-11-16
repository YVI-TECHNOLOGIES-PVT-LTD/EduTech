import prisma from '../../../lib/prismaClient';

const db: any = prisma;

export class UserRoleRepository {
  static async find(user_id: string, role_id: string) {
    return db.user_roles.findUnique({
      where: {
        user_id_role_id: {
          user_id,
          role_id,
        },
      },
    });
  }

  static async findByUser(user_id: string) {
    return db.user_roles.findMany({
      where: { user_id },
      include: {
        roles: true,
      },
    });
  }

  static async assign(user_id: string, role_id: string, grantedBy?: string | null) {
    return db.user_roles.create({
      data: {
        user_id,
        role_id,
        granted_by: grantedBy || undefined,
      },
      include: {
        roles: true,
      },
    });
  }

  static async remove(user_id: string, role_id: string) {
    return db.user_roles.delete({
      where: {
        user_id_role_id: {
          user_id,
          role_id,
        },
      },
    });
  }
}
