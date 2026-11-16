import prisma from '../../../lib/prismaClient';
import { sanitizeParentSearchQuery } from '../utils/parent-search.helper';
import { SearchParentDto } from '../dto/request/search-parent.dto';

const db: any = prisma;

export class ParentSearchQuery {
  static async execute(params: SearchParentDto) {
    const q = sanitizeParentSearchQuery(params);

    const whereClause: any = {};

    if (q.org_id) {
      whereClause.org_id = q.org_id;
    }

    if (q.searchText && q.searchText.trim() !== '') {
      const text = q.searchText.trim();
      whereClause.OR = [
        { first_name: { contains: text, mode: 'insensitive' } },
        { last_name: { contains: text, mode: 'insensitive' } },
        { phone: { contains: text, mode: 'insensitive' } },
        { email: { contains: text, mode: 'insensitive' } },
      ];
    }

    const total = await db.parents.count({
      where: whereClause,
    });

    const skip = (q.page - 1) * q.pageSize;
    const sortKey = (q.sort as string) === 'parent_name' ? 'first_name' : (q.sort as string);

    const items = await db.parents.findMany({
      where: whereClause,
      include: {
        student_parents: {
          include: { students: true },
        },
      },
      orderBy: {
        [sortKey]: q.order,
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
