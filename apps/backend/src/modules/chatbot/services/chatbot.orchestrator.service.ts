import prisma from '../../../lib/prismaClient';
import { chatbot_channel, chatbot_status } from '@prisma/client';
import { ChatbotSessionRepository } from '../repositories/chatbot.session.repository';
import { ChatbotMessageRepository } from '../repositories/chatbot.message.repository';
import { RagRetrievalService } from './rag.retrieval.service';
import { ChatbotLlmService } from './chatbot.llm.service';
import { ChatbotLeadCaptureService } from './chatbot.lead.capture.service';
import { CreateSessionDto } from '../dto/request/chatbot-session.dto';
import { SendMessageDto } from '../dto/request/send-message.dto';
import {
  ChatbotSessionResponseDto,
  ChatbotTurnResponseDto,
} from '../dto/response/chatbot-response.dto';
import {
  ChatbotSessionNotFoundError,
  ChatbotTenantMismatchError,
  ChatbotValidationError,
} from '../errors/chatbot.errors';
import { logger } from '../../../utils/logger';

export class ChatbotOrchestratorService {
  /**
   * Initializes a new chatbot session for the authenticated or resolved tenant organization.
   */
  static async createSession(
    tenantOrgId: string,
    dto: CreateSessionDto,
    userId?: string | null,
  ): Promise<ChatbotSessionResponseDto> {
    if (!tenantOrgId) {
      throw new ChatbotValidationError('Tenant organization resolution required.');
    }

    const session = await ChatbotSessionRepository.createSession({
      org_id: tenantOrgId,
      channel: dto.channel || chatbot_channel.web_widget,
      user_id: userId || null,
      anonymous_contact: dto.anonymous_contact || null,
    });

    return {
      sessionId: session.session_id,
      orgId: session.org_id,
      channel: session.channel,
      status: session.status,
      leadId: session.lead_id,
      startedAt: session.started_at.toISOString(),
    };
  }

  /**
   * Retrieves an existing session, verifying tenant isolation.
   */
  static async getSession(
    sessionId: string,
    tenantOrgId: string,
  ): Promise<ChatbotSessionResponseDto> {
    const session = await ChatbotSessionRepository.findById(sessionId, tenantOrgId);
    if (!session) {
      throw new ChatbotSessionNotFoundError(sessionId);
    }

    if (session.org_id !== tenantOrgId) {
      throw new ChatbotTenantMismatchError();
    }

    return {
      sessionId: session.session_id,
      orgId: session.org_id,
      channel: session.channel,
      status: session.status,
      leadId: session.lead_id,
      startedAt: session.started_at.toISOString(),
    };
  }

  /**
   * Coordinates a complete conversation turn:
   * 1. Tenant & session validation
   * 2. Idempotency & retry guard
   * 3. Message persistence
   * 4. Multi-turn context assembly
   * 5. Tenant-scoped RAG vector search
   * 6. Grounded Gemini answer generation
   * 7. Seamless CRM lead capture & scoring
   * 8. Sanitized response formatting
   */
  static async processMessage(
    tenantOrgId: string,
    dto: SendMessageDto,
  ): Promise<ChatbotTurnResponseDto> {
    if (!tenantOrgId) {
      throw new ChatbotValidationError('Tenant organization context is required.');
    }

    // 1. Verify session exists and belongs to the resolved tenant
    const session = await ChatbotSessionRepository.findById(dto.session_id);
    if (!session) {
      throw new ChatbotSessionNotFoundError(dto.session_id);
    }

    if (session.org_id !== tenantOrgId) {
      throw new ChatbotTenantMismatchError();
    }

    if (session.status !== chatbot_status.active) {
      throw new ChatbotValidationError(
        `Cannot send messages to a session with status '${session.status}'.`,
      );
    }

    const cleanMessage = dto.message.trim();

    // 2. Retry / Duplicate Message Guard: Check for identical message in last 2 seconds
    const recentDuplicate = await prisma.chatbot_messages.findFirst({
      where: {
        session_id: dto.session_id,
        sender: 'user',
        content: cleanMessage,
        created_at: {
          gte: new Date(Date.now() - 2000),
        },
      },
      include: {
        chatbot_sessions: {
          include: {
            chatbot_messages: {
              where: { sender: 'bot' },
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (recentDuplicate && recentDuplicate.chatbot_sessions.chatbot_messages.length > 0) {
      const existingBotMsg = recentDuplicate.chatbot_sessions.chatbot_messages[0];
      return {
        sessionId: dto.session_id,
        userMessageId: recentDuplicate.message_id,
        botMessageId: existingBotMsg.message_id,
        answer: existingBotMsg.content,
        intent: existingBotMsg.intent || 'general_faq',
        confidence: Number(existingBotMsg.confidence_score || 0.9),
        suggestedFollowUps: [],
        leadCaptured: Boolean(session.lead_id),
        leadId: session.lead_id,
        escalationRequired: false,
        timestamp: existingBotMsg.created_at.toISOString(),
      };
    }

    // 3. Persist incoming user message
    const userMessage = await ChatbotMessageRepository.createUserMessage(
      dto.session_id,
      cleanMessage,
      tenantOrgId,
    );

    // 4. Retrieve recent conversation history for prompt context
    const recentMessages = await ChatbotMessageRepository.getRecentMessages(
      dto.session_id,
      8,
      tenantOrgId,
    );

    // 5. Retrieve tenant-scoped knowledge base chunks via pgvector
    const ragResult = await RagRetrievalService.retrieveGroundedContext(tenantOrgId, cleanMessage);

    // Fetch school name for personalization
    const org = await prisma.organizations.findUnique({
      where: { org_id: tenantOrgId },
      select: { org_name: true },
    });
    const schoolName = org?.org_name || 'Greenwood School, Delhi';

    // 6. Generate grounded completion via Gemini
    const llmResult = await ChatbotLlmService.generateAnswer({
      userQuery: cleanMessage,
      retrievedChunks: ragResult.retrievedChunks,
      groundedContext: ragResult.groundedContext,
      hasSufficientContext: ragResult.hasSufficientContext,
      conversationHistory: recentMessages,
      schoolName,
    });

    // 7. Persist bot message
    const botMessage = await ChatbotMessageRepository.createBotMessage(
      dto.session_id,
      {
        content: llmResult.answer,
        intent: llmResult.intent,
        confidenceScore: llmResult.confidence,
        modelVersion: llmResult.modelVersion,
        responseTimeMs: llmResult.responseTimeMs,
      },
      tenantOrgId,
    );

    // 8. Lead Capture: Process extracted entities via existing LeadService & LeadRepository
    let currentLeadId = session.lead_id;
    let leadCaptured = false;

    if (llmResult.requestedLeadFields) {
      try {
        const captureRes = await ChatbotLeadCaptureService.processLeadCapture(
          dto.session_id,
          tenantOrgId,
          llmResult.requestedLeadFields,
          `User: "${cleanMessage.substring(0, 80)}" | Intent: ${llmResult.intent}`,
        );

        if (captureRes.leadId) {
          currentLeadId = captureRes.leadId;
          leadCaptured = true;
        }
      } catch (leadErr) {
        logger.warn('[Chatbot Orchestrator] Lead capture process error (non-fatal):', {
          error: (leadErr as Error).message,
        });
      }
    }

    // 9. Return clean, client-facing response DTO
    return {
      sessionId: dto.session_id,
      userMessageId: userMessage.message_id,
      botMessageId: botMessage.message_id,
      answer: llmResult.answer,
      intent: llmResult.intent,
      confidence: llmResult.confidence,
      suggestedFollowUps: llmResult.suggestedFollowUps,
      leadCaptured,
      leadId: currentLeadId,
      escalationRequired: llmResult.escalationRequired,
      timestamp: botMessage.created_at.toISOString(),
    };
  }
}
