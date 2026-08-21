import { chatbot_channel, chatbot_status } from '@prisma/client';
import { ChatbotSessionRepository } from '../repositories/chatbot.session.repository';
import { ChatbotMessageRepository } from '../repositories/chatbot.message.repository';
import { RagRetrievalService } from './rag.retrieval.service';
import { ChatbotLlmService } from './chatbot.llm.service';
import { ChatbotLeadCaptureService, LeadCaptureResult } from './chatbot.lead.capture.service';
import prisma from '../../../lib/prismaClient';

export interface ProcessMessageResult {
  sessionId: string;
  userMessageId: string;
  botMessageId: string;
  answer: string;
  intent: string;
  confidence: number;
  suggestedFollowUps: string[];
  leadCapture: LeadCaptureResult;
  escalationRequired: boolean;
  responseTimeMs: number;
}

export class ChatbotSessionService {
  /**
   * Initializes or retrieves an active chatbot session for a tenant.
   */
  static async getOrCreateSession(
    sessionId: string | undefined,
    tenantOrgId: string,
    channel: chatbot_channel = chatbot_channel.web_widget,
    userId?: string | null,
  ) {
    if (sessionId) {
      const existing = await ChatbotSessionRepository.findById(sessionId, tenantOrgId);
      if (existing && existing.status === chatbot_status.active) {
        return existing;
      }
    }

    return ChatbotSessionRepository.createSession({
      org_id: tenantOrgId,
      channel,
      user_id: userId || null,
    });
  }

  /**
   * Core conversation turn: processes incoming user message, retrieves RAG context,
   * generates grounded answer, persists both messages, and automatically syncs leads.
   */
  static async handleUserMessage(
    sessionId: string,
    tenantOrgId: string,
    messageContent: string,
  ): Promise<ProcessMessageResult> {
    const session = await ChatbotSessionRepository.findById(sessionId, tenantOrgId);
    if (!session) {
      throw new Error(`[Chatbot Session] Session ${sessionId} not found for tenant ${tenantOrgId}`);
    }

    // 1. Persist incoming user message
    const userMsg = await ChatbotMessageRepository.createUserMessage(
      sessionId,
      messageContent,
      tenantOrgId,
    );

    // 2. Fetch recent conversation history for multi-turn context
    const recentMessages = await ChatbotMessageRepository.getRecentMessages(
      sessionId,
      10,
      tenantOrgId,
    );

    // 3. Retrieve tenant-scoped knowledge base chunks via pgvector
    const ragResult = await RagRetrievalService.retrieveGroundedContext(
      tenantOrgId,
      messageContent,
    );

    // Fetch school name for personalization
    const org = await prisma.organizations.findUnique({
      where: { org_id: tenantOrgId },
      select: { org_name: true },
    });
    const schoolName = org?.org_name || 'Greenwood School, Delhi';

    // 4. Generate grounded completion via Gemini
    const llmResult = await ChatbotLlmService.generateAnswer({
      userQuery: messageContent,
      retrievedChunks: ragResult.retrievedChunks,
      groundedContext: ragResult.groundedContext,
      hasSufficientContext: ragResult.hasSufficientContext,
      conversationHistory: recentMessages,
      schoolName,
    });

    // 5. Persist bot message
    const botMsg = await ChatbotMessageRepository.createBotMessage(
      sessionId,
      {
        content: llmResult.answer,
        intent: llmResult.intent,
        confidenceScore: llmResult.confidence,
        modelVersion: llmResult.modelVersion,
        responseTimeMs: llmResult.responseTimeMs,
      },
      tenantOrgId,
    );

    // 6. Process lead capture if contact/admission fields were extracted
    let leadCaptureResult: LeadCaptureResult = {
      action: 'NOOP',
      leadId: session.lead_id,
    };

    if (llmResult.requestedLeadFields) {
      leadCaptureResult = await ChatbotLeadCaptureService.processLeadCapture(
        sessionId,
        tenantOrgId,
        llmResult.requestedLeadFields,
        `User: "${messageContent.substring(0, 100)}..." -> Intent: ${llmResult.intent}`,
      );
    }

    return {
      sessionId,
      userMessageId: userMsg.message_id,
      botMessageId: botMsg.message_id,
      answer: llmResult.answer,
      intent: llmResult.intent,
      confidence: llmResult.confidence,
      suggestedFollowUps: llmResult.suggestedFollowUps,
      leadCapture: leadCaptureResult,
      escalationRequired: llmResult.escalationRequired,
      responseTimeMs: llmResult.responseTimeMs,
    };
  }
}
