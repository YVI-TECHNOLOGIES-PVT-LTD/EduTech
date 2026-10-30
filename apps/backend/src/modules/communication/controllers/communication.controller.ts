import { Request, Response } from 'express';
import '../../../auth/auth.middleware';
import { FeedService } from '../services/FeedService';
import { HelpdeskService } from '../services/HelpdeskService';
import { EscalationService } from '../services/EscalationService';
import { concern_status } from '@prisma/client';

export class CommunicationController {
  private static extractOrgId(req: Request): string {
    const orgId =
      (req as any).tenantOrgId ||
      (req as any).context?.user?.org_id ||
      (req as any).context?.user?.school_id;
    if (!orgId) {
      const err: any = new Error('Tenant organization could not be resolved from session');
      err.status = 400;
      err.code = 'TENANT_NOT_FOUND';
      throw err;
    }
    return orgId;
  }

  private static extractUserId(req: Request): string {
    const userId = (req as any).context?.user?.id;
    if (!userId) {
      const err: any = new Error('User identity could not be verified');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }
    return userId;
  }

  public static extractUserContext(req: Request) {
    const userId = (req as any).context?.user?.id || '';
    const roles: string[] = ((req as any).context?.user?.roles || []).map((r: string) =>
      r.toUpperCase().replace(/[\s-]+/g, '_'),
    );
    const isParent =
      roles.includes('PARENT') || roles.includes('GUARDIAN') || roles.includes('ENROLLED_PARENT');
    const isStudent = roles.includes('STUDENT');

    // 1. Management: Administrator, Super Admin, Principal
    const isManagement = roles.some((r: string) =>
      [
        'ADMIN',
        'ADMINISTRATOR',
        'SUPERADMIN',
        'SUPER_ADMIN',
        'ORG_ADMIN',
        'HOI',
        'PRINCIPAL',
        'HEAD_OF_INSTITUTE',
      ].includes(r),
    );

    // 2. Staff Roles: Teacher, Finance, Front Office
    const isTeacher = roles.some((r: string) => ['TEACHER', 'FACULTY'].includes(r));
    const isFinance = roles.some((r: string) =>
      ['FINANCE', 'FINANCE_OFFICER', 'FINANCE_MANAGER', 'ACCOUNTANT', 'BURSAR'].includes(r),
    );
    const isFrontOffice = roles.some((r: string) =>
      [
        'FRONT_OFFICE',
        'FO',
        'RECEPTIONIST',
        'ADMISSION_OFFICER',
        'ADMISSIONS_OFFICER',
        'COUNSELLOR',
        'COUNSELOR',
      ].includes(r),
    );

    const isStaff =
      isManagement || isTeacher || isFinance || isFrontOffice || (!isParent && !isStudent);

    return {
      userId,
      roles,
      isStaff,
      isManagement,
      isTeacher,
      isFinance,
      isFrontOffice,
      isParent,
      isStudent,
    };
  }

  // ==========================================
  // FEEDS & ENGAGEMENT
  // ==========================================

  public static async createPost(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const post = await FeedService.createPost(orgId, userId, userContext, req.body);
      res.status(201).json({ success: true, data: post });
    } catch (error: any) {
      console.error('[CommunicationController.createPost] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'CREATE_POST_FAILED',
        message: error.message || 'Failed to create feed post',
      });
    }
  }

  public static async updateDraft(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const postId = req.params.id || req.params.feedPostId;
      const post = await FeedService.updateDraft(orgId, postId, userId, userContext, req.body);
      res.json({ success: true, data: post });
    } catch (error: any) {
      console.error('[CommunicationController.updateDraft] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'UPDATE_DRAFT_FAILED',
        message: error.message || 'Failed to update draft',
      });
    }
  }

  public static async listPosts(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const {
        feedType,
        feed_type,
        status,
        page,
        limit,
        academicYearId,
        academic_year_id,
        audienceScope,
        audience_scope,
      } = req.query;

      const result = await FeedService.listPosts(orgId, userContext, {
        feedType: (feedType || feed_type) as any,
        feed_type: (feedType || feed_type) as any,
        audienceScope: (audienceScope || audience_scope) as any,
        academicYearId: (academicYearId || academic_year_id) as any,
        status: status as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error('[CommunicationController.listPosts] Error:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.code || 'LIST_POSTS_FAILED',
        message: error.message || 'Failed to retrieve feed posts',
      });
    }
  }

  public static async getPostById(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const postId = req.params.id || req.params.feedPostId;
      const post = await FeedService.getPostById(orgId, postId, userId, userContext);
      res.json({ success: true, data: post });
    } catch (error: any) {
      console.error('[CommunicationController.getPostById] Error:', error);
      res.status(error.status || 404).json({
        success: false,
        error: error.code || 'POST_NOT_FOUND',
        message: error.message || 'Feed post not found',
      });
    }
  }

  public static async publishPost(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const postId = req.params.id || req.params.feedPostId;
      const post = await FeedService.publishPost(orgId, postId, userId, userContext);
      res.json({ success: true, data: post });
    } catch (error: any) {
      console.error('[CommunicationController.publishPost] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'PUBLISH_POST_FAILED',
        message: error.message || 'Failed to publish post',
      });
    }
  }

  public static async removePost(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const postId = req.params.id || req.params.feedPostId;
      const post = await FeedService.removePost(orgId, postId, userId, userContext);
      res.json({ success: true, data: post, message: 'Post removed successfully' });
    } catch (error: any) {
      console.error('[CommunicationController.removePost] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'REMOVE_POST_FAILED',
        message: error.message || 'Failed to remove post',
      });
    }
  }

  public static async addComment(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const postId = req.params.id || req.params.feedPostId;
      const content = req.body.content || req.body.comment;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_COMMENT',
          message: 'Comment text cannot be empty',
        });
      }

      const created = await FeedService.addComment(orgId, postId, userId, userContext, content);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      console.error('[CommunicationController.addComment] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'ADD_COMMENT_FAILED',
        message: error.message || 'Failed to add comment',
      });
    }
  }

  public static async listComments(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const postId = req.params.id || req.params.feedPostId;
      const comments = await FeedService.listComments(orgId, postId, userId, userContext);
      res.json({ success: true, data: comments });
    } catch (error: any) {
      console.error('[CommunicationController.listComments] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'LIST_COMMENTS_FAILED',
        message: error.message || 'Failed to list comments',
      });
    }
  }

  public static async deleteComment(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const commentId = req.params.commentId || req.params.id;
      const moderationReason = req.body?.moderation_reason || req.body?.moderationReason;
      const deleted = await FeedService.deleteComment(
        orgId,
        commentId,
        userId,
        userContext,
        moderationReason,
      );
      res.json({ success: true, data: deleted, message: 'Comment soft deleted successfully' });
    } catch (error: any) {
      console.error('[CommunicationController.deleteComment] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'DELETE_COMMENT_FAILED',
        message: error.message || 'Failed to delete comment',
      });
    }
  }

  public static async getReactionCatalogue(req: Request, res: Response) {
    try {
      const orgId = (req as any).tenantOrgId || (req as any).context?.user?.org_id;
      const userId = (req as any).context?.user?.id;
      const userContext = userId ? CommunicationController.extractUserContext(req) : undefined;
      const postId = req.params.id || req.params.feedPostId;
      const catalog = await FeedService.getReactionCatalogue(orgId, postId, userId, userContext);
      res.json({ success: true, data: catalog });
    } catch (error: any) {
      console.error('[CommunicationController.getReactionCatalogue] Error:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.code || 'CATALOG_FETCH_FAILED',
        message: error.message || 'Failed to fetch reaction catalogue',
      });
    }
  }

  public static async reactToPost(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const postId = req.params.id || req.params.feedPostId;
      const reactionTypeId = req.body.reactionTypeId || req.body.reaction_type_id;

      if (!reactionTypeId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_REACTION_TYPE',
          message: 'reactionTypeId is required',
        });
      }

      const reaction = await FeedService.reactToPost(
        orgId,
        postId,
        userId,
        userContext,
        reactionTypeId,
      );
      res.json({ success: true, data: reaction });
    } catch (error: any) {
      console.error('[CommunicationController.reactToPost] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'REACT_FAILED',
        message: error.message || 'Failed to record reaction',
      });
    }
  }

  public static async removeReaction(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const postId = req.params.id || req.params.feedPostId;
      await FeedService.removeReaction(orgId, postId, userId);
      res.json({ success: true, message: 'Reaction removed successfully' });
    } catch (error: any) {
      console.error('[CommunicationController.removeReaction] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'REMOVE_REACTION_FAILED',
        message: error.message || 'Failed to remove reaction',
      });
    }
  }

  // ==========================================
  // HELPDESK
  // ==========================================

  public static async listCategories(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const onlyActive = req.query.active !== 'false';
      const categories = await HelpdeskService.listCategories(orgId, onlyActive);
      res.json({ success: true, data: categories });
    } catch (error: any) {
      console.error('[CommunicationController.listCategories] Error:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.code || 'LIST_CATEGORIES_FAILED',
        message: error.message || 'Failed to fetch helpdesk categories',
      });
    }
  }

  public static async createCategory(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const { name, description, display_order } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_NAME',
          message: 'Category name is required',
        });
      }

      const category = await HelpdeskService.createCategory(orgId, userId, {
        category_name: name.trim(),
        description,
        display_order: display_order ? Number(display_order) : undefined,
      });
      res.status(201).json({ success: true, data: category });
    } catch (error: any) {
      console.error('[CommunicationController.createCategory] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'CREATE_CATEGORY_FAILED',
        message: error.message || 'Failed to create category',
      });
    }
  }

  public static async createTicket(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const ticket = await HelpdeskService.createTicket(orgId, userId, req.body);
      res.status(201).json({ success: true, data: ticket });
    } catch (error: any) {
      console.error('[CommunicationController.createTicket] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'CREATE_TICKET_FAILED',
        message: error.message || 'Failed to create helpdesk ticket',
      });
    }
  }

  public static async listTickets(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const { category_id, priority, status, page, limit } = req.query;

      const result = await HelpdeskService.listTickets(orgId, userContext, {
        category_id: category_id as string,
        priority: priority as any,
        status: status as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('[CommunicationController.listTickets] Error:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.code || 'LIST_TICKETS_FAILED',
        message: error.message || 'Failed to list tickets',
      });
    }
  }

  public static async getTicketById(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const { id } = req.params;

      const ticket = await HelpdeskService.getTicketById(orgId, id, userContext);
      res.json({ success: true, data: ticket });
    } catch (error: any) {
      console.error('[CommunicationController.getTicketById] Error:', error);
      res.status(error.status || 404).json({
        success: false,
        error: error.code || 'TICKET_NOT_FOUND',
        message: error.message || 'Helpdesk ticket not found',
      });
    }
  }

  public static async updateTicketStatus(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const { id } = req.params;
      const { status, note } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_STATUS',
          message: 'Status is required',
        });
      }

      const updated = await HelpdeskService.updateTicketStatus(
        orgId,
        id,
        userId,
        status as concern_status,
        note,
      );
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('[CommunicationController.updateTicketStatus] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'UPDATE_STATUS_FAILED',
        message: error.message || 'Failed to update ticket status',
      });
    }
  }

  public static async assignTicket(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const { id } = req.params;
      const { assignee_staff_id } = req.body;

      if (!assignee_staff_id) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_ASSIGNEE',
          message: 'assignee_staff_id is required',
        });
      }

      const updated = await HelpdeskService.assignTicket(orgId, id, userId, assignee_staff_id);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('[CommunicationController.assignTicket] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'ASSIGN_TICKET_FAILED',
        message: error.message || 'Failed to assign ticket',
      });
    }
  }

  public static async addMessage(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userContext = CommunicationController.extractUserContext(req);
      const { id } = req.params;

      const message = await HelpdeskService.addMessage(
        orgId,
        id,
        userContext.userId,
        userContext.isStaff,
        req.body,
      );
      res.status(201).json({ success: true, data: message });
    } catch (error: any) {
      console.error('[CommunicationController.addMessage] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'ADD_MESSAGE_FAILED',
        message: error.message || 'Failed to add message',
      });
    }
  }

  // ==========================================
  // ESCALATION
  // ==========================================

  public static async listEscalationRules(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const rules = await EscalationService.listRules(orgId);
      res.json({ success: true, data: rules });
    } catch (error: any) {
      console.error('[CommunicationController.listEscalationRules] Error:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.code || 'LIST_RULES_FAILED',
        message: error.message || 'Failed to list escalation rules',
      });
    }
  }

  public static async createEscalationRule(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const userId = CommunicationController.extractUserId(req);
      const rule = await EscalationService.createRule(orgId, userId, req.body);
      res.status(201).json({ success: true, data: rule });
    } catch (error: any) {
      console.error('[CommunicationController.createEscalationRule] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        error: error.code || 'CREATE_RULE_FAILED',
        message: error.message || 'Failed to create escalation rule',
      });
    }
  }

  public static async evaluateEscalations(req: Request, res: Response) {
    try {
      const orgId = CommunicationController.extractOrgId(req);
      const results = await EscalationService.evaluateEscalations(orgId);
      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error('[CommunicationController.evaluateEscalations] Error:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.code || 'EVALUATE_ESCALATION_FAILED',
        message: error.message || 'Failed to evaluate ticket escalations',
      });
    }
  }
}
