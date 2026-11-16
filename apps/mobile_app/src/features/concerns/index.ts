import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

export interface HelpdeskCategory {
  category_id: string;
  category_name: string;
  description?: string;
  is_active: boolean;
}

export interface HelpdeskAttachment {
  attachment_id: string;
  file_name: string;
  file_url: string;
  file_size_bytes?: number;
  mime_type?: string;
}

export interface HelpdeskMessage {
  message_id: string;
  ticket_id: string;
  sender_user_id: string;
  message_type: 'public_reply' | 'internal_note';
  content: string;
  created_at: string;
  attachments?: HelpdeskAttachment[];
}

export interface HelpdeskHistory {
  history_id: string;
  ticket_id: string;
  from_status?: string | null;
  to_status: string;
  changed_by_user_id: string;
  changed_at: string;
  notes?: string | null;
}

export interface HelpdeskTicket {
  ticket_id: string;
  ticket_number: string;
  org_id: string;
  title: string;
  description: string;
  category_id: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_parent' | 'escalated' | 'resolved' | 'closed';
  ticket_type: 'parent_submitted' | 'staff_on_behalf' | 'internal';
  requester_user_id: string;
  student_id?: string | null;
  assigned_to_user_id?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  helpdesk_categories?: HelpdeskCategory;
  helpdesk_messages?: HelpdeskMessage[];
  helpdesk_attachments?: HelpdeskAttachment[];
  history?: HelpdeskHistory[];
}

export interface ConcernTicket {
  id: string;
  subject: string;
  priority: string;
}

export interface CreateTicketDto {
  title: string;
  description: string;
  category_id: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  ticket_type?: 'parent_submitted' | 'staff_on_behalf' | 'internal';
  student_id?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSizeBytes?: number;
    mimeType?: string;
  }>;
}

export const helpdeskApi = {
  getCategories: async () => {
    return apiClient.get<{ success: boolean; data: HelpdeskCategory[] }>(
      ENDPOINTS.HELPDESK.CATEGORIES,
    );
  },
  getTickets: async (params?: { status?: string; page?: number; limit?: number }) => {
    return apiClient.get<{ success: boolean; data: HelpdeskTicket[]; tickets?: HelpdeskTicket[] }>(
      ENDPOINTS.HELPDESK.TICKETS,
      { params },
    );
  },
  getTicketById: async (ticketId: string) => {
    return apiClient.get<{ success: boolean; data: HelpdeskTicket }>(
      ENDPOINTS.HELPDESK.TICKET_BY_ID(ticketId),
    );
  },
  createTicket: async (dto: CreateTicketDto) => {
    return apiClient.post<{ success: boolean; data: HelpdeskTicket }>(
      ENDPOINTS.HELPDESK.CREATE_TICKET,
      dto,
    );
  },
  replyTicket: async (ticketId: string, content: string, attachments?: any[]) => {
    return apiClient.post<{ success: boolean; data: HelpdeskMessage }>(
      ENDPOINTS.HELPDESK.MESSAGES(ticketId),
      {
        content,
        message_type: 'public_reply',
        attachments,
      },
    );
  },
  closeTicket: async (ticketId: string, note?: string) => {
    return apiClient.patch<{ success: boolean; data: HelpdeskTicket }>(
      ENDPOINTS.HELPDESK.UPDATE_STATUS(ticketId),
      {
        status: 'closed',
        note: note || 'Closed by user',
      },
    );
  },
};
