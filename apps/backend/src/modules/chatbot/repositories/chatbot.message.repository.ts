import prisma from '../../../lib/prismaClient';
import { chatbot_messages, chatbot_sender, Prisma } from '@prisma/client';

export interface CreateBotMessageInput {
  content: string;
  intent?: string | null;
  confidenceScore?: number | null;
  modelVersion?: string | null;
  responseTimeMs?: number | null;
}

export class ChatbotMessageRepository {
  /**
   * Persists a user message into a session.
   * If orgId is provided, validates session tenant ownership.
   */
  static async createUserMessage(
    sessionId: string,
    content: string,
    orgId?: string,
  ): Promise<chatbot_messages> {
    if (orgId) {
      const session = await prisma.chatbot_sessions.findFirst({
        where: { session_id: sessionId, org_id: orgId },
        select: { session_id: true },
      });
      if (!session) {
        throw new Error(`Session ${sessionId} not found for tenant ${orgId}`);
      }
    }

    return prisma.chatbot_messages.create({
      data: {
        session_id: sessionId,
        sender: chatbot_sender.user,
        content: content.trim(),
        created_at: new Date(),
      },
    });
  }

  /**
   * Persists a bot response message into a session.
   */
  static async createBotMessage(
    sessionId: string,
    data: CreateBotMessageInput,
    orgId?: string,
  ): Promise<chatbot_messages> {
    if (orgId) {
      const session = await prisma.chatbot_sessions.findFirst({
        where: { session_id: sessionId, org_id: orgId },
        select: { session_id: true },
      });
      if (!session) {
        throw new Error(`Session ${sessionId} not found for tenant ${orgId}`);
      }
    }

    return prisma.chatbot_messages.create({
      data: {
        session_id: sessionId,
        sender: chatbot_sender.bot,
        content: data.content,
        intent: data.intent || undefined,
        confidence_score:
          data.confidenceScore != null ? new Prisma.Decimal(data.confidenceScore) : undefined,
        model_version: data.modelVersion || undefined,
        response_time_ms: data.responseTimeMs || undefined,
        created_at: new Date(),
      },
    });
  }

  /**
   * Persists a staff message (e.g. human takeover / live agent support).
   */
  static async createStaffMessage(
    sessionId: string,
    content: string,
    orgId?: string,
  ): Promise<chatbot_messages> {
    if (orgId) {
      const session = await prisma.chatbot_sessions.findFirst({
        where: { session_id: sessionId, org_id: orgId },
        select: { session_id: true },
      });
      if (!session) {
        throw new Error(`Session ${sessionId} not found for tenant ${orgId}`);
      }
    }

    return prisma.chatbot_messages.create({
      data: {
        session_id: sessionId,
        sender: chatbot_sender.staff,
        content: content.trim(),
        created_at: new Date(),
      },
    });
  }

  /**
   * Retrieves recent messages for a session (ordered chronologically for LLM context).
   */
  static async getRecentMessages(
    sessionId: string,
    limit: number = 20,
    orgId?: string,
  ): Promise<chatbot_messages[]> {
    if (orgId) {
      const session = await prisma.chatbot_sessions.findFirst({
        where: { session_id: sessionId, org_id: orgId },
        select: { session_id: true },
      });
      if (!session) {
        throw new Error(`Session ${sessionId} not found for tenant ${orgId}`);
      }
    }

    const messages = await prisma.chatbot_messages.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    // Return in chronological order (oldest first) for prompt building
    return messages.reverse();
  }
}
