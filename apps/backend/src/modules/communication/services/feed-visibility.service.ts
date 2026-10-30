import { PrismaClient } from '@prisma/client';
import { UserContext } from './feed-validation.service';
import prisma from '../../../lib/prismaClient';

export interface ScopeContext {
  parentGradeIds: string[];
  parentSectionIds: string[];
  teacherGradeIds: string[];
  teacherSectionIds: string[];
}

export class FeedVisibilityService {
  /**
   * Resolves parent's linked students' active enrollment grades and sections.
   */
  public static async getParentAcademicScope(
    prismaClient: PrismaClient | any,
    orgId: string,
    userId: string,
  ): Promise<{ gradeIds: string[]; sectionIds: string[] }> {
    const parent = await prismaClient.parents.findFirst({
      where: { user_id: userId, org_id: orgId },
      select: {
        student_parents: {
          select: {
            student_id: true,
            students: {
              select: {
                student_enrollments: {
                  where: { status: 'active' },
                  select: {
                    academic_year_grade_id: true,
                    section_id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const gradeIds = new Set<string>();
    const sectionIds = new Set<string>();

    if (parent?.student_parents) {
      for (const sp of parent.student_parents) {
        for (const enr of sp.students?.student_enrollments || []) {
          if (enr.academic_year_grade_id) gradeIds.add(enr.academic_year_grade_id);
          if (enr.section_id) sectionIds.add(enr.section_id);
        }
      }
    }

    return {
      gradeIds: Array.from(gradeIds),
      sectionIds: Array.from(sectionIds),
    };
  }

  /**
   * Resolves teacher's assigned grades and sections from staff responsibilities.
   */
  public static async getTeacherAcademicScope(
    prismaClient: PrismaClient | any,
    orgId: string,
    userId: string,
  ): Promise<{ gradeIds: string[]; sectionIds: string[] }> {
    const staff = await prismaClient.staff.findFirst({
      where: { user_id: userId, org_id: orgId },
      select: { staff_id: true },
    });

    if (!staff) {
      return { gradeIds: [], sectionIds: [] };
    }

    const assignedSections = await prismaClient.sections.findMany({
      where: {
        class_teacher_id: staff.staff_id,
        academic_year_grades: { academic_years: { org_id: orgId } },
      },
      select: {
        section_id: true,
        academic_year_grade_id: true,
      },
    });

    const gradeIds = new Set<string>();
    const sectionIds = new Set<string>();

    for (const s of assignedSections) {
      if (s.academic_year_grade_id) gradeIds.add(s.academic_year_grade_id);
      if (s.section_id) sectionIds.add(s.section_id);
    }

    return {
      gradeIds: Array.from(gradeIds),
      sectionIds: Array.from(sectionIds),
    };
  }

  /**
   * Builds the Prisma where clause for feed retrieval based on organization boundaries,
   * user roles, and audience targeting.
   */
  public static async buildWhereClause(
    prismaClient: PrismaClient | any,
    orgId: string,
    userContext: UserContext,
    filters: {
      feedType?: string;
      status?: string;
      academicYearId?: string;
    } = {},
  ) {
    const where: any = {
      org_id: orgId,
    };

    // Status filtering
    if (userContext.isParent || userContext.isStudent) {
      // Parents & students can only ever see published posts
      where.status = 'published';
    } else if (filters.status) {
      if (filters.status === 'draft') {
        // Management sees all drafts; other staff see drafts they authored
        where.status = 'draft';
        if (!userContext.isManagement) {
          where.author_user_id = userContext.userId;
        }
      } else if (filters.status === 'all' && userContext.isManagement) {
        where.status = { not: 'removed' };
      } else {
        where.status = filters.status;
      }
    } else {
      where.status = 'published';
    }

    // Feed type filtering
    if (filters.feedType) {
      where.feed_type = filters.feedType;
    }

    // Academic Year filter on targets
    if (filters.academicYearId) {
      where.OR = [
        {
          feed_post_academic_year_grade_targets: {
            some: {
              academic_year_grades: {
                academic_year_id: filters.academicYearId,
              },
            },
          },
        },
        {
          feed_post_section_targets: {
            some: {
              sections: {
                academic_year_grades: {
                  academic_year_id: filters.academicYearId,
                },
              },
            },
          },
        },
      ];
    }

    // Role-based Audience Scoping
    if (userContext.isManagement) {
      // Institutional oversight: management can view all posts in their organization
      return where;
    }

    if (userContext.isTeacher) {
      const teacherScope = await this.getTeacherAcademicScope(
        prismaClient,
        orgId,
        userContext.userId,
      );

      const teacherOrConditions: any[] = [
        { audience_scope: 'organization' },
        { audience_scope: 'staff_only' },
        { audience_scope: 'all_parents' },
        { author_user_id: userContext.userId },
      ];

      if (teacherScope.gradeIds.length > 0) {
        teacherOrConditions.push({
          audience_scope: 'selected_academic_groups',
          feed_post_academic_year_grade_targets: {
            some: { academic_year_grade_id: { in: teacherScope.gradeIds } },
          },
        });
      }

      if (teacherScope.sectionIds.length > 0) {
        teacherOrConditions.push({
          audience_scope: 'selected_academic_groups',
          feed_post_section_targets: {
            some: { section_id: { in: teacherScope.sectionIds } },
          },
        });
      }

      where.AND = (where.AND || []).concat([{ OR: teacherOrConditions }]);
      return where;
    }

    if (userContext.isStaff) {
      // Non-teacher staff (Finance, Front Office, etc.)
      const staffOrConditions: any[] = [
        { audience_scope: 'organization' },
        { audience_scope: 'staff_only' },
        { audience_scope: 'all_parents' },
        { author_user_id: userContext.userId },
      ];

      where.AND = (where.AND || []).concat([{ OR: staffOrConditions }]);
      return where;
    }

    if (userContext.isParent) {
      const parentScope = await this.getParentAcademicScope(
        prismaClient,
        orgId,
        userContext.userId,
      );

      const parentOrConditions: any[] = [
        {
          feed_type: { not: 'staff_community' },
          audience_scope: 'organization',
        },
        {
          feed_type: { not: 'staff_community' },
          audience_scope: 'all_parents',
        },
      ];

      if (parentScope.gradeIds.length > 0) {
        parentOrConditions.push({
          feed_type: { not: 'staff_community' },
          audience_scope: 'selected_academic_groups',
          feed_post_academic_year_grade_targets: {
            some: { academic_year_grade_id: { in: parentScope.gradeIds } },
          },
        });
      }

      if (parentScope.sectionIds.length > 0) {
        parentOrConditions.push({
          feed_type: { not: 'staff_community' },
          audience_scope: 'selected_academic_groups',
          feed_post_section_targets: {
            some: { section_id: { in: parentScope.sectionIds } },
          },
        });
      }

      where.AND = (where.AND || []).concat([
        {
          // Never expose staff_only audience or staff_community feed type to parents
          audience_scope: { not: 'staff_only' },
          feed_type: { not: 'staff_community' },
        },
        {
          OR: parentOrConditions,
        },
      ]);
      return where;
    }

    // Default unclassified/student view: organization scope only, non-staff
    where.AND = (where.AND || []).concat([
      {
        audience_scope: 'organization',
        feed_type: { not: 'staff_community' },
      },
    ]);

    return where;
  }

  /**
   * Verifies if a single post is visible to the given user.
   */
  public static async canUserViewPost(
    prismaClient: PrismaClient | any,
    orgId: string,
    userId: string,
    userContext: UserContext,
    post: any,
  ): Promise<boolean> {
    if (!post || post.org_id !== orgId) {
      return false;
    }

    // Removed posts are never visible
    if (post.status === 'removed') {
      return false;
    }

    // Draft posts: visible only to author or management
    if (post.status === 'draft') {
      return post.author_user_id === userId || !!userContext.isManagement;
    }

    // Management has full institutional oversight
    if (userContext.isManagement) {
      return true;
    }

    // Author can always view their own post
    if (post.author_user_id === userId) {
      return true;
    }

    // Staff-only audience or staff_community feed
    if (post.audience_scope === 'staff_only' || post.feed_type === 'staff_community') {
      return userContext.isStaff;
    }

    // Organization-wide scope
    if (post.audience_scope === 'organization') {
      return true;
    }

    // All parents scope
    if (post.audience_scope === 'all_parents') {
      return userContext.isParent || userContext.isStaff;
    }

    // Selected academic groups scope
    if (post.audience_scope === 'selected_academic_groups') {
      if (userContext.isTeacher) {
        const teacherScope = await this.getTeacherAcademicScope(prismaClient, orgId, userId);
        const postGradeTargets = (post.feed_post_academic_year_grade_targets || []).map(
          (t: any) => t.academic_year_grade_id,
        );
        const postSectionTargets = (post.feed_post_section_targets || []).map(
          (t: any) => t.section_id,
        );

        const hasMatchingGrade = postGradeTargets.some((id: string) =>
          teacherScope.gradeIds.includes(id),
        );
        const hasMatchingSection = postSectionTargets.some((id: string) =>
          teacherScope.sectionIds.includes(id),
        );

        if (hasMatchingGrade || hasMatchingSection) {
          return true;
        }
      }

      if (userContext.isParent) {
        const parentScope = await this.getParentAcademicScope(prismaClient, orgId, userId);
        const postGradeTargets = (post.feed_post_academic_year_grade_targets || []).map(
          (t: any) => t.academic_year_grade_id,
        );
        const postSectionTargets = (post.feed_post_section_targets || []).map(
          (t: any) => t.section_id,
        );

        const hasMatchingGrade = postGradeTargets.some((id: string) =>
          parentScope.gradeIds.includes(id),
        );
        const hasMatchingSection = postSectionTargets.some((id: string) =>
          parentScope.sectionIds.includes(id),
        );

        return hasMatchingGrade || hasMatchingSection;
      }

      if (userContext.isStaff) {
        return false;
      }
    }

    return false;
  }
}
