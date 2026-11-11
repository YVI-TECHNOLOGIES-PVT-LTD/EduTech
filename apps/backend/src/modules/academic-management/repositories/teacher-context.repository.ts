import prisma from '../../../lib/prismaClient';

export interface AssignedSectionDto {
  section_id: string;
  section_name: string;
  room_no?: string | null;
  capacity?: number | null;
  grade_id: string;
  grade_name: string;
  grade_code: string;
  academic_year_id: string;
  academic_year_name: string;
  assignment_role: 'primary' | 'co_teacher' | 'class_teacher';
  subjects: Array<{
    academic_year_grade_subject_id: string;
    subject_id: string;
    subject_name: string;
    subject_code: string;
  }>;
}

export interface AssignedSubjectDto {
  academic_year_grade_subject_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  grade_name: string;
  grade_code: string;
  academic_year_id: string;
  academic_year_name: string;
  sections: Array<{
    section_id: string;
    section_name: string;
    assignment_role: string;
  }>;
}

export class TeacherContextRepository {
  /**
   * Find staff profile by user_id within an organization
   */
  static async findStaffByUserId(orgId: string, userId: string) {
    return prisma.staff.findFirst({
      where: {
        org_id: orgId,
        user_id: userId,
        is_active: true,
      },
      include: {
        users_staff_user_idTousers: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        designations: {
          select: {
            designation_id: true,
            designation_name: true,
          },
        },
      },
    });
  }

  /**
   * Find staff profile by staff_id within an organization
   */
  static async findStaffById(orgId: string, staffId: string) {
    return prisma.staff.findFirst({
      where: {
        org_id: orgId,
        staff_id: staffId,
        is_active: true,
      },
      include: {
        users_staff_user_idTousers: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        designations: {
          select: {
            designation_id: true,
            designation_name: true,
          },
        },
      },
    });
  }

  /**
   * Get sections assigned to teacher via faculty assignments and class teacher designation
   */
  static async getAssignedSections(
    orgId: string,
    staffId: string,
    academicYearId?: string,
  ): Promise<AssignedSectionDto[]> {
    // 1. Fetch section_subject_faculty_assignments
    const facultyAssignments = await prisma.section_subject_faculty_assignments.findMany({
      where: {
        staff_id: staffId,
        is_active: true,
        sections: {
          academic_year_grades: {
            academic_years: { org_id: orgId },
            ...(academicYearId ? { academic_year_id: academicYearId } : {}),
          },
        },
      },
      include: {
        sections: {
          include: {
            academic_year_grades: {
              include: {
                grades: true,
                academic_years: true,
              },
            },
          },
        },
        academic_year_grade_subjects: {
          include: {
            subjects: true,
          },
        },
      },
    });

    // 2. Fetch sections where staff is designated as class teacher
    const classTeacherSections = await prisma.sections.findMany({
      where: {
        class_teacher_id: staffId,
        is_active: true,
        academic_year_grades: {
          academic_years: { org_id: orgId },
          ...(academicYearId ? { academic_year_id: academicYearId } : {}),
        },
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

    // Aggregate into a distinct map keyed by section_id
    const sectionMap = new Map<string, AssignedSectionDto>();

    for (const fa of facultyAssignments) {
      const sec = fa.sections;
      const ayg = sec?.academic_year_grades;
      const grade = ayg?.grades;
      const ay = ayg?.academic_years;

      if (!sec) continue;

      if (!sectionMap.has(sec.section_id)) {
        sectionMap.set(sec.section_id, {
          section_id: sec.section_id,
          section_name: sec.section_name,
          room_no: sec.room_no,
          capacity: sec.capacity,
          grade_id: grade?.grade_id || '',
          grade_name: grade?.grade_name || '',
          grade_code: grade?.grade_code || '',
          academic_year_id: ay?.academic_year_id || '',
          academic_year_name: ay?.academic_year_name || '',
          assignment_role: fa.assignment_role as any,
          subjects: [],
        });
      }

      const entry = sectionMap.get(sec.section_id)!;
      if (
        fa.academic_year_grade_subjects?.subjects &&
        !entry.subjects.some(
          (s) => s.academic_year_grade_subject_id === fa.academic_year_grade_subject_id,
        )
      ) {
        entry.subjects.push({
          academic_year_grade_subject_id: fa.academic_year_grade_subject_id,
          subject_id: fa.academic_year_grade_subjects.subjects.subject_id,
          subject_name: fa.academic_year_grade_subjects.subjects.subject_name,
          subject_code: fa.academic_year_grade_subjects.subjects.subject_code,
        });
      }
    }

    // Add class teacher sections
    for (const sec of classTeacherSections) {
      const ayg = sec.academic_year_grades;
      const grade = ayg?.grades;
      const ay = ayg?.academic_years;

      if (!sectionMap.has(sec.section_id)) {
        sectionMap.set(sec.section_id, {
          section_id: sec.section_id,
          section_name: sec.section_name,
          room_no: sec.room_no,
          capacity: sec.capacity,
          grade_id: grade?.grade_id || '',
          grade_name: grade?.grade_name || '',
          grade_code: grade?.grade_code || '',
          academic_year_id: ay?.academic_year_id || '',
          academic_year_name: ay?.academic_year_name || '',
          assignment_role: 'class_teacher',
          subjects: [],
        });
      } else {
        const existing = sectionMap.get(sec.section_id)!;
        existing.assignment_role = 'class_teacher';
      }
    }

    return Array.from(sectionMap.values()).sort(
      (a, b) =>
        a.grade_name.localeCompare(b.grade_name) || a.section_name.localeCompare(b.section_name),
    );
  }

  /**
   * Get subjects assigned to teacher across sections
   */
  static async getAssignedSubjects(
    orgId: string,
    staffId: string,
    academicYearId?: string,
  ): Promise<AssignedSubjectDto[]> {
    const facultyAssignments = await prisma.section_subject_faculty_assignments.findMany({
      where: {
        staff_id: staffId,
        is_active: true,
        sections: {
          academic_year_grades: {
            academic_years: { org_id: orgId },
            ...(academicYearId ? { academic_year_id: academicYearId } : {}),
          },
        },
      },
      include: {
        sections: true,
        academic_year_grade_subjects: {
          include: {
            subjects: true,
            academic_year_grades: {
              include: {
                grades: true,
                academic_years: true,
              },
            },
          },
        },
      },
    });

    const subjectMap = new Map<string, AssignedSubjectDto>();

    for (const fa of facultyAssignments) {
      const aygs = fa.academic_year_grade_subjects;
      const sub = aygs?.subjects;
      const ayg = aygs?.academic_year_grades;
      const grade = ayg?.grades;
      const ay = ayg?.academic_years;

      if (!sub || !aygs) continue;

      const key = `${sub.subject_id}_${aygs.academic_year_grade_subject_id}`;
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          academic_year_grade_subject_id: aygs.academic_year_grade_subject_id,
          subject_id: sub.subject_id,
          subject_name: sub.subject_name,
          subject_code: sub.subject_code,
          grade_name: grade?.grade_name || '',
          grade_code: grade?.grade_code || '',
          academic_year_id: ay?.academic_year_id || '',
          academic_year_name: ay?.academic_year_name || '',
          sections: [],
        });
      }

      const entry = subjectMap.get(key)!;
      if (fa.sections && !entry.sections.some((s) => s.section_id === fa.sections.section_id)) {
        entry.sections.push({
          section_id: fa.sections.section_id,
          section_name: fa.sections.section_name,
          assignment_role: fa.assignment_role,
        });
      }
    }

    return Array.from(subjectMap.values()).sort(
      (a, b) =>
        a.subject_name.localeCompare(b.subject_name) || a.grade_name.localeCompare(b.grade_name),
    );
  }

  /**
   * Get curriculum plans for subjects assigned to this teacher
   */
  static async getAssignedCurriculum(orgId: string, staffId: string, academicYearId?: string) {
    const assignments = await prisma.section_subject_faculty_assignments.findMany({
      where: {
        staff_id: staffId,
        is_active: true,
        sections: {
          academic_year_grades: {
            academic_years: { org_id: orgId },
            ...(academicYearId ? { academic_year_id: academicYearId } : {}),
          },
        },
      },
      select: {
        academic_year_grade_subject_id: true,
      },
    });

    const aygsIds = Array.from(new Set(assignments.map((a) => a.academic_year_grade_subject_id)));
    if (aygsIds.length === 0) {
      return [];
    }

    return prisma.curriculum_plans.findMany({
      where: {
        org_id: orgId,
        academic_year_grade_subject_id: { in: aygsIds },
        status: 'published',
      },
      include: {
        academic_year_grade_subjects: {
          include: {
            subjects: true,
            academic_year_grades: {
              include: {
                grades: true,
                academic_years: true,
              },
            },
          },
        },
        curriculum_plan_units: {
          include: {
            curriculum_learning_outcomes: true,
            lesson_plans: {
              where: {
                teacher_staff_id: staffId,
                is_active: true,
              },
              select: {
                lesson_plan_id: true,
                lesson_title: true,
                sequence_number: true,
                planned_date: true,
                duration_minutes: true,
              },
            },
          },
          orderBy: { sequence_number: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get lesson plans authored strictly by this teacher
   */
  static async getTeacherLessonPlans(orgId: string, staffId: string, academicYearId?: string) {
    return prisma.lesson_plans.findMany({
      where: {
        teacher_staff_id: staffId,
        is_active: true,
        curriculum_plan_units: {
          curriculum_plans: {
            org_id: orgId,
            ...(academicYearId
              ? {
                  academic_year_grade_subjects: {
                    academic_year_grades: { academic_year_id: academicYearId },
                  },
                }
              : {}),
          },
        },
      },
      include: {
        curriculum_plan_units: {
          include: {
            curriculum_plans: {
              include: {
                academic_year_grade_subjects: {
                  include: {
                    subjects: true,
                    academic_year_grades: {
                      include: {
                        grades: true,
                        academic_years: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        lesson_activities: true,
        lesson_exit_tickets: true,
        lesson_differentiation_strategies: true,
      },
      orderBy: [{ planned_date: 'desc' }, { sequence_number: 'asc' }],
    });
  }

  /**
   * Get teacher timetable schedule
   */
  static async getTeacherSchedule(
    orgId: string,
    staffId: string,
    weekday?: number,
    academicYearId?: string,
  ) {
    return prisma.timetable_entries.findMany({
      where: {
        section_subject_faculty_assignments: {
          staff_id: staffId,
          sections: {
            academic_year_grades: {
              academic_years: { org_id: orgId },
            },
          },
        },
        ...(weekday !== undefined ? { weekday } : {}),
        ...(academicYearId
          ? {
              sections: {
                academic_year_grades: { academic_year_id: academicYearId },
              },
            }
          : {}),
        timetable_versions: {
          status: 'published',
        },
      },
      include: {
        sections: {
          include: {
            academic_year_grades: {
              include: {
                grades: true,
              },
            },
          },
        },
        academic_year_grade_subjects: {
          include: {
            subjects: true,
          },
        },
        bell_schedule_periods: true,
        classrooms: true,
        timetable_versions: true,
      },
      orderBy: [{ weekday: 'asc' }, { bell_schedule_periods: { period_number: 'asc' } }],
    });
  }

  /**
   * Get teacher workload summary
   */
  static async getTeacherWorkload(orgId: string, staffId: string, academicYearId?: string) {
    const entries = await this.getTeacherSchedule(orgId, staffId, undefined, academicYearId);
    const sections = await this.getAssignedSections(orgId, staffId, academicYearId);
    const subjects = await this.getAssignedSubjects(orgId, staffId, academicYearId);

    // Group entries by weekday
    const weekdayDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
    };

    let totalTeachingPeriods = 0;
    for (const e of entries) {
      if (
        e.bell_schedule_periods &&
        e.bell_schedule_periods.period_type !== 'break' &&
        e.bell_schedule_periods.period_type !== 'lunch'
      ) {
        totalTeachingPeriods++;
        if (weekdayDistribution[e.weekday] !== undefined) {
          weekdayDistribution[e.weekday]++;
        }
      }
    }

    return {
      total_weekly_periods: totalTeachingPeriods,
      total_assigned_sections: sections.length,
      total_assigned_subjects: subjects.length,
      weekday_distribution: weekdayDistribution,
      daily_average_periods:
        totalTeachingPeriods > 0 ? Number((totalTeachingPeriods / 5).toFixed(1)) : 0,
    };
  }
}
