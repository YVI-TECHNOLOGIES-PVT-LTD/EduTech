import { apiSlice } from '@/app/store/apiSlice';
import { ENDPOINTS } from './endpoints';

export interface CreateSessionRequest {
  channel?: 'web_widget' | 'portal' | 'whatsapp' | 'mobile_app';
  initial_question?: string;
}

export interface ChatbotSessionData {
  sessionId: string;
  orgId: string;
  status: 'active' | 'completed' | 'escalated' | 'abandoned';
  channel: string;
  createdAt: string;
}

export interface SendMessageRequest {
  session_id: string;
  message: string;
}

export interface ChatbotMessageData {
  sessionId: string;
  userMessageId: string;
  botMessageId: string;
  answer: string;
  intent: 'admission_inquiry' | 'general_faq' | 'lead_capture' | 'escalation_request' | 'feedback';
  confidence: number;
  suggestedFollowUps: string[];
  leadCaptured: boolean;
  escalationRequired: boolean;
  timestamp: string;
}

export interface ChatbotMessageHistoryItem {
  messageId: string;
  sender: 'user' | 'bot' | 'staff';
  messageText: string;
  metadata?: {
    intent?: string;
    confidence?: number;
    suggestedFollowUps?: string[];
    leadCaptured?: boolean;
    escalationRequired?: boolean;
    [key: string]: any;
  };
  createdAt: string;
}

export interface ChatbotSessionDetailsData {
  session: {
    sessionId: string;
    orgId?: string;
    status: 'active' | 'completed' | 'escalated' | 'abandoned';
    leadId?: string | null;
    anonymousContact?: {
      name?: string;
      phone?: string;
      email?: string;
      grade?: string;
      [key: string]: any;
    } | null;
    createdAt: string;
  };
  messages: ChatbotMessageHistoryItem[];
}

export interface CompleteSessionRequest {
  satisfaction_rating?: number;
  feedback_notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const chatbotApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createChatbotSession: builder.mutation<
      ApiResponse<ChatbotSessionData>,
      CreateSessionRequest | void
    >({
      query: (body = {}) => ({
        url: ENDPOINTS.CHATBOT.CREATE_SESSION,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ChatbotSession'],
    }),

    sendChatbotMessage: builder.mutation<ApiResponse<ChatbotMessageData>, SendMessageRequest>({
      query: (body) => ({
        url: ENDPOINTS.CHATBOT.SEND_MESSAGE,
        method: 'POST',
        body,
      }),
    }),

    getChatbotSession: builder.query<ApiResponse<ChatbotSessionDetailsData>, string>({
      query: (sessionId) => ENDPOINTS.CHATBOT.GET_SESSION(sessionId),
      providesTags: (result, error, sessionId) => [{ type: 'ChatbotSession', id: sessionId }],
    }),

    completeChatbotSession: builder.mutation<
      ApiResponse<{ sessionId: string; status: string; endedAt: string }>,
      { sessionId: string; data?: CompleteSessionRequest }
    >({
      query: ({ sessionId, data = {} }) => ({
        url: ENDPOINTS.CHATBOT.COMPLETE_SESSION(sessionId),
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: 'ChatbotSession', id: sessionId },
      ],
    }),
  }),
});

export const {
  useCreateChatbotSessionMutation,
  useSendChatbotMessageMutation,
  useGetChatbotSessionQuery,
  useLazyGetChatbotSessionQuery,
  useCompleteChatbotSessionMutation,
} = chatbotApi;
