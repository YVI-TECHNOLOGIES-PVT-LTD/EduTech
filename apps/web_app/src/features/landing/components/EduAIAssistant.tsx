import React from 'react';
import { ChatbotWidget } from '@/features/chatbot/components/ChatbotWidget';
import { ChatbotWidgetProps } from '@/features/chatbot/types/chatbot.types';

export const EduAIAssistant: React.FC<ChatbotWidgetProps> = (props) => {
  return <ChatbotWidget {...props} />;
};

export default EduAIAssistant;
