import prisma from '../../../lib/prismaClient';
import { sanitizeAcademicSearchQuery } from '../utils/academic-search.helper';
import { SearchAcademicDto } from '../dto/request/search-academic.dto';

const db: any = prisma;

export class AcademicSearchQuery {
  static async execute(params: SearchAcademicDto) {
    const q = sanitizeAcademicSearchQuery(params);

    const whereClause: any = {};
    if (q.org_id) whereClause.org_id = q.org_id;

    if (q.searchText && q.searchText.trim() !== '') {
      const text = q.searchText.trim();
      whereClause.OR = [{ academic_year_name: { contains: text, mode: 'insensitive' } }];
    }

    const total = await db.academic_years.count({ where: whereClause });
    const skip = (q.page - 1) * q.pageSize;

    const items = await db.academic_years.findMany({
      where: whereClause,
      include: {
        academic_year_grades: {
          include: { grades: true, sections: true },
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
