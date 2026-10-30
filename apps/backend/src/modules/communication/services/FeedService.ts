import prisma from '../../../lib/prismaClient';
import {
  communication_feed_type,
  communication_audience_scope,
  feed_post_status,
} from '@prisma/client';

export interface CreatePostDto {
  feed_type: communication_feed_type;
  audience_scope: communication_audience_scope;
  title?: string;
  content: string;
  status?: feed_post_status;
  comments_enabled?: boolean;
  reactions_enabled?: boolean;
  academic_year_grade_ids?: string[];
  section_ids?: string[];
  student_ids?: string[];
  allowed_reaction_type_ids?: string[];
}

export interface ListPostsQuery {
  feed_type?: communication_feed_type;
  status?: feed_post_status;
  page?: number;
  limit?: number;
}

export class FeedService {
  /**
   * Create a new feed post with audience targeting and allowed reactions.
   */
  public static async createPost(orgId: string, authorUserId: string, dto: CreatePostDto) {
    const status = dto.status || 'draft';
    const publishedAt = status === 'published' ? new Date() : null;

    return await prisma.$transaction(async (tx) => {
      // 1. Create the post
      const post = await tx.feed_posts.create({
        data: {
          org_id: orgId,
          author_user_id: authorUserId,
          feed_type: dto.feed_type,
          audience_scope: dto.audience_scope,
          title: dto.title?.trim() || null,
          content: dto.content.trim(),
          status,
          comments_enabled: dto.comments_enabled ?? true,
          reactions_enabled: dto.reactions_enabled ?? true,
          published_at: publishedAt,
        },
      });

      // 2. Audience Targeting: Grade groups
      if (dto.academic_year_grade_ids && dto.academic_year_grade_ids.length > 0) {
        await tx.feed_post_academic_year_grade_targets.createMany({
          data: dto.academic_year_grade_ids.map((gradeId) => ({
            feed_post_id: post.feed_post_id,
            academic_year_grade_id: gradeId,
            created_by_user_id: authorUserId,
          })),
          skipDuplicates: true,
        });
      }

      // 3. Audience Targeting: Sections
      if (dto.section_ids && dto.section_ids.length > 0) {
        await tx.feed_post_section_targets.createMany({
          data: dto.section_ids.map((sectionId) => ({
            feed_post_id: post.feed_post_id,
            section_id: sectionId,
            created_by_user_id: authorUserId,
          })),
          skipDuplicates: true,
        });
      }

      // 4. Audience Targeting: Individual Students
      if (dto.student_ids && dto.student_ids.length > 0) {
        await tx.feed_post_student_targets.createMany({
          data: dto.student_ids.map((studentId) => ({
            org_id: orgId,
            feed_post_id: post.feed_post_id,
            student_id: studentId,
            created_by_user_id: authorUserId,
          })),
          skipDuplicates: true,
        });
      }

      // 5. Allowed Reactions
      if (dto.allowed_reaction_type_ids && dto.allowed_reaction_type_ids.length > 0) {
        await tx.feed_post_allowed_reactions.createMany({
          data: dto.allowed_reaction_type_ids.map((reactionTypeId) => ({
            feed_post_id: post.feed_post_id,
            reaction_type_id: reactionTypeId,
            is_enabled: true,
            created_by_user_id: authorUserId,
          })),
          skipDuplicates: true,
        });
      } else if (dto.reactions_enabled !== false) {
        // Default: Enable all active reaction types
        const activeReactionTypes = await tx.feed_reaction_types.findMany({
          where: { is_active: true },
          select: { reaction_type_id: true },
        });
        if (activeReactionTypes.length > 0) {
          await tx.feed_post_allowed_reactions.createMany({
            data: activeReactionTypes.map((rt) => ({
              feed_post_id: post.feed_post_id,
              reaction_type_id: rt.reaction_type_id,
              is_enabled: true,
              created_by_user_id: authorUserId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return post;
    });
  }

  /**
   * List posts authorized for the current user and tenant.
   * Handles audience scopes:
   * - organization: visible to all
   * - staff_only: visible only to staff roles
   * - all_parents: visible to parents and staff
   * - selected_academic_groups / selected_students: visible to authorized students and parents
   */
  public static async listPosts(
    orgId: string,
    userContext: {
      userId: string;
      roles: string[];
      isStaff: boolean;
      isParent: boolean;
      isStudent: boolean;
    },
    query: ListPostsQuery = {},
  ) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    // Base filter: org_id and non-removed
    const where: any = {
      org_id: orgId,
      status: query.status || 'published',
    };

    if (query.feed_type) {
      where.feed_type = query.feed_type;
    }

    // Role-based visibility scoping
    if (userContext.isStaff) {
      // Staff can see all posts in the org
    } else if (userContext.isParent) {
      // Find students linked to this parent
      const linkedParents = await prisma.parents.findMany({
        where: { user_id: userContext.userId, org_id: orgId },
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

      const studentIds = new Set<string>();
      const gradeIds = new Set<string>();
      const sectionIds = new Set<string>();

      for (const p of linkedParents) {
        for (const sp of p.student_parents) {
          studentIds.add(sp.student_id);
          for (const enr of sp.students.student_enrollments) {
            if (enr.academic_year_grade_id) gradeIds.add(enr.academic_year_grade_id);
            if (enr.section_id) sectionIds.add(enr.section_id);
          }
        }
      }

      where.AND = [
        {
          OR: [
            { audience_scope: 'organization' },
            { audience_scope: 'all_parents' },
            {
              audience_scope: 'selected_students',
              feed_post_student_targets: {
                some: { student_id: { in: Array.from(studentIds) } },
              },
            },
            {
              audience_scope: 'selected_academic_groups',
              OR: [
                {
                  feed_post_academic_year_grade_targets: {
                    some: { academic_year_grade_id: { in: Array.from(gradeIds) } },
                  },
                },
                {
                  feed_post_section_targets: {
                    some: { section_id: { in: Array.from(sectionIds) } },
                  },
                },
              ],
            },
          ],
        },
      ];
    } else {
      // Generic student/customer view: organization only
      where.audience_scope = 'organization';
    }

    const [total, posts] = await Promise.all([
      prisma.feed_posts.count({ where }),
      prisma.feed_posts.findMany({
        where,
        orderBy: { published_at: 'desc' },
        skip,
        take: limit,
        include: {
          feed_post_academic_year_grade_targets: true,
          feed_post_section_targets: true,
          feed_post_student_targets: true,
          feed_post_allowed_reactions: {
            include: { feed_reaction_types: true },
          },
          _count: {
            select: {
              feed_comments: { where: { deleted_at: null } },
            },
          },
        },
      }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get post detail by ID with audience and reactions summary.
   */
  public static async getPostById(orgId: string, feedPostId: string) {
    const post = await prisma.feed_posts.findFirst({
      where: {
        feed_post_id: feedPostId,
        org_id: orgId,
      },
      include: {
        feed_post_academic_year_grade_targets: true,
        feed_post_section_targets: true,
        feed_post_student_targets: true,
        feed_post_allowed_reactions: {
          include: { feed_reaction_types: true },
        },
        _count: {
          select: {
            feed_comments: { where: { deleted_at: null } },
          },
        },
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    return post;
  }

  /**
   * Publish a draft post.
   */
  public static async publishPost(orgId: string, feedPostId: string, userId: string) {
    const existing = await prisma.feed_posts.findFirst({
      where: { feed_post_id: feedPostId, org_id: orgId },
    });

    if (!existing) {
      throw new Error('Post not found');
    }

    return await prisma.feed_posts.update({
      where: { feed_post_id: feedPostId },
      data: {
        status: 'published',
        published_at: new Date(),
        updated_at: new Date(),
        updated_by_user_id: userId,
      },
    });
  }

  /**
   * Soft delete / remove a post.
   */
  public static async removePost(orgId: string, feedPostId: string, removedByUserId: string) {
    const existing = await prisma.feed_posts.findFirst({
      where: { feed_post_id: feedPostId, org_id: orgId },
    });

    if (!existing) {
      throw new Error('Post not found');
    }

    return await prisma.feed_posts.update({
      where: { feed_post_id: feedPostId },
      data: {
        status: 'removed',
        removed_at: new Date(),
        removed_by_user_id: removedByUserId,
        updated_at: new Date(),
        updated_by_user_id: removedByUserId,
      },
    });
  }

  // ─── COMMENTS ─────────────────────────────────────────────────────────────

  /**
   * Add a flat comment to a post.
   */
  public static async addComment(
    orgId: string,
    feedPostId: string,
    authorUserId: string,
    content: string,
  ) {
    const post = await prisma.feed_posts.findFirst({
      where: { feed_post_id: feedPostId, org_id: orgId },
    });

    if (!post) {
      throw new Error('Post not found');
    }
    if (post.status !== 'published') {
      throw new Error('Cannot comment on an unpublished post');
    }
    if (!post.comments_enabled) {
      throw new Error('Comments are disabled for this post');
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new Error('Comment content cannot be empty');
    }

    return await prisma.feed_comments.create({
      data: {
        feed_post_id: feedPostId,
        author_user_id: authorUserId,
        content: trimmedContent,
      },
    });
  }

  /**
   * List active (non-soft-deleted) comments on a post.
   */
  public static async listComments(feedPostId: string) {
    return await prisma.feed_comments.findMany({
      where: {
        feed_post_id: feedPostId,
        deleted_at: null,
      },
      orderBy: { created_at: 'asc' },
      include: {
        users_feed_comments_author_user_idTousers: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete a comment.
   */
  public static async deleteComment(
    commentId: string,
    deletedByUserId: string,
    moderationReason?: string,
  ) {
    const existing = await prisma.feed_comments.findUnique({
      where: { feed_comment_id: commentId },
    });

    if (!existing) {
      throw new Error('Comment not found');
    }

    return await prisma.feed_comments.update({
      where: { feed_comment_id: commentId },
      data: {
        deleted_at: new Date(),
        deleted_by_user_id: deletedByUserId,
        moderation_reason: moderationReason?.trim() || null,
      },
    });
  }

  // ─── REACTIONS ────────────────────────────────────────────────────────────

  /**
   * Master reaction catalogue.
   */
  public static async getReactionCatalogue() {
    return await prisma.feed_reaction_types.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    });
  }

  /**
   * Add or update user reaction on a post.
   */
  public static async reactToPost(
    orgId: string,
    feedPostId: string,
    userId: string,
    reactionTypeId: string,
  ) {
    const post = await prisma.feed_posts.findFirst({
      where: { feed_post_id: feedPostId, org_id: orgId },
    });

    if (!post) {
      throw new Error('Post not found');
    }
    if (post.status !== 'published') {
      throw new Error('Cannot react to an unpublished post');
    }
    if (!post.reactions_enabled) {
      throw new Error('Reactions are disabled for this post');
    }

    // Verify reaction type is allowed for this post
    const allowed = await prisma.feed_post_allowed_reactions.findUnique({
      where: {
        feed_post_id_reaction_type_id: {
          feed_post_id: feedPostId,
          reaction_type_id: reactionTypeId,
        },
      },
    });

    if (!allowed || !allowed.is_enabled) {
      throw new Error('This reaction type is not enabled for this post');
    }

    // Upsert user's reaction (unique constraint on feed_post_id + user_id)
    return await prisma.feed_post_reactions.upsert({
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
  }

  /**
   * Remove a user reaction from a post.
   */
  public static async removeReaction(feedPostId: string, userId: string) {
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
