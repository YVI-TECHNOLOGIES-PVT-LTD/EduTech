import { create } from 'zustand';
import {
  helpdeskApi,
  HelpdeskTicket,
  TicketReply,
  CreateTicketPayload,
  TicketStatus,
  HelpdeskCategory,
} from '../api/helpdesk.api';

interface HelpdeskState {
  tickets: HelpdeskTicket[];
  categories: HelpdeskCategory[];
  activeTicket: HelpdeskTicket | null;
  activeReplies: TicketReply[];
  filter: 'all' | TicketStatus;
  isLoading: boolean;
  isSubmitting: boolean;
  isError: boolean;
  errorMessage: string | null;
  lastFetchedAt: number;

  setFilter: (filter: 'all' | TicketStatus) => void;
  fetchCategories: () => Promise<void>;
  fetchTickets: (force?: boolean) => Promise<void>;
  fetchTicketDetails: (id: string) => Promise<void>;
  createTicket: (payload: CreateTicketPayload) => Promise<boolean>;
  sendReply: (ticketId: string, message: string) => Promise<boolean>;
  clear: () => void;
}

export const useHelpdeskStore = create<HelpdeskState>((set, get) => ({
  tickets: [],
  categories: [],
  activeTicket: null,
  activeReplies: [],
  filter: 'all',
  isLoading: false,
  isSubmitting: false,
  isError: false,
  errorMessage: null,
  lastFetchedAt: 0,

  setFilter: (filter) => set({ filter }),

  fetchCategories: async () => {
    if (get().categories.length > 0) return;
    try {
      const categories = await helpdeskApi.getCategories();
      set({ categories });
    } catch {
      // fallback handled inside api
    }
  },

  fetchTickets: async (force = false) => {
    const { tickets, lastFetchedAt } = get();
    if (!force && tickets.length > 0 && Date.now() - lastFetchedAt < 60 * 1000) {
      return;
    }

    set({ isLoading: true, isError: false, errorMessage: null });
    try {
      const items = await helpdeskApi.getTickets();
      set({ tickets: items, isLoading: false, lastFetchedAt: Date.now() });
    } catch (err: any) {
      set({
        isLoading: false,
        isError: true,
        errorMessage: err?.message || 'Failed to fetch helpdesk tickets',
      });
    }
  },

  fetchTicketDetails: async (id: string) => {
    set({ isLoading: true, isError: false, errorMessage: null });
    try {
      const [ticket, replies] = await Promise.all([
        helpdeskApi.getTicketById(id),
        helpdeskApi.getTicketReplies(id),
      ]);
      set({ activeTicket: ticket, activeReplies: replies, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        isError: true,
        errorMessage: err?.message || 'Failed to fetch ticket conversation',
      });
    }
  },

  createTicket: async (payload: CreateTicketPayload) => {
    set({ isSubmitting: true, isError: false, errorMessage: null });
    try {
      const created = await helpdeskApi.createTicket(payload);
      if (created) {
        const current = get().tickets;
        set({ tickets: [created, ...current], isSubmitting: false });
        return true;
      }
      set({ isSubmitting: false });
      return false;
    } catch (err: any) {
      set({
        isSubmitting: false,
        isError: true,
        errorMessage: err?.message || 'Failed to submit ticket',
      });
      return false;
    }
  },

  sendReply: async (ticketId: string, message: string) => {
    if (!message.trim()) return false;
    set({ isSubmitting: true, isError: false, errorMessage: null });
    try {
      const reply = await helpdeskApi.addReply(ticketId, message.trim());
      if (reply) {
        const replies = get().activeReplies;
        set({ activeReplies: [...replies, reply], isSubmitting: false });
        return true;
      }
      set({ isSubmitting: false });
      return false;
    } catch (err: any) {
      set({
        isSubmitting: false,
        isError: true,
        errorMessage: err?.message || 'Failed to send reply',
      });
      return false;
    }
  },

  clear: () => {
    set({
      tickets: [],
      activeTicket: null,
      activeReplies: [],
      filter: 'all',
      isLoading: false,
      isSubmitting: false,
      isError: false,
      errorMessage: null,
    });
  },
}));
