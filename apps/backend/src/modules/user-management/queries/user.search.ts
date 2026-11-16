import prisma from '../../../lib/prismaClient';
import { sanitizeUserSearchQuery } from '../utils/user-search.helper';
import { SearchUserDto } from '../dto/request/search-user.dto';

const db: any = prisma;

export class UserSearchQuery {
  static async execute(params: SearchUserDto) {
    const q = sanitizeUserSearchQuery(params);

    const whereClause: any = {};
    if (q.org_id) whereClause.org_id = q.org_id;
    if (q.status) whereClause.status = q.status;

    if (q.role_id) {
      whereClause.user_roles_user_idTousers = {
        some: { role_id: q.role_id },
      };
    }

    if (q.searchText && q.searchText.trim() !== '') {
      const text = q.searchText.trim();
      whereClause.OR = [
        { first_name: { contains: text, mode: 'insensitive' } },
        { last_name: { contains: text, mode: 'insensitive' } },
        { email: { contains: text, mode: 'insensitive' } },
        { phone: { contains: text, mode: 'insensitive' } },
      ];
    }

    const total = await db.users.count({ where: whereClause });
    const skip = (q.page - 1) * q.pageSize;

    const items = await db.users.findMany({
      where: whereClause,
      include: {
        user_roles_user_idTousers: {
          include: {
            roles: true,
          },
        },
      },
      orderBy: {
        [q.sort]: q.order,
      },
      skip,
      take: q.pageSize,
    });

    const totalPages = Math.ceil(total / q.pageSize);

    return {
      items,
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages,
      hasNextPage: q.page < totalPages,
      hasPrevPage: q.page > 1,
    };
  }
}
