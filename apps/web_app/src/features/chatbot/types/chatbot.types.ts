export type MessageSender = 'user' | 'bot' | 'system' | 'staff';
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  status?: MessageStatus;
  intent?:
    | 'admission_inquiry'
    | 'general_faq'
    | 'lead_capture'
    | 'escalation_request'
    | 'feedback'
    | string;
  confidence?: number;
  suggestedFollowUps?: string[];
  leadCaptured?: boolean;
  escalationRequired?: boolean;
}

export interface ChatbotWidgetProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}
