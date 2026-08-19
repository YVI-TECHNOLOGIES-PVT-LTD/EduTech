import prisma from '../../../lib/prismaClient';
import { sanitizeApplicationSearchQuery } from '../utils/application-search.helper';
import { SearchApplicationDto } from '../dto/request/search-application.dto';

export class AdmissionSearchQuery {
  static async execute(params: SearchApplicationDto) {
    const q = sanitizeApplicationSearchQuery(params);

    const andConditions: any[] = [];

    if (q.status) {
      andConditions.push({ status: q.status });
    }

    if (q.payment_status) {
      if (q.payment_status === 'pending') {
        andConditions.push({
          OR: [
            { admission_fee_payments: null },
            { admission_fee_payments: { payment_status: 'pending' } },
          ],
        });
      } else {
        andConditions.push({
          admission_fee_payments: { payment_status: q.payment_status },
        });
      }
    }

    if (q.payment_mode) {
      andConditions.push({
        admission_fee_payments: { payment_mode: q.payment_mode },
      });
    }

    if (q.academic_year_id) {
      andConditions.push({ academic_year_id: q.academic_year_id });
    }

    if (q.grade_id) {
      andConditions.push({
        leads: {
          academic_year_grades: {
            grade_id: q.grade_id,
          },
        },
      });
    }

    if (q.org_id) {
      andConditions.push({ org_id: q.org_id });
    }

    if (q.created_by) {
      andConditions.push({
        OR: [
          { created_by: q.created_by },
          {
            leads: {
              parents: {
                user_id: q.created_by,
              },
            },
          },
          {
            leads: {
              created_by: q.created_by,
            },
          },
        ],
      });
    }

    if (q.startDate || q.endDate) {
      const dateFilter: any = {};
      if (q.startDate) dateFilter.gte = q.startDate;
      if (q.endDate) dateFilter.lte = q.endDate;
      andConditions.push({ created_at: dateFilter });
    }

    if (q.searchText && q.searchText.trim() !== '') {
      const text = q.searchText.trim();
      andConditions.push({
        OR: [
          { application_number: { contains: text, mode: 'insensitive' } },
          {
            admission_fee_payments: {
              transaction_reference: { contains: text, mode: 'insensitive' },
            },
          },
          {
            leads: {
              OR: [
                { student_first_name: { contains: text, mode: 'insensitive' } },
                { student_last_name: { contains: text, mode: 'insensitive' } },
                { contact_name: { contains: text, mode: 'insensitive' } },
                { contact_phone: { contains: text, mode: 'insensitive' } },
                { contact_email: { contains: text, mode: 'insensitive' } },
                { lead_number: { contains: text, mode: 'insensitive' } },
              ],
            },
          },
        ],
      });
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    const total = await prisma.admissions_applications.count({
      where: whereClause,
    });

    const skip = (q.page - 1) * q.pageSize;

    const items = await prisma.admissions_applications.findMany({
      where: whereClause,
      include: {
        leads: {
          include: {
            academic_year_grades: {
              include: {
                grades: true,
                academic_years: true,
              },
            },
            parents: true,
            staff: {
              include: {
                users_staff_user_idTousers: true,
              },
            },
          },
        },
        academic_years: true,
        admission_documents: {
          include: {
            document_types: true,
          },
        },
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
