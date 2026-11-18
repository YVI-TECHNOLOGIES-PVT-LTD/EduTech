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
  FeedAttachmentResponseDto,
  ReorderAttachmentItemDto,
  SoftRemoveAttachmentRequestDto,
} from '../dto/feeds.dto';
import { FeedValidationService, UserContext } from './feed-validation.service';
import { FeedVisibilityService } from './feed-visibility.service';
import { StorageService } from '../../../services/storage.service';
import { detectBufferMimeType } from '../../../middlewares/upload.middleware';
import { v4 as uuidv4 } from 'uuid';

export { CreateAnnouncementDto, UpdateAnnouncementDto, ListFeedsQuery };

export class FeedService {
  /**
   * MIME magic bytes detector wrapper.
   */
  public static detectBufferMimeType(buffer: Buffer): string | null {
    return detectBufferMimeType(buffer);
  }

  /**
   * Validate attachment file size against 10 MB limit.
   */
  public static validateAttachmentFileSize(sizeBytes: number): void {
    const MAX_SIZE = 10 * 1024 * 1024;
    if (sizeBytes > MAX_SIZE) {
      const err: any = new Error('File size exceeds maximum allowed limit of 10 MB');
      err.status = 400;
      err.code = 'FILE_TOO_LARGE';
      throw err;
    }
  }

  /**
   * Validate attachment file signature and constraints.
   */
  public static validateAttachmentFile(fileName: string, buffer: Buffer): string {
    if (!buffer || buffer.length === 0) {
      const err: any = new Error('File content is empty');
      err.status = 400;
      err.code = 'EMPTY_FILE';
      throw err;
    }

    FeedService.validateAttachmentFileSize(buffer.length);

    const detected = detectBufferMimeType(buffer);
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!detected || !ALLOWED.includes(detected)) {
      const err: any = new Error(
        `Corrupted or unsupported file content signature. Allowed image formats: JPEG, PNG, WebP.`,
      );
      err.status = 400;
      err.code = 'INVALID_FILE_TYPE';
      throw err;
    }

    return detected;
  }

  /**
   * Format isolated storage path.
   */
  public static buildAttachmentStoragePath(
    orgId: string,
    feedPostId: string,
    fileName: string,
  ): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
      ? ext === 'jpeg'
        ? 'jpg'
        : ext
      : 'jpg';
    return `organizations/${orgId}/feeds/${feedPostId}/${uuidv4()}.${sanitizedExt}`;
  }

  /**
   * Assert active attachment cap (max 5 active per post).
   */
  public static assertAttachmentLimitNotExceeded(activeCount: number): void {
    if (activeCount >= 5) {
      const err: any = new Error('A feed post can have a maximum of 5 active attachments.');
      err.status = 400;
      err.code = 'ATTACHMENT_LIMIT_EXCEEDED';
      throw err;
    }
  }

  /**
   * Validate reorder payload items.
   */
  public static validateReorderPayload(orderMapping: ReorderAttachmentItemDto[]): void {
    if (!Array.isArray(orderMapping) || orderMapping.length === 0) {
      const err: any = new Error('Invalid or empty reorder payload');
      err.status = 400;
      err.code = 'INVALID_REORDER_PAYLOAD';
      throw err;
    }

    const seenOrders = new Set<number>();
    for (const item of orderMapping) {
      if (!item.displayOrder || item.displayOrder <= 0) {
        const err: any = new Error('Display order must be a positive integer');
        err.status = 400;
        err.code = 'INVALID_DISPLAY_ORDER';
        throw err;
      }
      if (seenOrders.has(item.displayOrder)) {
        const err: any = new Error('Duplicate display order detected in reorder payload');
        err.status = 400;
        err.code = 'DUPLICATE_DISPLAY_ORDER';
        throw err;
      }
      seenOrders.add(item.displayOrder);
    }
  }

  /**
   * Helper to map an attachment database row to a standardized response DTO.
   */
  public static mapAttachmentRowToDto(
    row: any,
    signedUrl?: string,
    signedUrlExpiresAt?: string,
  ): FeedAttachmentResponseDto {
    const uploadedAt =
      row.uploaded_at instanceof Date
        ? row.uploaded_at.toISOString()
        : new Date(row.uploaded_at).toISOString();

    return {
      attachmentId: row.attachment_id,
      attachment_id: row.attachment_id,
      orgId: row.org_id,
      org_id: row.org_id,
      feedPostId: row.feed_post_id,
      feed_post_id: row.feed_post_id,
      fileName: row.file_name,
      file_name: row.file_name,
      storagePath: row.storage_path,
      storage_path: row.storage_path,
      mimeType: row.mime_type,
      mime_type: row.mime_type,
      fileSizeBytes: Number(row.file_size_bytes),
      file_size_bytes: Number(row.file_size_bytes),
      displayOrder: row.display_order,
      display_order: row.display_order,
      caption: row.caption || null,
      uploadedBy: row.uploaded_by,
      uploaded_by: row.uploaded_by,
      uploadedAt,
      uploaded_at: uploadedAt,
      ...(signedUrl ? { signedUrl, signed_url: signedUrl, signedUrlExpiresAt } : {}),
    };
  }

  /**
   * Batch retrieval of active attachments with signed URLs for multiple feed posts.
   */
  private static async getActiveAttachmentsForPostIds(
    orgId: string,
    postIds: string[],
  ): Promise<Map<string, FeedAttachmentResponseDto[]>> {
    const attachmentMap = new Map<string, FeedAttachmentResponseDto[]>();
    if (postIds.length === 0) return attachmentMap;

    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `SELECT * FROM public.feed_post_attachments
         WHERE org_id = $1::uuid AND feed_post_id = ANY($2::uuid[]) AND removed_at IS NULL
         ORDER BY display_order ASC`,
        orgId,
        postIds,
      );

      await Promise.all(
        rows.map(async (row: any) => {
          let signedUrl: string | undefined;
          let signedUrlExpiresAt: string | undefined;
          try {
            const urlResult = await StorageService.getSignedUrl({
              bucket: 'communication-feeds',
              path: row.storage_path,
              expiresInSeconds: 3600,
            });
            signedUrl = urlResult.signedUrl;
            signedUrlExpiresAt = urlResult.expiresAt;
          } catch (storageErr: any) {
            console.warn(
              `[FeedService] Could not generate signed URL for attachment ${row.attachment_id}:`,
              storageErr?.message,
            );
          }

          const dto = FeedService.mapAttachmentRowToDto(row, signedUrl, signedUrlExpiresAt);
          const existing = attachmentMap.get(row.feed_post_id) || [];
          existing.push(dto);
          attachmentMap.set(row.feed_post_id, existing);
        }),
      );
    } catch (err: any) {
      // Graceful fallback if table is not yet migrated to the database
      console.warn(
        '[FeedService] Attachments query bypassed (table may be pending migration):',
        err.message,
      );
    }

    return attachmentMap;
  }

  /**
   * Helper to format a feed post into the standardized API response DTO.
   */
  public static formatPostResponse(
    post: any,
    reactionSummary: ReactionSummaryItem[] = [],
    currentUserReaction: string | null = null,
    commentCount: number = 0,
    attachments: FeedAttachmentResponseDto[] = [],
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

    const studentTargets = (post.feed_post_student_targets || []).map((t: any) => ({
      studentId: t.student_id,
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
      studentTargets: studentTargets,
      reactionSummary,
      currentUserReaction,
      commentCount,
      attachments,
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
        normalized.studentIds,
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

      // Insert post initially as draft so triggers validate targets upon publication
      const post = await tx.feed_posts.create({
        data: {
          org_id: orgId,
          author_user_id: authorUserId,
          feed_type: normalized.feedType,
          audience_scope: normalized.audienceScope,
          title: normalized.title,
          content: normalized.content,
          status: 'draft',
          comments_enabled: normalized.commentsEnabled,
          reactions_enabled: normalized.reactionsEnabled,
          published_at: null,
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

      // Insert student targets
      if (normalized.studentIds && normalized.studentIds.length > 0) {
        await tx.feed_post_student_targets.createMany({
          data: normalized.studentIds.map((studentId) => ({
            org_id: orgId,
            feed_post_id: post.feed_post_id,
            student_id: studentId,
            created_by_user_id: authorUserId,
          })),
          skipDuplicates: true,
        });
      }

      // If requested status was published, transition to published now that targets exist
      if (initialStatus === 'published') {
        await tx.feed_posts.update({
          where: { feed_post_id: post.feed_post_id },
          data: {
            status: 'published',
            published_at: publishedAt,
          },
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
          feed_post_student_targets: true,
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
          feed_post_student_targets: true,
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
          feed_post_student_targets: true,
        },
      });

      const targetCount =
        (existing?.feed_post_academic_year_grade_targets?.length || 0) +
        (existing?.feed_post_section_targets?.length || 0) +
        (existing?.feed_post_student_targets?.length || 0);

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
          feed_post_student_targets: true,
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
        feed_post_student_targets: true,
      },
    });

    // Storage object lifecycle: delete objects from private storage bucket when post is removed
    try {
      const storageRows: any = await prisma.$queryRawUnsafe(
        'SELECT storage_path FROM public.feed_post_attachments WHERE org_id = $1::uuid AND feed_post_id = $2::uuid',
        orgId,
        feedPostId,
      );
      if (storageRows && storageRows.length > 0) {
        await Promise.all(
          storageRows.map(async (row: any) => {
            try {
              await StorageService.deleteFile(row.storage_path, 'communication-feeds');
            } catch (delErr: any) {
              console.warn(
                `[FeedService.removePost] Could not delete storage object ${row.storage_path}:`,
                delErr?.message,
              );
            }
          }),
        );
      }
    } catch (cleanupErr: any) {
      console.warn(
        '[FeedService.removePost] Attachment cleanup query skipped (table may be pending migration):',
        cleanupErr?.message,
      );
    }

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
          feed_post_student_targets: true,
        },
      }),
    ]);

    const postIds = rawPosts.map((p) => p.feed_post_id);
    const [{ reactionSummaryMap, userReactionMap, commentCountMap }, attachmentMap] =
      await Promise.all([
        FeedService.getReactionsAndCommentsMap(postIds, userContext.userId),
        FeedService.getActiveAttachmentsForPostIds(orgId, postIds),
      ]);

    const formattedPosts = rawPosts.map((post) => {
      const summary = reactionSummaryMap.get(post.feed_post_id) || [];
      const userReaction = userReactionMap.get(post.feed_post_id) || null;
      const commentCount = commentCountMap.get(post.feed_post_id) || 0;
      const attachments = attachmentMap.get(post.feed_post_id) || [];
      return FeedService.formatPostResponse(post, summary, userReaction, commentCount, attachments);
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
        feed_post_student_targets: true,
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

    const [{ reactionSummaryMap, userReactionMap, commentCountMap }, attachmentMap] =
      await Promise.all([
        FeedService.getReactionsAndCommentsMap([feedPostId], userId),
        FeedService.getActiveAttachmentsForPostIds(orgId, [feedPostId]),
      ]);

    const summary = reactionSummaryMap.get(feedPostId) || [];
    const userReaction = userReactionMap.get(feedPostId) || null;
    const commentCount = commentCountMap.get(feedPostId) || 0;
    const attachments = attachmentMap.get(feedPostId) || [];

    return FeedService.formatPostResponse(post, summary, userReaction, commentCount, attachments);
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
        feed_post_student_targets: true,
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
        feed_post_student_targets: true,
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
          feed_post_student_targets: true,
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
        feed_post_student_targets: true,
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

  // ==========================================
  // 5. ATTACHMENT MANAGEMENT & LIFECYCLE
  // ==========================================

  /**
   * Upload an image attachment for a feed post.
   * Concurrency-safe: Row lock + 5 active attachments limit.
   * Storage failure cleanup: If DB insertion fails, automatically purges uploaded object from storage.
   */
  public static async uploadAttachment(
    orgId: string,
    feedPostId: string,
    userId: string,
    userContext: UserContext,
    file: Express.Multer.File,
    caption?: string,
  ): Promise<FeedAttachmentResponseDto> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      const err: any = new Error('No file content uploaded');
      err.status = 400;
      err.code = 'NO_FILE_UPLOADED';
      throw err;
    }

    // 1. File size validation (<= 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.buffer.length > MAX_SIZE) {
      const err: any = new Error('File size exceeds maximum allowed limit of 10 MB');
      err.status = 400;
      err.code = 'FILE_TOO_LARGE';
      throw err;
    }

    // 2. MIME type & magic bytes validation
    const declaredMime = (file.mimetype || '').toLowerCase();
    const normalizedDeclared = declaredMime === 'image/jpg' ? 'image/jpeg' : declaredMime;
    const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    if (!ALLOWED_MIMES.includes(normalizedDeclared)) {
      const err: any = new Error(
        `Invalid file type '${file.mimetype}'. Only JPEG, PNG, and WebP images are permitted for feed posts.`,
      );
      err.status = 400;
      err.code = 'INVALID_MIME_TYPE';
      throw err;
    }

    const detectedMime = detectBufferMimeType(file.buffer);
    if (!detectedMime || detectedMime !== normalizedDeclared) {
      const err: any = new Error(
        `File content signature (${detectedMime || 'unknown'}) does not match declared MIME type (${file.mimetype}). File rejected.`,
      );
      err.status = 400;
      err.code = 'CORRUPTED_FILE_CONTENT';
      throw err;
    }

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const ext = extMap[normalizedDeclared] || 'jpg';
    const storagePath = `organizations/${orgId}/feeds/${feedPostId}/${uuidv4()}.${ext}`;

    // 3. Concurrency-safe post lock & 5-image cap enforcement in transaction
    return await prisma.$transaction(async (tx) => {
      // Row-level lock on feed post
      await tx.$queryRawUnsafe(
        'SELECT feed_post_id FROM public.feed_posts WHERE feed_post_id = $1::uuid AND org_id = $2::uuid FOR UPDATE',
        feedPostId,
        orgId,
      );

      const post = await tx.feed_posts.findFirst({
        where: { feed_post_id: feedPostId, org_id: orgId },
      });

      if (!post) {
        const err: any = new Error('Feed post not found');
        err.status = 404;
        err.code = 'POST_NOT_FOUND';
        throw err;
      }

      if (post.status === 'removed') {
        const err: any = new Error('Cannot add attachments to a removed feed post');
        err.status = 400;
        err.code = 'POST_REMOVED';
        throw err;
      }

      // Authorization: author or institutional management
      const isAuthor = post.author_user_id === userId;
      const isManagement = !!userContext.isManagement;
      if (!isAuthor && !isManagement) {
        const err: any = new Error('Only the post author or administrator can add attachments');
        err.status = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }

      // Check current active count
      const countRows: any = await tx.$queryRawUnsafe(
        'SELECT count(*)::int as count FROM public.feed_post_attachments WHERE org_id = $1::uuid AND feed_post_id = $2::uuid AND removed_at IS NULL',
        orgId,
        feedPostId,
      );
      const activeCount = countRows[0]?.count ? Number(countRows[0].count) : 0;
      if (activeCount >= 5) {
        const err: any = new Error('A feed post cannot have more than 5 active image attachments.');
        err.status = 400;
        err.code = 'MAX_ATTACHMENTS_EXCEEDED';
        throw err;
      }

      const maxOrderRows: any = await tx.$queryRawUnsafe(
        'SELECT COALESCE(MAX(display_order), 0)::int as max_order FROM public.feed_post_attachments WHERE org_id = $1::uuid AND feed_post_id = $2::uuid AND removed_at IS NULL',
        orgId,
        feedPostId,
      );
      const nextDisplayOrder = (maxOrderRows[0]?.max_order || 0) + 1;

      // 4. Upload to Supabase Storage
      await StorageService.uploadFile({
        bucket: 'communication-feeds',
        path: storagePath,
        buffer: file.buffer,
        mimeType: normalizedDeclared,
      });

      // 5. Insert attachment record with failure cleanup
      let insertedRow: any;
      try {
        const insertRows: any = await tx.$queryRawUnsafe(
          `INSERT INTO public.feed_post_attachments
            (org_id, feed_post_id, file_name, storage_path, mime_type, file_size_bytes, display_order, caption, uploaded_by)
           VALUES
            ($1::uuid, $2::uuid, $3, $4, $5, $6::bigint, $7::int, $8, $9::uuid)
           RETURNING *`,
          orgId,
          feedPostId,
          file.originalname || `attachment-${nextDisplayOrder}.${ext}`,
          storagePath,
          normalizedDeclared,
          file.buffer.length.toString(),
          nextDisplayOrder,
          caption ? caption.trim().slice(0, 255) : null,
          userId,
        );
        insertedRow = insertRows[0];
      } catch (dbErr: any) {
        // Immediate failure cleanup for orphaned storage objects (Requirement 4)
        console.error(
          '[FeedService] DB insert failed after upload, deleting storage object:',
          storagePath,
          dbErr?.message,
        );
        try {
          await StorageService.deleteFile(storagePath, 'communication-feeds');
        } catch (cleanupErr: any) {
          console.error('[FeedService] Failed deleting orphaned object:', cleanupErr?.message);
        }
        throw dbErr;
      }

      // 6. Generate signed URL for response
      const { signedUrl, expiresAt } = await StorageService.getSignedUrl({
        bucket: 'communication-feeds',
        path: storagePath,
        expiresInSeconds: 3600,
      });

      return FeedService.mapAttachmentRowToDto(insertedRow, signedUrl, expiresAt);
    });
  }

  /**
   * Reorder active attachments for a feed post.
   * Concurrency-safe: Two-phase update prevents partial unique index collisions while
   * strictly honoring the positive integer check constraint (display_order > 0).
   */
  public static async reorderAttachments(
    orgId: string,
    feedPostId: string,
    userId: string,
    userContext: UserContext,
    orderMapping: Array<{ attachmentId: string; displayOrder: number }>,
  ): Promise<FeedAttachmentResponseDto[]> {
    if (!Array.isArray(orderMapping) || orderMapping.length === 0) {
      const err: any = new Error('Invalid reorder request: attachments list must not be empty');
      err.status = 400;
      err.code = 'INVALID_REORDER_PAYLOAD';
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      // Lock post
      await tx.$queryRawUnsafe(
        'SELECT feed_post_id FROM public.feed_posts WHERE feed_post_id = $1::uuid AND org_id = $2::uuid FOR UPDATE',
        feedPostId,
        orgId,
      );

      const post = await tx.feed_posts.findFirst({
        where: { feed_post_id: feedPostId, org_id: orgId },
      });

      if (!post) {
        const err: any = new Error('Feed post not found');
        err.status = 404;
        err.code = 'POST_NOT_FOUND';
        throw err;
      }

      const isAuthor = post.author_user_id === userId;
      const isManagement = !!userContext.isManagement;
      if (!isAuthor && !isManagement) {
        const err: any = new Error('Only the post author or administrator can reorder attachments');
        err.status = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }

      // Fetch existing active attachments
      const existingRows: any = await tx.$queryRawUnsafe(
        `SELECT attachment_id, display_order FROM public.feed_post_attachments
         WHERE org_id = $1::uuid AND feed_post_id = $2::uuid AND removed_at IS NULL
         ORDER BY display_order ASC`,
        orgId,
        feedPostId,
      );

      const existingIds = new Set(existingRows.map((r: any) => r.attachment_id));
      if (orderMapping.length !== existingRows.length) {
        const err: any = new Error(
          'Reorder payload count must match active attachments count exactly',
        );
        err.status = 400;
        err.code = 'REORDER_COUNT_MISMATCH';
        throw err;
      }

      const requestedOrders = new Set<number>();
      for (const item of orderMapping) {
        if (!existingIds.has(item.attachmentId)) {
          const err: any = new Error(
            `Attachment ${item.attachmentId} does not exist on this post or is removed`,
          );
          err.status = 400;
          err.code = 'ATTACHMENT_NOT_FOUND';
          throw err;
        }
        if (!item.displayOrder || item.displayOrder <= 0) {
          const err: any = new Error('Display order must be a positive integer');
          err.status = 400;
          err.code = 'INVALID_DISPLAY_ORDER';
          throw err;
        }
        if (requestedOrders.has(item.displayOrder)) {
          const err: any = new Error('Duplicate display order detected in reorder payload');
          err.status = 400;
          err.code = 'DUPLICATE_DISPLAY_ORDER';
          throw err;
        }
        requestedOrders.add(item.displayOrder);
      }

      // Phase 1: Shift existing display orders by +1000 to avoid partial unique index collisions
      await tx.$queryRawUnsafe(
        `UPDATE public.feed_post_attachments
         SET display_order = display_order + 1000
         WHERE org_id = $1::uuid AND feed_post_id = $2::uuid AND removed_at IS NULL`,
        orgId,
        feedPostId,
      );

      // Phase 2: Set target display orders
      for (const item of orderMapping) {
        await tx.$queryRawUnsafe(
          `UPDATE public.feed_post_attachments
           SET display_order = $1::int
           WHERE attachment_id = $2::uuid AND org_id = $3::uuid AND feed_post_id = $4::uuid AND removed_at IS NULL`,
          item.displayOrder,
          item.attachmentId,
          orgId,
          feedPostId,
        );
      }

      // Return updated attachments with signed URLs
      const updatedRows: any = await tx.$queryRawUnsafe(
        `SELECT * FROM public.feed_post_attachments
         WHERE org_id = $1::uuid AND feed_post_id = $2::uuid AND removed_at IS NULL
         ORDER BY display_order ASC`,
        orgId,
        feedPostId,
      );

      return await Promise.all(
        updatedRows.map(async (row: any) => {
          let signedUrl: string | undefined;
          let signedUrlExpiresAt: string | undefined;
          try {
            const urlResult = await StorageService.getSignedUrl({
              bucket: 'communication-feeds',
              path: row.storage_path,
              expiresInSeconds: 3600,
            });
            signedUrl = urlResult.signedUrl;
            signedUrlExpiresAt = urlResult.expiresAt;
          } catch {}
          return FeedService.mapAttachmentRowToDto(row, signedUrl, signedUrlExpiresAt);
        }),
      );
    });
  }

  /**
   * Soft remove an attachment by setting removed_at, removed_by, and removal_reason.
   * Re-compacts remaining active attachments so display orders remain contiguous (1..k).
   */
  public static async softRemoveAttachment(
    orgId: string,
    feedPostId: string,
    attachmentId: string,
    userId: string,
    userContext: UserContext,
    removalReason?: string,
  ): Promise<{ success: boolean; message: string }> {
    return await prisma.$transaction(async (tx) => {
      // Lock post
      await tx.$queryRawUnsafe(
        'SELECT feed_post_id FROM public.feed_posts WHERE feed_post_id = $1::uuid AND org_id = $2::uuid FOR UPDATE',
        feedPostId,
        orgId,
      );

      const post = await tx.feed_posts.findFirst({
        where: { feed_post_id: feedPostId, org_id: orgId },
      });

      if (!post) {
        const err: any = new Error('Feed post not found');
        err.status = 404;
        err.code = 'POST_NOT_FOUND';
        throw err;
      }

      const isAuthor = post.author_user_id === userId;
      const isManagement = !!userContext.isManagement;
      if (!isAuthor && !isManagement) {
        const err: any = new Error('Only the post author or administrator can remove attachments');
        err.status = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }

      const existingRows: any = await tx.$queryRawUnsafe(
        `SELECT * FROM public.feed_post_attachments
         WHERE attachment_id = $1::uuid AND feed_post_id = $2::uuid AND org_id = $3::uuid AND removed_at IS NULL`,
        attachmentId,
        feedPostId,
        orgId,
      );

      if (existingRows.length === 0) {
        const err: any = new Error('Attachment not found or already removed');
        err.status = 404;
        err.code = 'ATTACHMENT_NOT_FOUND';
        throw err;
      }

      // Mark soft removed
      await tx.$queryRawUnsafe(
        `UPDATE public.feed_post_attachments
         SET removed_at = NOW(), removed_by = $1::uuid, removal_reason = $2
         WHERE attachment_id = $3::uuid AND feed_post_id = $4::uuid AND org_id = $5::uuid`,
        userId,
        removalReason || 'Removed by author',
        attachmentId,
        feedPostId,
        orgId,
      );

      // Re-compact remaining active display orders
      const remainingRows: any = await tx.$queryRawUnsafe(
        `SELECT attachment_id FROM public.feed_post_attachments
         WHERE org_id = $1::uuid AND feed_post_id = $2::uuid AND removed_at IS NULL
         ORDER BY display_order ASC`,
        orgId,
        feedPostId,
      );

      if (remainingRows.length > 0) {
        await tx.$queryRawUnsafe(
          `UPDATE public.feed_post_attachments
           SET display_order = display_order + 1000
           WHERE org_id = $1::uuid AND feed_post_id = $2::uuid AND removed_at IS NULL`,
          orgId,
          feedPostId,
        );

        for (let i = 0; i < remainingRows.length; i++) {
          await tx.$queryRawUnsafe(
            `UPDATE public.feed_post_attachments
             SET display_order = $1::int
             WHERE attachment_id = $2::uuid AND org_id = $3::uuid AND feed_post_id = $4::uuid AND removed_at IS NULL`,
            i + 1,
            remainingRows[i].attachment_id,
            orgId,
            feedPostId,
          );
        }
      }

      return { success: true, message: 'Attachment removed successfully' };
    });
  }

  /**
   * Retrieve active attachments for a single post with audience visibility enforcement.
   */
  public static async listAttachments(
    orgId: string,
    feedPostId: string,
    userId: string,
    userContext: UserContext,
  ): Promise<FeedAttachmentResponseDto[]> {
    const post = await prisma.feed_posts.findFirst({
      where: { feed_post_id: feedPostId, org_id: orgId },
      include: {
        feed_post_academic_year_grade_targets: true,
        feed_post_section_targets: true,
        feed_post_student_targets: true,
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
      const err: any = new Error('You do not have permission to view attachments for this post');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const attachmentMap = await FeedService.getActiveAttachmentsForPostIds(orgId, [feedPostId]);
    return attachmentMap.get(feedPostId) || [];
  }

  /**
   * Reconciles orphaned storage objects for soft-deleted attachments exceeding the retention period (30 days).
   */
  public static async reconcileStorageLifecycle(orgId?: string, retentionDays: number = 30) {
    try {
      const orgFilter = orgId ? 'AND org_id = $2::uuid' : '';
      const params: any[] = [retentionDays];
      if (orgId) params.push(orgId);

      const rows: any = await prisma.$queryRawUnsafe(
        `SELECT attachment_id, storage_path FROM public.feed_post_attachments
         WHERE removed_at IS NOT NULL
           AND removed_at < NOW() - ($1 || ' days')::interval
           ${orgFilter}`,
        ...params,
      );

      let cleanedCount = 0;
      for (const row of rows) {
        try {
          await StorageService.deleteFile(row.storage_path, 'communication-feeds');
          cleanedCount++;
        } catch (e: any) {
          console.warn(
            `[FeedService.reconcileStorageLifecycle] Error deleting ${row.storage_path}:`,
            e.message,
          );
        }
      }

      return { success: true, reclaimedCount: cleanedCount, totalEligible: rows.length };
    } catch (err: any) {
      console.warn('[FeedService.reconcileStorageLifecycle] Skipped:', err.message);
      return { success: false, reclaimedCount: 0, error: err.message };
    }
  }
}
