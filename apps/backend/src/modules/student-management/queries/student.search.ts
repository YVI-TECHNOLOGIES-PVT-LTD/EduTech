import prisma from '../../../lib/prismaClient';
import { sanitizeStudentSearchQuery } from '../utils/student-search.helper';
import { SearchStudentDto } from '../dto/request/search-student.dto';

const db: any = prisma;

export class StudentSearchQuery {
  static async execute(params: SearchStudentDto) {
    const q = sanitizeStudentSearchQuery(params);

    const whereClause: any = {};

    if (q.status) {
      whereClause.status = q.status;
    }

    if (q.org_id) {
      whereClause.org_id = q.org_id;
    }

    if (q.academic_year_grade_id || q.section_id) {
      whereClause.student_enrollments = {
        some: {
          ...(q.academic_year_grade_id ? { academic_year_grade_id: q.academic_year_grade_id } : {}),
          ...(q.section_id ? { section_id: q.section_id } : {}),
        },
      };
    }

    if (q.searchText && q.searchText.trim() !== '') {
      const text = q.searchText.trim();
      whereClause.OR = [
        { admission_no: { contains: text, mode: 'insensitive' } },
        { first_name: { contains: text, mode: 'insensitive' } },
        { last_name: { contains: text, mode: 'insensitive' } },
      ];
    }

    const total = await db.students.count({
      where: whereClause,
    });

    const skip = (q.page - 1) * q.pageSize;
    const sortKey = (q.sort as string) === 'student_name' ? 'first_name' : (q.sort as string);

    const items = await db.students.findMany({
      where: whereClause,
      include: {
        student_enrollments: {
          include: { sections: true, academic_year_grades: true },
        },
        student_parents: {
          include: {
            parents: {
              include: { users_parents_user_idTousers: true },
            },
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
