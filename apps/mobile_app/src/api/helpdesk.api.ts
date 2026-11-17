import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';

export type TicketCategory = 'fees' | 'transport' | 'academics' | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface HelpdeskCategory {
  category_id: string;
  category_name: string;
  description?: string | null;
}

export interface HelpdeskTicket {
  id: string;
  ticketNumber: string;
  category: string;
  categoryId?: string;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  studentId?: string;
  studentName?: string;
  createdAt: string;
  updatedAt: string;
  lastReply?: string;
  repliesCount?: number;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  authorName: string;
  authorRole: 'parent' | 'admin' | 'support';
  message: string;
  createdAt: string;
}

export interface CreateTicketPayload {
  category_id?: string;
  categoryId?: string;
  category?: string;
  priority?: TicketPriority;
  subject?: string;
  title?: string;
  description: string;
  student_id?: string;
  studentId?: string;
}

export const helpdeskApi = {
  /**
   * List available support ticket categories
   */
  async getCategories(): Promise<HelpdeskCategory[]> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.HELPDESK.CATEGORIES);
      const raw =
        res?.data?.categories || res?.categories || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(raw)) {
        return raw.map((c: any) => ({
          category_id: String(c.category_id || c.id),
          category_name: String(c.category_name || c.name || 'General Support'),
          description: c.description || null,
        }));
      }
    } catch {
      // Fallback
    }
    return [
      { category_id: 'general', category_name: 'General Inquiries' },
      { category_id: 'academics', category_name: 'Academics & Classroom' },
      { category_id: 'fees', category_name: 'Fees & Billing' },
      { category_id: 'transport', category_name: 'Bus & Transport' },
    ];
  },

  /**
   * List parent helpdesk tickets
   */
  async getTickets(): Promise<HelpdeskTicket[]> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.HELPDESK.TICKETS);
      const rawTickets =
        res?.data?.tickets || res?.tickets || res?.data || (Array.isArray(res) ? res : []);

      if (Array.isArray(rawTickets)) {
        return rawTickets.map((t: any) => {
          const msgs = t.helpdesk_messages || [];
          const initialMsg = msgs[0]?.content || '';
          const lastMsg = msgs[msgs.length - 1]?.content || initialMsg;

          return {
            id: String(t.ticket_id || t.id),
            ticketNumber:
              t.ticket_number ||
              t.ticketNumber ||
              `TICK-${String(t.ticket_id || t.id || '')
                .slice(0, 8)
                .toUpperCase()}`,
            category:
              t.helpdesk_categories?.category_name ||
              t.category_name ||
              t.category ||
              'General Inquiry',
            categoryId: t.category_id || undefined,
            priority: (t.priority || 'medium').toLowerCase() as TicketPriority,
            status: (t.status || 'open').toLowerCase() as TicketStatus,
            subject: t.title || t.subject || initialMsg.split('\n')[0] || 'Support Ticket',
            description: t.description || initialMsg || '',
            studentId: t.student_id || undefined,
            studentName: t.students
              ? `${t.students.first_name || ''} ${t.students.last_name || ''}`.trim()
              : undefined,
            createdAt: t.created_at || t.createdAt || new Date().toISOString(),
            updatedAt: t.updated_at || t.updatedAt || new Date().toISOString(),
            lastReply: lastMsg,
            repliesCount: msgs.length,
          };
        });
      }
    } catch {
      // Graceful fallback
    }
    return [];
  },

  /**
   * Get ticket details by ID with messages
   */
  async getTicketById(id: string): Promise<HelpdeskTicket | null> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.HELPDESK.BY_ID(id));
      const t = res?.data || res;
      if (!t) return null;

      const msgs = t.helpdesk_messages || [];
      const initialMsg = msgs[0]?.content || '';

      return {
        id: String(t.ticket_id || t.id || id),
        ticketNumber:
          t.ticket_number ||
          t.ticketNumber ||
          `TICK-${String(t.ticket_id || t.id || id)
            .slice(0, 8)
            .toUpperCase()}`,
        category:
          t.helpdesk_categories?.category_name ||
          t.category_name ||
          t.category ||
          'General Inquiry',
        categoryId: t.category_id || undefined,
        priority: (t.priority || 'medium').toLowerCase() as TicketPriority,
        status: (t.status || 'open').toLowerCase() as TicketStatus,
        subject: t.title || t.subject || initialMsg.split('\n')[0] || 'Support Ticket',
        description: t.description || initialMsg || '',
        studentId: t.student_id || undefined,
        studentName: t.students
          ? `${t.students.first_name || ''} ${t.students.last_name || ''}`.trim()
          : undefined,
        createdAt: t.created_at || t.createdAt || new Date().toISOString(),
        updatedAt: t.updated_at || t.updatedAt || new Date().toISOString(),
        lastReply: msgs[msgs.length - 1]?.content,
        repliesCount: msgs.length,
      };
    } catch {
      return null;
    }
  },

  /**
   * Create a new support ticket
   */
  async createTicket(payload: CreateTicketPayload): Promise<HelpdeskTicket> {
    let resolvedCategoryId = payload.category_id || payload.categoryId;

    if (
      !resolvedCategoryId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedCategoryId)
    ) {
      try {
        const categories = await this.getCategories();
        const matched = categories.find(
          (c) =>
            c.category_name
              .toLowerCase()
              .includes(String(payload.category || 'general').toLowerCase()) ||
            c.category_id === payload.category,
        );
        resolvedCategoryId = matched ? matched.category_id : categories[0]?.category_id;
      } catch {
        // Fall through
      }
    }

    const body = {
      category_id: resolvedCategoryId,
      title: (payload.title || payload.subject || 'Support Ticket').trim(),
      description: payload.description.trim(),
      priority: payload.priority || 'medium',
      student_id: payload.student_id || payload.studentId || undefined,
    };

    const res = await apiClient.post<any>(ENDPOINTS.HELPDESK.CREATE_TICKET, body);
    const created = res?.data || res;
    return {
      id: String(created.ticket_id || created.id),
      ticketNumber:
        created.ticket_number ||
        created.ticketNumber ||
        `TICK-${String(created.ticket_id || '')
          .slice(0, 8)
          .toUpperCase()}`,
      category: created.category_name || payload.category || 'General Support',
      priority: (created.priority || payload.priority || 'medium').toLowerCase() as TicketPriority,
      status: 'open',
      subject: created.title || body.title,
      description: body.description,
      studentId: body.student_id,
      createdAt: created.created_at || new Date().toISOString(),
      updatedAt: created.updated_at || new Date().toISOString(),
    };
  },

  /**
   * Get replies for a support ticket
   */
  async getTicketReplies(id: string): Promise<TicketReply[]> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.HELPDESK.BY_ID(id));
      const t = res?.data || res;
      const msgs = t?.helpdesk_messages || [];

      if (Array.isArray(msgs) && msgs.length > 0) {
        return msgs.map((m: any) => ({
          id: String(m.message_id || m.id),
          ticketId: id,
          authorName:
            m.users?.full_name ||
            m.author_name ||
            (m.message_type === 'initial_description' ? 'Parent' : 'Support Team'),
          authorRole:
            m.message_type === 'initial_description' ? 'parent' : m.author_role || 'support',
          message: m.content || '',
          createdAt: m.created_at || new Date().toISOString(),
        }));
      }

      // Fallback to separate messages endpoint if present
      const msgRes = await apiClient.get<any>(ENDPOINTS.HELPDESK.MESSAGES(id));
      const rawMessages =
        msgRes?.data?.messages ||
        msgRes?.messages ||
        (Array.isArray(msgRes?.data) ? msgRes.data : []);
      if (Array.isArray(rawMessages)) {
        return rawMessages.map((m: any) => ({
          id: String(m.message_id || m.id),
          ticketId: id,
          authorName: m.users?.full_name || m.author_name || 'Support Staff',
          authorRole: m.author_role || 'support',
          message: m.content || '',
          createdAt: m.created_at || new Date().toISOString(),
        }));
      }
    } catch {
      // Graceful fallback
    }
    return [];
  },

  /**
   * Post a reply to an existing support ticket
   */
  async addReply(id: string, message: string): Promise<TicketReply> {
    const res = await apiClient.post<any>(ENDPOINTS.HELPDESK.REPLIES(id), {
      content: message.trim(),
      message_type: 'public_reply',
    });
    const created = res?.data || res;
    return {
      id: String(created.message_id || created.id || `reply_${Date.now()}`),
      ticketId: id,
      authorName: 'You',
      authorRole: 'parent',
      message: message.trim(),
      createdAt: created.created_at || new Date().toISOString(),
    };
  },
};
