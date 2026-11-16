import React from 'react';
import { Bot } from 'lucide-react';

export const ChatTypingIndicator: React.FC = () => {
  return (
    <div
      className="flex items-start space-x-2.5 my-2 animate-fade-in"
      role="status"
      aria-label="EduAI is typing a response"
    >
      <div className="w-7 h-7 rounded-xl bg-[#063F40] text-[#E7B76A] flex items-center justify-center shrink-0 shadow-xs border border-[#E7B76A]/30">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-card border border-border/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs flex items-center space-x-2">
        <span className="text-[11px] font-medium text-muted-foreground mr-1">EduAI is typing</span>
        <div className="flex space-x-1 items-center">
          <span className="w-1.5 h-1.5 bg-[#063F40] dark:bg-[#E7B76A] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-[#063F40] dark:bg-[#E7B76A] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-[#063F40] dark:bg-[#E7B76A] rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default ChatTypingIndicator;
