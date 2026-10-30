import prisma from '../../../lib/prismaClient';
import {
  communication_feed_type,
  communication_audience_scope,
  feed_post_status,
} from '@prisma/client';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  ListFeedsQuery,
  FeedPostResponseDto,
  ReactionSummaryItem,
} from '../dto/feeds.dto';
import { FeedValidationService, UserContext } from './feed-validation.service';
import { FeedVisibilityService } from './feed-visibility.service';

export { CreateAnnouncementDto, UpdateAnnouncementDto, ListFeedsQuery };

export class FeedService {
  /**
   * Helper to format a feed post into the standardized API response DTO.
   */
  public static formatPostResponse(
    post: any,
    reactionSummary: ReactionSummaryItem[] = [],
    currentUserReaction: string | null = null,
    commentCount: number = 0,
  ): FeedPostResponseDto {
    const author = post.users_feed_posts_org_id_author_user_idTousers || {};
    const authorName = [author.first_name, author.last_name].filter(Boolean).join(' ') || 'Unknown';

    const gradeTargets = (post.feed_post_academic_year_grade_targets || []).map((t: any) => ({
      academicYearGradeId: t.academic_year_grade_id,
      gradeName: t.academic_year_grades?.grades?.grade_name,
    }));

    const sectionTargets = (post.feed_post_section_targets || []).map((t: any) => ({
      sectionId: t.section_id,
      sectionName: t.sections?.section_name,
    }));

    return {
      feedPostId: post.feed_post_id,
      feed_post_id: post.feed_post_id,
      orgId: post.org_id,
      org_id: post.org_id,
      feedType: post.feed_type,
      feed_type: post.feed_type,
      audienceScope: post.audience_scope,
      audience_scope: post.audience_scope,
      title: post.title,
      content: post.content,
      status: post.status,
      author: {
        userId: post.author_user_id,
        name: authorName,
        email: author.email,
      },
      publishedAt: post.published_at ? post.published_at.toISOString() : null,
      published_at: post.published_at ? post.published_at.toISOString() : null,
      createdAt: post.created_at ? post.created_at.toISOString() : new Date().toISOString(),
      created_at: post.created_at ? post.created_at.toISOString() : new Date().toISOString(),
      commentsEnabled: post.comments_enabled,
      comments_enabled: post.comments_enabled,
      reactionsEnabled: post.reactions_enabled,
      reactions_enabled: post.reactions_enabled,
      academicYearGradeTargets: gradeTargets,
      sectionTargets: sectionTargets,
      reactionSummary,
      currentUserReaction,
      commentCount,
    };
  }

  /**
   * Helper to calculate reaction summaries and user reactions for a list of post IDs.
   */
  private static async getReactionsAndCommentsMap(postIds: string[], currentUserId?: string) {
    if (postIds.length === 0) {
      return {
        reactionSummaryMap: new Map<string, ReactionSummaryItem[]>(),
        userReactionMap: new Map<string, string>(),
        commentCountMap: new Map<string, number>(),
      };
    }

    const [activeReactionTypes, groupedReactions, userReactions, groupedComments] =
      await Promise.all([
        prisma.feed_reaction_types.findMany({
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        }),
        prisma.feed_post_reactions.groupBy({
          by: ['feed_post_id', 'reaction_type_id'],
          where: { feed_post_id: { in: postIds } },
          _count: { reaction_type_id: true },
        }),
        currentUserId
          ? prisma.feed_post_reactions.findMany({
              where: {
                feed_post_id: { in: postIds },
                user_id: currentUserId,
              },
            })
          : Promise.resolve([]),
        prisma.feed_comments.groupBy({
          by: ['feed_post_id'],
          where: {
            feed_post_id: { in: postIds },
            deleted_at: null,
          },
          _count: { feed_comment_id: true },
        }),
      ]);

    const reactionTypeMap = new Map<string, any>(
      activeReactionTypes.map((rt) => [rt.reaction_type_id, rt]),
    );

    const reactionSummaryMap = new Map<string, ReactionSummaryItem[]>();
    for (const item of groupedReactions) {
      const rt = reactionTypeMap.get(item.reaction_type_id);
      if (!rt) continue;
      const list = reactionSummaryMap.get(item.feed_post_id) || [];
      list.push({
        reactionTypeId: rt.reaction_type_id,
        reactionCode: rt.reaction_code,
        reactionLabel: rt.reaction_label,
        emoji: rt.emoji,
        count: item._count.reaction_type_id,
      });
      reactionSummaryMap.set(item.feed_post_id, list);
    }

    const userReactionMap = new Map<string, string>();
    for (const ur of userReactions) {
      userReactionMap.set(ur.feed_post_id, ur.reaction_type_id);
    }

    const commentCountMap = new Map<string, number>();
    for (const gc of groupedComments) {
      commentCountMap.set(gc.feed_post_id, gc._count.feed_comment_id);
    }

    return { reactionSummaryMap, userReactionMap, commentCountMap };
  }

  // ==========================================
  // 1. ANNOUNCEMENT MANAGEMENT
  // ==========================================

  /**
   * Create a new announcement (draft by default) in a single transaction.
   */
  public static async createPost(
    orgId: string,
    authorUserId: string,
    userContext: UserContext,
    dto: CreateAnnouncementDto,
  ) {
    // 1. Verify author is active in organization
    const authorUser = await prisma.users.findFirst({
      where: { user_id: authorUserId, org_id: orgId },
    });
    if (!authorUser || authorUser.status !== 'active') {
      const err: any = new Error('Feed post author must be an active user in the organization');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // 2. Validate payload and role permissions
    const normalized = FeedValidationService.validateCreatePayload(dto, userContext);
    const initialStatus: feed_post_status = dto.status || 'draft';
    const publishedAt = initialStatus === 'published' ? new Date() : null;

    // 3. Execute in single database transaction
    return await prisma.$transaction(async (tx) => {
      // Validate targets belong to organization
      await FeedValidationService.validateTargetsAgainstOrg(
        tx,
        orgId,
        normalized.gradeIds,
        normalized.sectionIds,
      );

      // Validate teacher academic scope
      if (userContext.isTeacher) {
        await FeedValidationService.validateTeacherAcademicScope(
          tx,
          orgId,
          authorUserId,
          normalized.gradeIds,
          normalized.sectionIds,
        );
      }

      // Insert post
      const post = await tx.feed_posts.create({
        data: {
          org_id: orgId,
          author_user_id: authorUserId,
          feed_type: normalized.feedType,
          audience_scope: normalized.audienceScope,
          title: normalized.title,
          content: normalized.content,
          status: initialStatus,
          comments_enabled: normalized.commentsEnabled,
          reactions_enabled: normalized.reactionsEnabled,
          published_at: publishedAt,
        },
      });

      // Insert grade targets
      if (normalized.gradeIds.length > 0) {
        await tx.feed_post_academic_year_grade_targets.createMany({
          data: normalized.gradeIds.map((gradeId) => ({
            feed_post_id: post.feed_post_id,
            academic_year_grade_id: gradeId,
            created_by_user_id: authorUserId,
          })),
          skipDuplicates: true,
        });
      }

      // Insert section targets
      if (normalized.sectionIds.length > 0) {
        await tx.feed_post_section_targets.createMany({
          data: normalized.sectionIds.map((sectionId) => ({
            feed_post_id: post.feed_post_id,
            section_id: sectionId,
            created_by_user_id: authorUserId,
          })),
          skipDuplicates: true,
        });
      }

      // Note: The database trigger initialize_feed_post_reactions automatically populates
      // feed_post_allowed_reactions if reactions_enabled is true.

      const completePost = await tx.feed_posts.findUnique({
        where: { feed_post_id: post.feed_post_id },
        include: {
          users_feed_posts_org_id_author_user_idTousers: {
            select: { user_id: true, first_name: true, last_name: true, email: true },
          },
          feed_post_academic_year_grade_targets: {
            include: { academic_year_grades: { include: { grades: true } } },
          },
          feed_post_section_targets: {
            include: { sections: true },
          },
        },
      });

      return FeedService.formatPostResponse(completePost, [], null, 0);
    });
  }

  /**
   * Update an existing draft and its audience targets within a single transaction.
   */
  public static async updateDraft(
    orgId: string,
    feedPostId: string,
    userId: string,
    userContext: UserContext,
    dto: UpdateAnnouncementDto,
  ) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.feed_posts.findFirst({
        where: { feed_post_id: feedPostId, org_id: orgId },
      });

      if (!existing) {
        const err: any = new Error('Feed post not found');
        err.status = 404;
        err.code = 'POST_NOT_FOUND';
        throw err;
      }

      const validated = FeedValidationService.validateUpdateDraft(
        existing,
        userId,
        userContext,
        dto,
      );

      // Handle targets replacement if provided
      if (validated.gradeIds !== undefined || validated.sectionIds !== undefined) {
        if (existing.audience_scope !== 'selected_academic_groups') {
          if (
            (validated.gradeIds && validated.gradeIds.length > 0) ||
            (validated.sectionIds && validated.sectionIds.length > 0)
          ) {
            const err: any = new Error(
              'Academic targets can only be assigned to posts using selected_academic_groups audience scope',
            );
            err.status = 400;
            err.code = 'INVALID_TARGETS';
            throw err;
          }
        }

        const newGradeIds = validated.gradeIds || [];
        const newSectionIds = validated.sectionIds || [];

        await FeedValidationService.validateTargetsAgainstOrg(
          tx,
          orgId,
          newGradeIds,
          newSectionIds,
        );

        if (userContext.isTeacher) {
          await FeedValidationService.validateTeacherAcademicScope(
            tx,
            orgId,
            userId,
            newGradeIds,
            newSectionIds,
          );
        }

        // Replace targets
        await tx.feed_post_academic_year_grade_targets.deleteMany({
          where: { feed_post_id: feedPostId },
        });
        await tx.feed_post_section_targets.deleteMany({
          where: { feed_post_id: feedPostId },
        });

        if (newGradeIds.length > 0) {
          await tx.feed_post_academic_year_grade_targets.createMany({
            data: newGradeIds.map((gradeId) => ({
              feed_post_id: feedPostId,
              academic_year_grade_id: gradeId,
              created_by_user_id: userId,
            })),
            skipDuplicates: true,
          });
        }

        if (newSectionIds.length > 0) {
          await tx.feed_post_section_targets.createMany({
            data: newSectionIds.map((sectionId) => ({
              feed_post_id: feedPostId,
              section_id: sectionId,
              created_by_user_id: userId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Build post update data
      const updateData: any = {
        updated_at: new Date(),
        updated_by_user_id: userId,
      };

      if (validated.title !== undefined) updateData.title = validated.title;
      if (validated.content !== undefined) updateData.content = validated.content;
      if (validated.commentsEnabled !== undefined)
        updateData.comments_enabled = validated.commentsEnabled;
      if (validated.reactionsEnabled !== undefined)
        updateData.reactions_enabled = validated.reactionsEnabled;

      await tx.feed_posts.update({
        where: { feed_post_id: feedPostId },
        data: updateData,
      });

      const updated = await tx.feed_posts.findUnique({
        where: { feed_post_id: feedPostId },
        include: {
          users_feed_posts_org_id_author_user_idTousers: {
            select: { user_id: true, first_name: true, last_name: true, email: true },
          },
          feed_post_academic_year_grade_targets: {
            include: { academic_year_grades: { include: { grades: true } } },
          },
          feed_post_section_targets: {
            include: { sections: true },
          },
        },
      });

      return FeedService.formatPostResponse(updated, [], null, 0);
    });
  }

  /**
   * Publish a draft announcement within a single transaction.
   */
  public static async publishPost(
    orgId: string,
    feedPostId: string,
    userId: string,
    userContext: UserContext,
  ) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.feed_posts.findFirst({
        where: { feed_post_id: feedPostId, org_id: orgId },
        include: {
          feed_post_academic_year_grade_targets: true,
          feed_post_section_targets: true,
        },
      });

      const targetCount =
        (existing?.feed_post_academic_year_grade_targets?.length || 0) +
        (existing?.feed_post_section_targets?.length || 0);

      FeedValidationService.validatePublish(existing, userId, userContext, targetCount);

      const published = await tx.feed_posts.update({
        where: { feed_post_id: feedPostId },
        data: {
          status: 'published',
          published_at: new Date(),
          updated_at: new Date(),
          updated_by_user_id: userId,
        },
        include: {
          users_feed_posts_org_id_author_user_idTousers: {
            select: { user_id: true, first_name: true, last_name: true, email: true },
          },
          feed_post_academic_year_grade_targets: {
            include: { academic_year_grades: { include: { grades: true } } },
          },
          feed_post_section_targets: {
            include: { sections: true },
          },
        },
      });

      return FeedService.formatPostResponse(published, [], null, 0);
    });
  }

  /**
   * Soft-remove a post without deleting records.
   */
  public static async removePost(
    orgId: string,
    feedPostId: string,
    userId: string,
    userContext: UserContext,
  ) {
    const existing = await prisma.feed_posts.findFirst({
      where: { feed_post_id: feedPostId, org_id: orgId },
    });

    FeedValidationService.validateRemove(existing, userId, userContext);

    const removed = await prisma.feed_posts.update({
      where: { feed_post_id: feedPostId },
      data: {
        status: 'removed',
        removed_at: new Date(),
        removed_by_user_id: userId,
        updated_at: new Date(),
        updated_by_user_id: userId,
      },
      include: {
        users_feed_posts_org_id_author_user_idTousers: {
          select: { user_id: true, first_name: true, last_name: true, email: true },
        },
        feed_post_academic_year_grade_targets: {
          include: { academic_year_grades: { include: { grades: true } } },
        },
        feed_post_section_targets: {
          include: { sections: true },
        },
      },
    });

    return FeedService.formatPostResponse(removed, [], null, 0);
  }

  // ==========================================
  // 2. FEED RETRIEVAL & AUDIENCE VISIBILITY
  // ==========================================

  /**
   * Retrieve visible feed posts for authenticated user with audience scoping,
   * reaction summaries, and comment counts.
   */
  public static async listPosts(
    orgId: string,
    userContext: UserContext,
    query: ListFeedsQuery = {},
  ) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const feedType = query.feedType || query.feed_type;
    const academicYearId = query.academicYearId || query.academic_year_id;
    const status = query.status;

    // Construct audience-scoped where condition
    const where = await FeedVisibilityService.buildWhereClause(prisma, orgId, userContext, {
      feedType,
      status: status as any,
      academicYearId,
    });

    const [total, rawPosts] = await Promise.all([
      prisma.feed_posts.count({ where }),
      prisma.feed_posts.findMany({
        where,
        orderBy: [{ published_at: 'desc' }, { created_at: 'desc' }],
        skip,
        take: limit,
        include: {
          users_feed_posts_org_id_author_user_idTousers: {
            select: { user_id: true, first_name: true, last_name: true, email: true },
          },
          feed_post_academic_year_grade_targets: {
            include: { academic_year_grades: { include: { grades: true } } },
          },
          feed_post_section_targets: {
            include: { sections: true },
          },
        },
      }),
    ]);

    const postIds = rawPosts.map((p) => p.feed_post_id);
    const { reactionSummaryMap, userReactionMap, commentCountMap } =
      await FeedService.getReactionsAndCommentsMap(postIds, userContext.userId);

    const formattedPosts = rawPosts.map((post) => {
      const summary = reactionSummaryMap.get(post.feed_post_id) || [];
      const userReaction = userReactionMap.get(post.feed_post_id) || null;
      const commentCount = commentCountMap.get(post.feed_post_id) || 0;
      return FeedService.formatPostResponse(post, summary, userReaction, commentCount);
    });

    return {
      success: true,
      data: formattedPosts,
      posts: formattedPosts, // For test and backward compatibility
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve a single announcement by ID with audience visibility check.
   */
  public static async getPostById(
    orgId: string,
    feedPostId: string,
    userId: string,
    userContext: UserContext,
  ) {
    const post = await prisma.feed_posts.findFirst({
      where: {
        feed_post_id: feedPostId,
        org_id: orgId,
      },
      include: {
        users_feed_posts_org_id_author_user_idTousers: {
          select: { user_id: true, first_name: true, last_name: true, email: true },
        },
        feed_post_academic_year_grade_targets: {
          include: { academic_year_grades: { include: { grades: true } } },
        },
        feed_post_section_targets: {
          include: { sections: true },
        },
      },
    });

    if (!post) {
      const err: any = new Error('Feed post not found');
      err.status = 404;
      err.code = 'POST_NOT_FOUND';
      throw err;
    }

    const canView = await FeedVisibilityService.canUserViewPost(
      prisma,
      orgId,
      userId,
      userContext,
      post,
    );

    if (!canView) {
      const err: any = new Error('You do not have permission to view this announcement');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const { reactionSummaryMap, userReactionMap, commentCountMap } =
      await FeedService.getReactionsAndCommentsMap([feedPostId], userId);

    const summary = reactionSummaryMap.get(feedPostId) || [];
    const userReaction = userReactionMap.get(feedPostId) || null;
    const commentCount = commentCountMap.get(feedPostId) || 0;

    return FeedService.formatPostResponse(post, summary, userReaction, commentCount);
  }

  // ==========================================
  // 3. COMMENTS
  // ==========================================

  /**
   * Add a flat comment to a published announcement.
   */
  public static async addComment(
    orgId: string,
    feedPostId: string,
    authorUserId: string,
    userContext: UserContext,
    content: string,
  ) {
    const trimmed = (content || '').trim();
    if (!trimmed) {
      const err: any = new Error('Comment content cannot be empty');
      err.status = 400;
      err.code = 'INVALID_COMMENT';
      throw err;
    }

    // Verify user is active in organization
    const user = await prisma.users.findFirst({
      where: { user_id: authorUserId, org_id: orgId },
    });
    if (!user || user.status !== 'active') {
      const err: any = new Error('Comment author must be an active user in the organization');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const post = await prisma.feed_posts.findFirst({
      where: { feed_post_id: feedPostId, org_id: orgId },
      include: {
        feed_post_academic_year_grade_targets: true,
        feed_post_section_targets: true,
      },
    });

    if (!post) {
      const err: any = new Error('Feed post not found');
      err.status = 404;
      err.code = 'POST_NOT_FOUND';
      throw err;
    }

    if (post.status !== 'published') {
      const err: any = new Error('Comments are allowed only on published posts');
      err.status = 400;
      err.code = 'POST_NOT_PUBLISHED';
      throw err;
    }

    if (!post.comments_enabled) {
      const err: any = new Error('Comments are disabled for this post');
      err.status = 400;
      err.code = 'COMMENTS_DISABLED';
      throw err;
    }

    const canView = await FeedVisibilityService.canUserViewPost(
      prisma,
      orgId,
      authorUserId,
      userContext,
      post,
    );

    if (!canView) {
      const err: any = new Error('You do not have permission to comment on this announcement');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const comment = await prisma.feed_comments.create({
      data: {
        feed_post_id: feedPostId,
        author_user_id: authorUserId,
        content: trimmed,
      },
      include: {
        users_feed_comments_author_user_idTousers: {
          select: { user_id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    const author = comment.users_feed_comments_author_user_idTousers;
    return {
      commentId: comment.feed_comment_id,
      feed_comment_id: comment.feed_comment_id,
      feedPostId: comment.feed_post_id,
      content: comment.content,
      createdAt: comment.created_at.toISOString(),
      author: {
        userId: comment.author_user_id,
        name: [author?.first_name, author?.last_name].filter(Boolean).join(' ') || 'Unknown',
        email: author?.email,
      },
    };
  }

  /**
   * List active (non-deleted) comments for an announcement in chronological order.
   */
  public static async listComments(
    orgId: string,
    feedPostId: string,
    userId: string,
    userContext: UserContext,
  ) {
    const post = await prisma.feed_posts.findFirst({
      where: { feed_post_id: feedPostId, org_id: orgId },
      include: {
        feed_post_academic_year_grade_targets: true,
        feed_post_section_targets: true,
      },
    });

    if (!post) {
      const err: any = new Error('Feed post not found');
      err.status = 404;
      err.code = 'POST_NOT_FOUND';
      throw err;
    }

    const canView = await FeedVisibilityService.canUserViewPost(
      prisma,
      orgId,
      userId,
      userContext,
      post,
    );

    if (!canView) {
      const err: any = new Error('You do not have permission to view comments for this post');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const comments = await prisma.feed_comments.findMany({
      where: {
        feed_post_id: feedPostId,
        deleted_at: null,
      },
      orderBy: { created_at: 'asc' },
      include: {
        users_feed_comments_author_user_idTousers: {
          select: { user_id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    return comments.map((c) => {
      const author = c.users_feed_comments_author_user_idTousers;
      return {
        commentId: c.feed_comment_id,
        feed_comment_id: c.feed_comment_id,
        feedPostId: c.feed_post_id,
        content: c.content,
        createdAt: c.created_at.toISOString(),
        author: {
          userId: c.author_user_id,
          name: [author?.first_name, author?.last_name].filter(Boolean).join(' ') || 'Unknown',
          email: author?.email,
        },
      };
    });
  }

  /**
   * Soft-delete a comment. Can be executed by the author or an authorized staff moderator.
   */
  public static async deleteComment(
    orgId: string,
    commentId: string,
    userId: string,
    userContext: UserContext,
    moderationReason?: string,
  ) {
    const comment = await prisma.feed_comments.findUnique({
      where: { feed_comment_id: commentId },
      include: { feed_posts: { select: { org_id: true } } },
    });

    if (!comment || comment.feed_posts?.org_id !== orgId) {
      const err: any = new Error('Comment not found');
      err.status = 404;
      err.code = 'COMMENT_NOT_FOUND';
      throw err;
    }

    if (comment.deleted_at !== null) {
      const err: any = new Error('A deleted comment cannot be modified again');
      err.status = 400;
      err.code = 'COMMENT_ALREADY_DELETED';
      throw err;
    }

    const isAuthor = comment.author_user_id === userId;
    const isModerator = userContext.isStaff;

    if (!isAuthor && !isModerator) {
      const err: any = new Error(
        'Only the comment author or an authorized staff moderator can delete this comment',
      );
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const updated = await prisma.feed_comments.update({
      where: { feed_comment_id: commentId },
      data: {
        deleted_at: new Date(),
        deleted_by_user_id: userId,
        moderation_reason:
          moderationReason?.trim() || (isAuthor ? 'Author deleted' : 'Staff moderation'),
      },
    });

    return {
      commentId: updated.feed_comment_id,
      feed_comment_id: updated.feed_comment_id,
      deletedAt: updated.deleted_at?.toISOString(),
      deleted_at: updated.deleted_at?.toISOString(),
      moderationReason: updated.moderation_reason,
    };
  }

  // ==========================================
  // 4. REACTIONS
  // ==========================================

  /**
   * Retrieve active reaction types enabled for a post.
   */
  public static async getReactionCatalogue(
    orgId?: string,
    feedPostId?: string,
    userId?: string,
    userContext?: UserContext,
  ) {
    if (feedPostId && orgId) {
      const post = await prisma.feed_posts.findFirst({
        where: { feed_post_id: feedPostId, org_id: orgId },
        include: {
          feed_post_academic_year_grade_targets: true,
          feed_post_section_targets: true,
        },
      });

      if (!post) {
        const err: any = new Error('Feed post not found');
        err.status = 404;
        err.code = 'POST_NOT_FOUND';
        throw err;
      }

      if (userContext && userId) {
        const canView = await FeedVisibilityService.canUserViewPost(
          prisma,
          orgId,
          userId,
          userContext,
          post,
        );
        if (!canView) {
          const err: any = new Error('You do not have permission to view this announcement');
          err.status = 403;
          err.code = 'FORBIDDEN';
          throw err;
        }
      }

      if (!post.reactions_enabled) {
        return [];
      }

      const allowedReactions = await prisma.feed_post_allowed_reactions.findMany({
        where: {
          feed_post_id: feedPostId,
          is_enabled: true,
          feed_reaction_types: { is_active: true },
        },
        include: { feed_reaction_types: true },
        orderBy: { feed_reaction_types: { display_order: 'asc' } },
      });

      return allowedReactions.map((ar) => ({
        reactionTypeId: ar.feed_reaction_types.reaction_type_id,
        reaction_type_id: ar.feed_reaction_types.reaction_type_id,
        reactionCode: ar.feed_reaction_types.reaction_code,
        reaction_code: ar.feed_reaction_types.reaction_code,
        reactionLabel: ar.feed_reaction_types.reaction_label,
        reaction_label: ar.feed_reaction_types.reaction_label,
        emoji: ar.feed_reaction_types.emoji,
        displayOrder: ar.feed_reaction_types.display_order,
      }));
    }

    // Default global catalogue
    const allActive = await prisma.feed_reaction_types.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    });

    return allActive.map((rt) => ({
      reactionTypeId: rt.reaction_type_id,
      reaction_type_id: rt.reaction_type_id,
      reactionCode: rt.reaction_code,
      reaction_code: rt.reaction_code,
      reactionLabel: rt.reaction_label,
      reaction_label: rt.reaction_label,
      emoji: rt.emoji,
      displayOrder: rt.display_order,
    }));
  }

  /**
   * Add or change a user's reaction on a published announcement.
   */
  public static async reactToPost(
    orgId: string,
    feedPostId: string,
    userId: string,
    userContext: UserContext,
    reactionTypeId: string,
  ) {
    if (!reactionTypeId) {
      const err: any = new Error('reactionTypeId is required');
      err.status = 400;
      err.code = 'MISSING_REACTION_TYPE';
      throw err;
    }

    const post = await prisma.feed_posts.findFirst({
      where: { feed_post_id: feedPostId, org_id: orgId },
      include: {
        feed_post_academic_year_grade_targets: true,
        feed_post_section_targets: true,
      },
    });

    if (!post) {
      const err: any = new Error('Feed post not found');
      err.status = 404;
      err.code = 'POST_NOT_FOUND';
      throw err;
    }

    if (post.status !== 'published') {
      const err: any = new Error('Reactions are allowed only on published posts');
      err.status = 400;
      err.code = 'POST_NOT_PUBLISHED';
      throw err;
    }

    if (!post.reactions_enabled) {
      const err: any = new Error('Reactions are disabled for this post');
      err.status = 400;
      err.code = 'REACTIONS_DISABLED';
      throw err;
    }

    const canView = await FeedVisibilityService.canUserViewPost(
      prisma,
      orgId,
      userId,
      userContext,
      post,
    );

    if (!canView) {
      const err: any = new Error('You do not have permission to react to this announcement');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // Verify reaction type is enabled and active for this post
    const allowed = await prisma.feed_post_allowed_reactions.findFirst({
      where: {
        feed_post_id: feedPostId,
        reaction_type_id: reactionTypeId,
        is_enabled: true,
        feed_reaction_types: { is_active: true },
      },
    });

    if (!allowed) {
      const err: any = new Error('This reaction type is not enabled for this post');
      err.status = 400;
      err.code = 'REACTION_NOT_ALLOWED';
      throw err;
    }

    // Upsert reaction on UNIQUE(feed_post_id, user_id)
    const reaction = await prisma.feed_post_reactions.upsert({
      where: {
        feed_post_id_user_id: {
          feed_post_id: feedPostId,
          user_id: userId,
        },
      },
      create: {
        feed_post_id: feedPostId,
        user_id: userId,
        reaction_type_id: reactionTypeId,
      },
      update: {
        reaction_type_id: reactionTypeId,
        updated_at: new Date(),
      },
    });

    return {
      feedPostId: reaction.feed_post_id,
      feed_post_id: reaction.feed_post_id,
      reactionTypeId: reaction.reaction_type_id,
      reaction_type_id: reaction.reaction_type_id,
      userId: reaction.user_id,
      user_id: reaction.user_id,
      updatedAt: reaction.updated_at.toISOString(),
    };
  }

  /**
   * Remove user reaction from a post.
   */
  public static async removeReaction(orgId: string, feedPostId: string, userId: string) {
    const existing = await prisma.feed_post_reactions.findUnique({
      where: {
        feed_post_id_user_id: {
          feed_post_id: feedPostId,
          user_id: userId,
        },
      },
    });

    if (!existing) {
      return { success: true };
    }

    await prisma.feed_post_reactions.delete({
      where: {
        feed_post_id_user_id: {
          feed_post_id: feedPostId,
          user_id: userId,
        },
      },
    });

    return { success: true };
  }
}
