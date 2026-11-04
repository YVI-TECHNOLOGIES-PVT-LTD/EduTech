import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';

export type TicketCategory = 'fees' | 'transport' | 'academics' | 'general';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface HelpdeskTicket {
  id: string;
  ticketNumber: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  studentId?: string;
  createdAt: string;
  updatedAt: string;
  lastReply?: string;
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
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  studentId?: string;
}

export const helpdeskApi = {
  /**
   * List parent helpdesk tickets
   */
  async getTickets(): Promise<HelpdeskTicket[]> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.HELPDESK.TICKETS);
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch {
      // Graceful fallback
    }
    return [];
  },

  /**
   * Get ticket details by ID
   */
  async getTicketById(id: string): Promise<HelpdeskTicket | null> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.HELPDESK.BY_ID(id));
      return res?.data || res || null;
    } catch {
      return null;
    }
  },

  /**
   * Create a new support ticket
   */
  async createTicket(payload: CreateTicketPayload): Promise<HelpdeskTicket> {
    const res = await apiClient.post<any>(ENDPOINTS.HELPDESK.CREATE_TICKET, payload);
    return res?.data || res;
  },

  /**
   * Get replies for a support ticket
   */
  async getTicketReplies(id: string): Promise<TicketReply[]> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.HELPDESK.REPLIES(id));
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch {
      // Graceful fallback
    }
    return [];
  },

  /**
   * Post a reply to an existing support ticket
   */
  async addReply(id: string, message: string): Promise<TicketReply> {
    const res = await apiClient.post<any>(ENDPOINTS.HELPDESK.REPLIES(id), { message });
    return res?.data || res;
  },
};
