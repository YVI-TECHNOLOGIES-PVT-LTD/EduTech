import prisma from '../../../lib/prismaClient';
import { RecordAssessmentDto } from '../dto/request/record-assessment.dto';

export class AdmissionAssessmentRepository {
  /**
   * Resolves a valid staff_id for assessed_by (FK to staff.staff_id)
   * Never sets a user_id as assessed_by.
   */
  private static async resolveStaffId(
    candidateStaffId: string | null | undefined,
    fallbackUserId: string | null | undefined,
  ): Promise<string | null> {
    if (candidateStaffId) {
      const validStaff = await prisma.staff.findUnique({
        where: { staff_id: candidateStaffId },
      });
      if (validStaff) {
        return validStaff.staff_id;
      }
    }

    if (fallbackUserId) {
      const staffByUser = await prisma.staff.findFirst({
        where: { user_id: fallbackUserId },
      });
      if (staffByUser) {
        return staffByUser.staff_id;
      }
    }

    return null;
  }

  static async upsert(applicationId: string, createdBy: string | null, dto: RecordAssessmentDto) {
    const existing = await prisma.application_assessments.findUnique({
      where: { application_id: applicationId },
    });

    const resolvedStaffId = await this.resolveStaffId(dto.assessed_by, createdBy);

    if (existing) {
      return prisma.application_assessments.update({
        where: { application_id: applicationId },
        data: {
          config_id: dto.config_id || undefined,
          assessment_date: dto.assessment_date ? new Date(dto.assessment_date) : undefined,
          maximum_marks: dto.maximum_marks !== undefined ? dto.maximum_marks : undefined,
          marks_obtained: dto.marks_obtained !== undefined ? dto.marks_obtained : undefined,
          percentage: dto.percentage !== undefined ? dto.percentage : undefined,
          result: dto.result || undefined,
          remarks: dto.remarks || undefined,
          assessed_by: resolvedStaffId || undefined,
          updated_by: createdBy || undefined,
          updated_at: new Date(),
        },
        include: {
          assessment_configurations: {
            include: {
              academic_year_grades: {
                include: {
                  grades: true,
                  academic_years: true,
                },
              },
            },
          },
          staff: {
            include: {
              users_staff_user_idTousers: true,
              designations: true,
              departments: true,
            },
          },
        },
      });
    }

    return prisma.application_assessments.create({
      data: {
        application_id: applicationId,
        config_id: dto.config_id || '',
        assessment_date: dto.assessment_date ? new Date(dto.assessment_date) : new Date(),
        maximum_marks: dto.maximum_marks !== undefined ? dto.maximum_marks : undefined,
        marks_obtained: dto.marks_obtained !== undefined ? dto.marks_obtained : undefined,
        percentage: dto.percentage !== undefined ? dto.percentage : undefined,
        result: dto.result || undefined,
        remarks: dto.remarks || undefined,
        assessed_by: resolvedStaffId || undefined,
        created_by: createdBy || undefined,
      },
      include: {
        assessment_configurations: {
          include: {
            academic_year_grades: {
              include: {
                grades: true,
                academic_years: true,
              },
            },
          },
        },
        staff: {
          include: {
            users_staff_user_idTousers: true,
            designations: true,
            departments: true,
          },
        },
      },
    });
  }

  static async findByApplicationId(application_id: string) {
    return prisma.application_assessments.findUnique({
      where: { application_id },
      include: {
        assessment_configurations: {
          include: {
            academic_year_grades: {
              include: {
                grades: true,
                academic_years: true,
              },
            },
          },
        },
        staff: {
          include: {
            users_staff_user_idTousers: true,
            designations: true,
            departments: true,
          },
        },
      },
    });
  }

  static async findAll(params: {
    orgId?: string;
    academicYearId?: string;
    gradeId?: string;
    result?: string;
    searchText?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (params.orgId) {
      where.admissions_applications = {
        org_id: params.orgId,
      };
    }

    if (params.academicYearId) {
      where.admissions_applications = {
        ...where.admissions_applications,
        academic_year_id: params.academicYearId,
      };
    }

    if (params.gradeId) {
      where.assessment_configurations = {
        academic_year_grades: {
          grade_id: params.gradeId,
        },
      };
    }

    if (params.result && params.result !== 'all') {
      where.result = params.result;
    }

    if (params.searchText) {
      where.admissions_applications = {
        ...where.admissions_applications,
        OR: [
          { application_number: { contains: params.searchText, mode: 'insensitive' } },
          {
            leads: {
              OR: [
                { first_name: { contains: params.searchText, mode: 'insensitive' } },
                { last_name: { contains: params.searchText, mode: 'insensitive' } },
                { email: { contains: params.searchText, mode: 'insensitive' } },
                { phone: { contains: params.searchText, mode: 'insensitive' } },
              ],
            },
          },
        ],
      };
    }

    const [total, items] = await Promise.all([
      prisma.application_assessments.count({ where }),
      prisma.application_assessments.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updated_at: 'desc' },
        include: {
          admissions_applications: {
            include: {
              leads: true,
              academic_years: true,
            },
          },
          assessment_configurations: {
            include: {
              academic_year_grades: {
                include: {
                  grades: true,
                },
              },
            },
          },
          staff: {
            include: {
              users_staff_user_idTousers: true,
              designations: true,
              departments: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: items,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async getConfigs(orgId?: string) {
    const where: any = {};
    if (orgId) {
      where.academic_year_grades = {
        academic_years: {
          org_id: orgId,
        },
      };
    }

    return prisma.assessment_configurations.findMany({
      where,
      include: {
        academic_year_grades: {
          include: {
            grades: true,
            academic_years: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  static async upsertConfig(
    academicYearGradeId: string,
    data: {
      assessment_required?: boolean;
      assessment_mode?: any;
      result_type?: any;
      maximum_marks?: number | null;
      pass_marks?: number | null;
      is_active?: boolean;
    },
    userId?: string | null,
  ) {
    const existing = await prisma.assessment_configurations.findUnique({
      where: { academic_year_grade_id: academicYearGradeId },
    });

    if (existing) {
      return prisma.assessment_configurations.update({
        where: { academic_year_grade_id: academicYearGradeId },
        data: {
          assessment_required: data.assessment_required ?? existing.assessment_required,
          assessment_mode: data.assessment_mode ?? existing.assessment_mode,
          result_type: data.result_type ?? existing.result_type,
          maximum_marks:
            data.maximum_marks !== undefined ? data.maximum_marks : existing.maximum_marks,
          pass_marks: data.pass_marks !== undefined ? data.pass_marks : existing.pass_marks,
          is_active: data.is_active !== undefined ? data.is_active : existing.is_active,
          updated_by: userId || undefined,
          updated_at: new Date(),
        },
        include: {
          academic_year_grades: {
            include: {
              grades: true,
              academic_years: true,
            },
          },
        },
      });
    }

    return prisma.assessment_configurations.create({
      data: {
        academic_year_grade_id: academicYearGradeId,
        assessment_required: data.assessment_required ?? true,
        assessment_mode: data.assessment_mode || 'written',
        result_type: data.result_type || 'marks',
        maximum_marks: data.maximum_marks ?? 100,
        pass_marks: data.pass_marks ?? 40,
        is_active: data.is_active ?? true,
        created_by: userId || undefined,
      },
      include: {
        academic_year_grades: {
          include: {
            grades: true,
            academic_years: true,
          },
        },
      },
    });
  }

  static async getAnalytics(orgId?: string) {
    const where: any = {};
    if (orgId) {
      where.admissions_applications = {
        org_id: orgId,
      };
    }

    const [totalAssessed, passed, failed, recommended, notRecommended, configs, assessments] =
      await Promise.all([
        prisma.application_assessments.count({ where }),
        prisma.application_assessments.count({ where: { ...where, result: 'pass' } }),
        prisma.application_assessments.count({ where: { ...where, result: 'fail' } }),
        prisma.application_assessments.count({ where: { ...where, result: 'recommended' } }),
        prisma.application_assessments.count({ where: { ...where, result: 'not_recommended' } }),
        prisma.assessment_configurations.findMany({
          where: orgId ? { academic_year_grades: { academic_years: { org_id: orgId } } } : {},
          include: { academic_year_grades: { include: { grades: true } } },
        }),
        prisma.application_assessments.findMany({
          where,
          select: {
            percentage: true,
            marks_obtained: true,
            maximum_marks: true,
            assessment_configurations: {
              select: { assessment_mode: true },
            },
          },
          take: 1000,
        }),
      ]);

    const validPercentages = assessments
      .map((a) => (a.percentage ? Number(a.percentage) : null))
      .filter((p): p is number => p !== null && !isNaN(p));

    const avgPercentage =
      validPercentages.length > 0
        ? Number(
            (validPercentages.reduce((sum, val) => sum + val, 0) / validPercentages.length).toFixed(
              2,
            ),
          )
        : 0;

    const passRate = totalAssessed > 0 ? Number(((passed / totalAssessed) * 100).toFixed(2)) : 0;

    // Mode distribution
    const modeCounts: Record<string, number> = {};
    assessments.forEach((a) => {
      const mode = a.assessment_configurations?.assessment_mode || 'written';
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;
    });

    return {
      totalAssessed,
      passed,
      failed,
      recommended,
      notRecommended,
      passRate,
      avgPercentage,
      totalConfigs: configs.length,
      modeDistribution: modeCounts,
    };
  }
}
