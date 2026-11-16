import { Request, Response, NextFunction } from 'express';
import { ChatbotOrchestratorService } from '../services/chatbot.orchestrator.service';
import { ChatbotSessionRepository } from '../repositories/chatbot.session.repository';
import { createSessionSchema } from '../dto/request/chatbot-session.dto';
import { sendMessageSchema } from '../dto/request/send-message.dto';
import { completeSessionSchema } from '../dto/request/complete-session.dto';
import { ChatbotError } from '../errors/chatbot.errors';

export class ChatbotController {
  /**
   * Resolves the verified tenant org_id from authentication or tenant middleware.
   * Never accepts unverified client-supplied body.org_id.
   */
  private static getTenantOrgId(req: Request): string {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req as any).context?.org_id ||
      (req as any).context?.school_id;

    if (!tenantOrgId) {
      throw new ChatbotError(
        'Tenant organization context could not be resolved.',
        400,
        'TENANT_RESOLUTION_REQUIRED',
      );
    }

    return tenantOrgId;
  }

  /**
   * POST /v1/chatbot/session
   * Creates a new chatbot session for the resolved tenant.
   */
  static async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantOrgId = ChatbotController.getTenantOrgId(req);
      const userId = req.context?.user?.id || null;

      const parsed = createSessionSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid session payload',
          details: parsed.error.format(),
        });
      }

      const result = await ChatbotOrchestratorService.createSession(
        tenantOrgId,
        parsed.data,
        userId,
      );
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error instanceof ChatbotError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  /**
   * POST /v1/chatbot/message
   * Handles an incoming user message, retrieves RAG context, generates grounded answer,
   * extracts lead details, and persists conversation.
   */
  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantOrgId = ChatbotController.getTenantOrgId(req);

      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid message payload',
          details: parsed.error.format(),
        });
      }

      const result = await ChatbotOrchestratorService.processMessage(tenantOrgId, parsed.data);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error instanceof ChatbotError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  /**
   * GET /v1/chatbot/session/:sessionId
   * Retrieves an active session and its metadata, enforcing tenant isolation.
   */
  static async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantOrgId = ChatbotController.getTenantOrgId(req);
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Parameter sessionId is required',
        });
      }

      const result = await ChatbotOrchestratorService.getSession(sessionId, tenantOrgId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error instanceof ChatbotError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  /**
   * POST /v1/chatbot/session/:sessionId/complete
   * Concludes an active session with optional satisfaction rating and summary.
   */
  static async completeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantOrgId = ChatbotController.getTenantOrgId(req);
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Parameter sessionId is required',
        });
      }

      const parsed = completeSessionSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid completion payload',
          details: parsed.error.format(),
        });
      }

      const updated = await ChatbotSessionRepository.completeSession(
        sessionId,
        parsed.data.ai_summary || undefined,
        parsed.data.satisfaction_rating || undefined,
        tenantOrgId,
      );

      return res.status(200).json({
        success: true,
        data: {
          sessionId: updated.session_id,
          status: updated.status,
          endedAt: updated.ended_at?.toISOString(),
          satisfactionRating: updated.satisfaction_rating,
        },
      });
    } catch (error: any) {
      if (error instanceof ChatbotError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
      }
      return next(error);
    }
  }
}
