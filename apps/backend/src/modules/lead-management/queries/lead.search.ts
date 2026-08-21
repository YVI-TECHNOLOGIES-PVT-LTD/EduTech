import prisma from '../../../lib/prismaClient';
import { sanitizeSearchQuery } from '../utils/lead-search.helper';
import { SearchLeadDto } from '../dto/request/search-lead.dto';

const db: any = prisma;

export class LeadSearchQuery {
  static async execute(params: SearchLeadDto) {
    const q = sanitizeSearchQuery(params);

    const whereClause: any = {};

    if (q.stage) {
      whereClause.stage = q.stage;
    }

    if (q.source) {
      whereClause.source = q.source;
    }

    if (q.priority) {
      whereClause.priority = q.priority;
    }

    if (
      (q as any).unassigned === true ||
      (q as any).counsellor_status === 'unassigned' ||
      q.assigned_counsellor_id === 'unassigned'
    ) {
      whereClause.assigned_counsellor_id = null;
    } else if ((q as any).counsellor_status === 'assigned') {
      whereClause.assigned_counsellor_id = { not: null };
    } else if (q.assigned_counsellor_id) {
      whereClause.assigned_counsellor_id = q.assigned_counsellor_id;
    }

    if ((q as any).followup_status && (q as any).followup_status !== 'all') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      if ((q as any).followup_status === 'overdue') {
        whereClause.lead_activities = {
          some: {
            next_followup_date: { lt: todayStart },
            status: 'scheduled',
          },
        };
      } else if ((q as any).followup_status === 'today') {
        whereClause.lead_activities = {
          some: {
            next_followup_date: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        };
      } else if ((q as any).followup_status === 'upcoming') {
        whereClause.lead_activities = {
          some: {
            next_followup_date: { gt: todayEnd },
            status: 'scheduled',
          },
        };
      } else if ((q as any).followup_status === 'none') {
        whereClause.lead_activities = {
          none: {
            next_followup_date: { not: null },
            status: 'scheduled',
          },
        };
      }
    }

    if (q.academic_year_grade_id) {
      whereClause.academic_year_grade_id = q.academic_year_grade_id;
    }

    if (q.academic_year_id || q.grade_id) {
      whereClause.academic_year_grades = {};
      if (q.academic_year_id) {
        whereClause.academic_year_grades.academic_year_id = q.academic_year_id;
      }
      if (q.grade_id) {
        whereClause.academic_year_grades.grade_id = q.grade_id;
      }
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
        academic_year_grades: {
          include: {
            grades: true,
            academic_years: true,
          },
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
