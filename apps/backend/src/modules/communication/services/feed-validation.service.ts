import { PrismaClient } from '@prisma/client';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from '../dto/feeds.dto';

export interface UserContext {
  userId: string;
  roles?: string[];
  isStaff: boolean;
  isManagement?: boolean;
  isTeacher?: boolean;
  isFinance?: boolean;
  isFrontOffice?: boolean;
  isParent?: boolean;
  isStudent?: boolean;
}

export class FeedValidationService {
  public static validateCreatePayload(dto: CreateAnnouncementDto, userContext: UserContext) {
    const feedType = dto.feedType || dto.feed_type;
    const audienceScope = dto.audienceScope || dto.audience_scope;
    const content = (dto.content || '').trim();
    let title: string | null = null;

    if (dto.title !== undefined && dto.title !== null) {
      const trimmedTitle = dto.title.trim();
      title = trimmedTitle.length > 0 ? trimmedTitle : null;
    }

    if (!feedType) {
      const err: any = new Error('feedType is required');
      err.status = 400;
      err.code = 'INVALID_FEED_TYPE';
      throw err;
    }

    if (!audienceScope) {
      const err: any = new Error('audienceScope is required');
      err.status = 400;
      err.code = 'INVALID_AUDIENCE_SCOPE';
      throw err;
    }

    if (!content) {
      const err: any = new Error('Content cannot be blank');
      err.status = 400;
      err.code = 'INVALID_CONTENT';
      throw err;
    }

    if (title && title.length > 200) {
      const err: any = new Error('Title cannot exceed 200 characters');
      err.status = 400;
      err.code = 'INVALID_TITLE';
      throw err;
    }

    // Role-based post creation authorization
    if (userContext.isParent || userContext.isStudent) {
      const err: any = new Error('Parents and students are not permitted to create announcements');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    if (userContext.isTeacher) {
      if (feedType !== 'classroom') {
        const err: any = new Error('Teachers can only create classroom announcements');
        err.status = 403;
        err.code = 'FORBIDDEN_FEED_TYPE';
        throw err;
      }
    } else if (userContext.isFrontOffice) {
      if (feedType !== 'parent') {
        const err: any = new Error(
          'Front office staff can only create parent-related announcements',
        );
        err.status = 403;
        err.code = 'FORBIDDEN_FEED_TYPE';
        throw err;
      }
    }

    // Valid feed_type + audience_scope combinations enforced by database
    if (feedType === 'classroom' && audienceScope !== 'selected_academic_groups') {
      const err: any = new Error(
        'classroom feed type must use selected_academic_groups audience scope',
      );
      err.status = 400;
      err.code = 'INVALID_AUDIENCE_COMBINATION';
      throw err;
    }

    if (feedType === 'staff_community' && audienceScope !== 'staff_only') {
      const err: any = new Error('staff_community feed type must use staff_only audience scope');
      err.status = 400;
      err.code = 'INVALID_AUDIENCE_COMBINATION';
      throw err;
    }

    if (
      (feedType === 'parent' || feedType === 'student') &&
      !['organization', 'all_parents', 'selected_academic_groups', 'selected_students'].includes(
        audienceScope,
      )
    ) {
      const err: any = new Error(
        `${feedType} feed type must use organization, all_parents, selected_academic_groups, or selected_students audience scope`,
      );
      err.status = 400;
      err.code = 'INVALID_AUDIENCE_COMBINATION';
      throw err;
    }

    const rawGradeIds = dto.academicYearGradeIds || dto.academic_year_grade_ids || [];
    const rawSectionIds = dto.sectionIds || dto.section_ids || [];
    const rawStudentIds =
      dto.studentIds || dto.student_ids || dto.studentTargets?.map((t) => t.studentId) || [];
    const gradeIds = Array.from(new Set(rawGradeIds.filter(Boolean)));
    const sectionIds = Array.from(new Set(rawSectionIds.filter(Boolean)));
    const studentIds = Array.from(new Set(rawStudentIds.filter(Boolean)));

    if (audienceScope !== 'selected_academic_groups' && audienceScope !== 'selected_students') {
      if (gradeIds.length > 0 || sectionIds.length > 0 || studentIds.length > 0) {
        const err: any = new Error(
          'Academic and student targets can only be assigned to posts using targeted audience scopes',
        );
        err.status = 400;
        err.code = 'INVALID_TARGETS';
        throw err;
      }
    }

    const commentsEnabled = dto.commentsEnabled ?? dto.comments_enabled ?? true;
    const reactionsEnabled = dto.reactionsEnabled ?? dto.reactions_enabled ?? true;

    return {
      feedType,
      audienceScope,
      title,
      content,
      commentsEnabled,
      reactionsEnabled,
      gradeIds,
      sectionIds,
      studentIds,
    };
  }

  public static async validateTargetsAgainstOrg(
    prismaClient: PrismaClient | any,
    orgId: string,
    gradeIds: string[],
    sectionIds: string[],
    studentIds: string[] = [],
  ) {
    if (gradeIds.length > 0) {
      const validGrades = await prismaClient.academic_year_grades.findMany({
        where: {
          academic_year_grade_id: { in: gradeIds },
          academic_years: { org_id: orgId },
        },
        select: { academic_year_grade_id: true },
      });

      if (validGrades.length !== gradeIds.length) {
        const err: any = new Error(
          'One or more academic year grade targets do not exist or belong to another organization',
        );
        err.status = 400;
        err.code = 'TARGET_NOT_FOUND';
        throw err;
      }
    }

    if (sectionIds.length > 0) {
      const validSections = await prismaClient.sections.findMany({
        where: {
          section_id: { in: sectionIds },
          academic_year_grades: { academic_years: { org_id: orgId } },
        },
        select: { section_id: true },
      });

      if (validSections.length !== sectionIds.length) {
        const err: any = new Error(
          'One or more section targets do not exist or belong to another organization',
        );
        err.status = 400;
        err.code = 'TARGET_NOT_FOUND';
        throw err;
      }
    }

    if (studentIds.length > 0) {
      const validStudents = await prismaClient.students.findMany({
        where: {
          student_id: { in: studentIds },
          org_id: orgId,
        },
        select: { student_id: true },
      });

      if (validStudents.length !== studentIds.length) {
        const err: any = new Error(
          'One or more student targets do not exist or belong to another organization',
        );
        err.status = 400;
        err.code = 'TARGET_NOT_FOUND';
        throw err;
      }
    }
  }

  public static async validateTeacherAcademicScope(
    prismaClient: PrismaClient | any,
    orgId: string,
    userId: string,
    gradeIds: string[],
    sectionIds: string[],
  ) {
    const staff = await prismaClient.staff.findFirst({
      where: { user_id: userId, org_id: orgId },
      select: { staff_id: true },
    });

    if (!staff) {
      const err: any = new Error('Teacher staff record not found in organization');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const assignedSections = await prismaClient.sections.findMany({
      where: {
        class_teacher_id: staff.staff_id,
        academic_year_grades: { academic_years: { org_id: orgId } },
      },
      select: { section_id: true, academic_year_grade_id: true },
    });

    const allowedSectionIds = new Set<string>(assignedSections.map((s: any) => s.section_id));
    const allowedGradeIds = new Set<string>(
      assignedSections.map((s: any) => s.academic_year_grade_id),
    );

    for (const secId of sectionIds) {
      if (!allowedSectionIds.has(secId)) {
        const err: any = new Error(
          'Teachers can only target sections within their assigned academic scope',
        );
        err.status = 403;
        err.code = 'FORBIDDEN_ACADEMIC_SCOPE';
        throw err;
      }
    }

    for (const grId of gradeIds) {
      if (!allowedGradeIds.has(grId)) {
        const err: any = new Error(
          'Teachers can only target grades within their assigned academic scope',
        );
        err.status = 403;
        err.code = 'FORBIDDEN_ACADEMIC_SCOPE';
        throw err;
      }
    }
  }

  public static validateUpdateDraft(
    post: any,
    userId: string,
    userContext: UserContext,
    dto: UpdateAnnouncementDto,
  ) {
    if (!post) {
      const err: any = new Error('Feed post not found');
      err.status = 404;
      err.code = 'POST_NOT_FOUND';
      throw err;
    }

    if (post.status === 'removed') {
      const err: any = new Error('Removed feed posts cannot be modified');
      err.status = 400;
      err.code = 'POST_REMOVED';
      throw err;
    }

    if (post.status === 'published') {
      const err: any = new Error('A published feed post cannot be updated as a draft');
      err.status = 400;
      err.code = 'POST_ALREADY_PUBLISHED';
      throw err;
    }

    if (post.status !== 'draft') {
      const err: any = new Error('Only draft posts can be modified');
      err.status = 400;
      err.code = 'INVALID_POST_STATUS';
      throw err;
    }

    if (post.author_user_id !== userId && !userContext.isManagement) {
      const err: any = new Error('Only the author or authorized management can update this draft');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    let title: string | null | undefined = undefined;
    if (dto.title !== undefined) {
      if (dto.title === null) {
        title = null;
      } else {
        const trimmed = dto.title.trim();
        title = trimmed.length > 0 ? trimmed : null;
      }
      if (title && title.length > 200) {
        const err: any = new Error('Title cannot exceed 200 characters');
        err.status = 400;
        err.code = 'INVALID_TITLE';
        throw err;
      }
    }

    let content: string | undefined = undefined;
    if (dto.content !== undefined) {
      content = dto.content.trim();
      if (!content) {
        const err: any = new Error('Content cannot be blank');
        err.status = 400;
        err.code = 'INVALID_CONTENT';
        throw err;
      }
    }

    const commentsEnabled = dto.commentsEnabled ?? dto.comments_enabled;
    const reactionsEnabled = dto.reactionsEnabled ?? dto.reactions_enabled;

    const rawGradeIds = dto.academicYearGradeIds || dto.academic_year_grade_ids;
    const rawSectionIds = dto.sectionIds || dto.section_ids;
    const gradeIds = rawGradeIds ? Array.from(new Set(rawGradeIds.filter(Boolean))) : undefined;
    const sectionIds = rawSectionIds
      ? Array.from(new Set(rawSectionIds.filter(Boolean)))
      : undefined;

    return {
      title,
      content,
      commentsEnabled,
      reactionsEnabled,
      gradeIds,
      sectionIds,
    };
  }

  public static validatePublish(
    post: any,
    userId: string,
    userContext: UserContext,
    targetCount: number,
  ) {
    if (!post) {
      const err: any = new Error('Feed post not found');
      err.status = 404;
      err.code = 'POST_NOT_FOUND';
      throw err;
    }

    if (post.status === 'removed') {
      const err: any = new Error('Cannot publish a removed post');
      err.status = 400;
      err.code = 'POST_REMOVED';
      throw err;
    }

    if (post.status === 'published') {
      const err: any = new Error('Post is already published');
      err.status = 400;
      err.code = 'POST_ALREADY_PUBLISHED';
      throw err;
    }

    if (post.status !== 'draft') {
      const err: any = new Error('Only draft posts can be published');
      err.status = 400;
      err.code = 'INVALID_POST_STATUS';
      throw err;
    }

    if (post.author_user_id !== userId && !userContext.isManagement) {
      const err: any = new Error('Only the author or authorized management can publish this post');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    if (post.audience_scope === 'selected_academic_groups' && targetCount < 1) {
      const err: any = new Error(
        'A post with selected academic groups must have at least one grade or section target before publication',
      );
      err.status = 400;
      err.code = 'TARGET_REQUIRED';
      throw err;
    }
  }

  public static validateRemove(post: any, userId: string, userContext: UserContext) {
    if (!post) {
      const err: any = new Error('Feed post not found');
      err.status = 404;
      err.code = 'POST_NOT_FOUND';
      throw err;
    }

    if (post.status === 'removed') {
      const err: any = new Error('Post is already removed');
      err.status = 400;
      err.code = 'POST_ALREADY_REMOVED';
      throw err;
    }

    if (post.author_user_id !== userId && !userContext.isManagement) {
      const err: any = new Error('Only the author or authorized management can remove this post');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }
  }
}
