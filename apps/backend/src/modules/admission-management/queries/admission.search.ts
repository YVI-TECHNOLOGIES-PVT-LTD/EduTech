import prisma from '../../../lib/prismaClient';
import { sanitizeApplicationSearchQuery } from '../utils/application-search.helper';
import { SearchApplicationDto } from '../dto/request/search-application.dto';

export class AdmissionSearchQuery {
  static async execute(params: SearchApplicationDto) {
    const q = sanitizeApplicationSearchQuery(params);

    const whereClause: any = {};

    if (q.status) {
      whereClause.status = q.status;
    }

    if (q.academic_year_id) {
      whereClause.academic_year_id = q.academic_year_id;
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
        { application_number: { contains: text, mode: 'insensitive' } },
        {
          leads: {
            OR: [
              { student_first_name: { contains: text, mode: 'insensitive' } },
              { student_last_name: { contains: text, mode: 'insensitive' } },
              { contact_name: { contains: text, mode: 'insensitive' } },
              { contact_phone: { contains: text, mode: 'insensitive' } },
              { contact_email: { contains: text, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const total = await prisma.admissions_applications.count({
      where: whereClause,
    });

    const skip = (q.page - 1) * q.pageSize;

    const items = await prisma.admissions_applications.findMany({
      where: whereClause,
      include: {
        leads: true,
        academic_years: true,
        admission_documents: true,
        application_assessments: true,
        admission_decisions: true,
        admission_fee_payments: true,
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
