import React from 'react';
import { Bot, User, AlertCircle, RotateCcw, Check, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types/chatbot.types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onSelectFollowUp?: (prompt: string) => void;
  onRetry?: (text: string) => void;
}

/**
 * Format markdown-like text (bold, bullet points, numbers, linebreaks) cleanly.
 */
function renderFormattedContent(text: string) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-xs sm:text-[13px]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet point detection (* or -)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const bulletText = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1">
              <span className="text-[#E7B76A] font-black shrink-0 text-sm leading-none mt-0.5">
                •
              </span>
              <span>{renderInlineStyles(bulletText)}</span>
            </div>
          );
        }

        // Numbered list detection (1. , 2. )
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1">
              <span className="text-[#063F40] dark:text-[#E7B76A] font-bold shrink-0 text-[11px] min-w-[16px]">
                {numMatch[1]}.
              </span>
              <span>{renderInlineStyles(numMatch[2])}</span>
            </div>
          );
        }

        // Standard paragraph
        return <p key={idx}>{renderInlineStyles(trimmed)}</p>;
      })}
    </div>
  );
}

/**
 * Helper to parse bold (**text**) and code formatting
 */
function renderInlineStyles(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onSelectFollowUp,
  onRetry,
}) => {
  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';
  const isError = message.status === 'error';

  const timeString = React.useMemo(() => {
    try {
      const d = new Date(message.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [message.timestamp]);

  return (
    <div
      className={`flex items-start space-x-2.5 my-2.5 ${
        isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
      } animate-slide-up`}
    >
      {/* Sender Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
          isUser
            ? 'bg-[#063F40] text-white border-emerald-700/40'
            : 'bg-[#042A2B] text-[#E7B76A] border-[#E7B76A]/40'
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Body */}
      <div
        className={`flex flex-col max-w-[82%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`px-4 py-3 rounded-2xl shadow-xs border transition-all ${
            isUser
              ? 'bg-[#063F40] text-white border-emerald-800 rounded-tr-xs'
              : isError
                ? 'bg-destructive/10 text-destructive border-destructive/30 rounded-tl-xs'
                : 'bg-card text-foreground border-border/80 rounded-tl-xs'
          }`}
        >
          {isUser ? (
            <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">
              {message.text}
            </p>
          ) : (
            renderFormattedContent(message.text)
          )}
        </div>

        {/* Status / Timestamp */}
        <div className="flex items-center space-x-1.5 mt-1 px-1 text-[10px] text-muted-foreground font-medium">
          <span>{timeString}</span>
          {isUser && message.status === 'sending' && (
            <span className="italic text-muted-foreground/80">• sending...</span>
          )}
          {isUser && message.status === 'sent' && (
            <Check className="w-3 h-3 text-emerald-500 inline" aria-label="Delivered" />
          )}
          {isError && (
            <span className="flex items-center space-x-1 text-destructive font-semibold">
              <AlertCircle className="w-3 h-3" />
              <span>Failed to send</span>
            </span>
          )}
        </div>

        {/* Retry Button on Error */}
        {isError && onRetry && (
          <button
            onClick={() => onRetry(message.text)}
            className="mt-1.5 inline-flex items-center space-x-1 text-xs font-bold text-destructive hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry sending message</span>
          </button>
        )}

        {/* Dynamic Suggested Follow-ups */}
        {isBot &&
          message.suggestedFollowUps &&
          message.suggestedFollowUps.length > 0 &&
          onSelectFollowUp && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {message.suggestedFollowUps.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectFollowUp(suggestion)}
                  className="text-left text-[11px] font-semibold px-3 py-1.5 bg-muted/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[#063F40] dark:text-emerald-300 border border-border/80 hover:border-[#E7B76A]/60 rounded-full transition-all flex items-center space-x-1.5 shadow-2xs hover:scale-[1.01]"
                >
                  <Sparkles className="w-2.5 h-2.5 text-[#E7B76A] shrink-0" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default ChatMessageBubble;
