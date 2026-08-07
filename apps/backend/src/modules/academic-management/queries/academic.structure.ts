import prisma from '../../../lib/prismaClient';
import { AcademicMapper } from '../mappers/academic.mapper';

const db: any = prisma;

export class AcademicStructureQuery {
  static async getFullStructure(academicYearId: string) {
    const year = await db.academic_years.findUnique({
      where: { academic_year_id: academicYearId },
      include: {
        academic_year_grades: {
          include: {
            grades: true,
            sections: {
              include: {
                staff: {
                  include: { users_staff_user_idTousers: true },
                },
              },
            },
          },
          orderBy: { grades: { display_order: 'asc' } },
        },
      },
    });

    if (!year) return null;

    return {
      academic_year: AcademicMapper.toAcademicYearResponseDto(year),
      grades: (year.academic_year_grades || []).map(AcademicMapper.toAcademicYearGradeResponseDto),
    };
  }
}
