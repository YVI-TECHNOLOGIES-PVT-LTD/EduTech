import prisma from '../../../lib/prismaClient';
import { sanitizeStaffSearchQuery } from '../utils/staff-search.helper';
import { SearchStaffDto } from '../dto/request/search-staff.dto';

const db: any = prisma;

export class StaffSearchQuery {
  static async execute(params: SearchStaffDto) {
    const q = sanitizeStaffSearchQuery(params);

    const whereClause: any = {};
    if (q.org_id) whereClause.org_id = q.org_id;
    if (q.designation_id) whereClause.designation_id = q.designation_id;
    if (q.department_id) whereClause.department_id = q.department_id;
    if (q.is_active !== undefined) whereClause.is_active = q.is_active;

    if (q.searchText && q.searchText.trim() !== '') {
      const text = q.searchText.trim();
      whereClause.OR = [
        { employee_code: { contains: text, mode: 'insensitive' } },
        { users_staff_user_idTousers: { first_name: { contains: text, mode: 'insensitive' } } },
        { users_staff_user_idTousers: { last_name: { contains: text, mode: 'insensitive' } } },
        { users_staff_user_idTousers: { email: { contains: text, mode: 'insensitive' } } },
        { users_staff_user_idTousers: { phone: { contains: text, mode: 'insensitive' } } },
      ];
    }

    const total = await db.staff.count({ where: whereClause });
    const skip = (q.page - 1) * q.pageSize;

    const items = await db.staff.findMany({
      where: whereClause,
      include: {
        users_staff_user_idTousers: true,
        designations: true,
        departments: true,
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
