export interface ChatbotSessionResponseDto {
  sessionId: string;
  orgId: string;
  channel: string;
  status: string;
  leadId: string | null;
  startedAt: string;
}

export interface ChatbotMessageResponseDto {
  messageId: string;
  sessionId: string;
  sender: 'user' | 'bot' | 'staff';
  content: string;
  createdAt: string;
}

export interface ChatbotTurnResponseDto {
  sessionId: string;
  userMessageId: string;
  botMessageId: string;
  answer: string;
  intent: string;
  confidence: number;
  suggestedFollowUps: string[];
  leadCaptured: boolean;
  leadId: string | null;
  escalationRequired: boolean;
  timestamp: string;
}
