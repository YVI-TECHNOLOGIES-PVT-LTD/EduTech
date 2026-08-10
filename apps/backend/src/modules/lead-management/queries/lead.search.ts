import prisma from '../../../lib/prismaClient';
import { sanitizeSearchQuery } from '../utils/lead-search.helper';
import { SearchLeadDto } from '../dto/request/search-lead.dto';

const db: any = prisma;

export class LeadSearchQuery {
  static async execute(params: SearchLeadDto, user?: any) {
    const q = sanitizeSearchQuery(params);

    const whereClause: any = {};

    if (user) {
      whereClause.org_id = user.org_id;
      if (user.roles?.includes('PARENT')) {
        const ownerConditions: any[] = [{ created_by: user.id }];
        if (user.phone) ownerConditions.push({ contact_phone: user.phone });
        if (user.email) ownerConditions.push({ contact_email: user.email });

        whereClause.AND = [{ OR: ownerConditions }];
      }
    }

    if (q.stage) {
      whereClause.stage = q.stage;
    }

    if (q.source) {
      whereClause.source = q.source;
    }

    if (q.priority) {
      whereClause.priority = q.priority;
    }

    if (q.assigned_counsellor_id) {
      whereClause.assigned_counsellor_id = q.assigned_counsellor_id;
    }

    if (q.academic_year_grade_id) {
      whereClause.academic_year_grade_id = q.academic_year_grade_id;
    }

    if (q.org_id) {
      whereClause.org_id = q.org_id;
    }

    if (q.startDate || q.endDate) {
      whereClause.created_at = {};
      if (q.startDate) whereClause.created_at.gte = q.startDate;
      if (q.endDate) whereClause.created_at.lte = q.endDate;
    }

    if (q.searchText && q.searchText.trim() !== '') {
      const text = q.searchText.trim();
      whereClause.OR = [
        { student_first_name: { contains: text, mode: 'insensitive' } },
        { student_last_name: { contains: text, mode: 'insensitive' } },
        { contact_name: { contains: text, mode: 'insensitive' } },
        { contact_phone: { contains: text, mode: 'insensitive' } },
        { contact_email: { contains: text, mode: 'insensitive' } },
        { lead_number: { contains: text, mode: 'insensitive' } },
      ];
    }

    const total = await db.leads.count({
      where: whereClause,
    });

    const skip = (q.page - 1) * q.pageSize;

    const sortKey =
      (q.sort as string) === 'student_name'
        ? 'student_first_name'
        : (q.sort as string) === 'status'
          ? 'stage'
          : (q.sort as string);

    const items = await db.leads.findMany({
      where: whereClause,
      include: {
        staff: {
          include: {
            users_staff_user_idTousers: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        academic_year_grades: true,
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
