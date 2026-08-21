import prisma from '../../../lib/prismaClient';
import { chatbot_sessions, chatbot_channel, chatbot_status, Prisma } from '@prisma/client';

export interface CreateSessionInput {
  org_id: string;
  channel?: chatbot_channel;
  user_id?: string | null;
  anonymous_contact?: string | null;
  lead_id?: string | null;
}

export class ChatbotSessionRepository {
  /**
   * Creates a new chatbot session for an organization.
   */
  static async createSession(data: CreateSessionInput): Promise<chatbot_sessions> {
    return prisma.chatbot_sessions.create({
      data: {
        org_id: data.org_id,
        channel: data.channel || chatbot_channel.web_widget,
        user_id: data.user_id || undefined,
        anonymous_contact: data.anonymous_contact || undefined,
        lead_id: data.lead_id || undefined,
        status: chatbot_status.active,
        started_at: new Date(),
      },
      include: {
        organizations: {
          select: {
            org_id: true,
            org_name: true,
            org_code: true,
          },
        },
      },
    });
  }

  /**
   * Finds a session by ID, optionally scoped to an organization for tenant security.
   */
  static async findById(sessionId: string, orgId?: string): Promise<chatbot_sessions | null> {
    const where: Prisma.chatbot_sessionsWhereInput = { session_id: sessionId };
    if (orgId) {
      where.org_id = orgId;
    }

    return prisma.chatbot_sessions.findFirst({
      where,
      include: {
        leads: {
          select: {
            lead_id: true,
            lead_number: true,
            student_first_name: true,
            contact_name: true,
            contact_phone: true,
            contact_email: true,
            stage: true,
            ai_lead_score: true,
          },
        },
        users: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        staff: {
          select: {
            staff_id: true,
            employee_code: true,
            users_staff_user_idTousers: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Updates session fields with strict tenant check.
   */
  static async updateSession(
    sessionId: string,
    data: Prisma.chatbot_sessionsUpdateInput,
    orgId?: string,
  ): Promise<chatbot_sessions> {
    const where: Prisma.chatbot_sessionsWhereUniqueInput = { session_id: sessionId };
    if (orgId) {
      // First verify tenant ownership
      const existing = await prisma.chatbot_sessions.findFirst({
        where: { session_id: sessionId, org_id: orgId },
        select: { session_id: true },
      });
      if (!existing) {
        throw new Error(`Session ${sessionId} not found for tenant ${orgId}`);
      }
    }

    return prisma.chatbot_sessions.update({
      where,
      data,
    });
  }

  /**
   * Links a session to a CRM lead.
   */
  static async linkLead(
    sessionId: string,
    leadId: string,
    orgId?: string,
  ): Promise<chatbot_sessions> {
    return this.updateSession(
      sessionId,
      {
        leads: {
          connect: { lead_id: leadId },
        },
      },
      orgId,
    );
  }

  /**
   * Updates anonymous visitor contact details (e.g. phone/email before lead conversion).
   */
  static async updateAnonymousContact(
    sessionId: string,
    anonymousContact: string,
    orgId?: string,
  ): Promise<chatbot_sessions> {
    return this.updateSession(
      sessionId,
      {
        anonymous_contact: anonymousContact,
      },
      orgId,
    );
  }

  /**
   * Marks a session as completed with optional summary and rating.
   */
  static async completeSession(
    sessionId: string,
    aiSummary?: string,
    satisfactionRating?: number,
    orgId?: string,
  ): Promise<chatbot_sessions> {
    return this.updateSession(
      sessionId,
      {
        status: chatbot_status.completed,
        ended_at: new Date(),
        ai_summary: aiSummary || undefined,
        satisfaction_rating: satisfactionRating || undefined,
      },
      orgId,
    );
  }

  /**
   * Escalates a session to a staff member with a reason.
   */
  static async escalateSession(
    sessionId: string,
    staffId: string,
    reason: string,
    orgId?: string,
  ): Promise<chatbot_sessions> {
    return this.updateSession(
      sessionId,
      {
        status: chatbot_status.escalated,
        escalation_reason: reason,
        staff: {
          connect: { staff_id: staffId },
        },
      },
      orgId,
    );
  }
}
