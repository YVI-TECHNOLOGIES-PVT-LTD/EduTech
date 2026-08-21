import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  X,
  Send,
  RotateCcw,
  Sparkles,
  PhoneCall,
  ChevronDown,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatbot } from '../hooks/useChatbot';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { ChatbotWidgetProps } from '../types/chatbot.types';

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ isOpen, onOpen, onClose }) => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    error,
    lastFailedMessage,
    sendMessage,
    retryLastMessage,
    startNewConversation,
  } = useChatbot();

  // Auto-scroll to bottom on message list change or typing
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opening widget
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle send message
  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setInputText('');
  };

  // Handle keyboard keydown (Enter to send, Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectFollowUp = (prompt: string) => {
    if (isLoading) return;
    sendMessage(prompt);
  };

  // If collapsed, render the floating trigger launcher
  if (!isOpen) {
    return (
      <aside aria-label="Admissions Concierge">
        <button
          onClick={onOpen}
          className="fixed bottom-5 right-5 z-50 group flex items-center space-x-2.5 pl-3.5 pr-4 py-3 rounded-full bg-[#063F40] text-[#E7B76A] shadow-2xl hover:scale-105 transition-all duration-200 border border-[#E7B76A]/40 focus:outline-none focus:ring-4 focus:ring-[#E7B76A]/30"
          title="Open EduAI Admissions Assistant"
          aria-label="Open EduAI Admissions Concierge Chatbot"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-6 h-6 text-[#E7B76A] group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#E7B76A] border-2 border-[#042A2B] animate-pulse" />
          </div>
          <span className="text-xs font-extrabold tracking-tight text-white hidden sm:inline-block">
            Ask Admissions AI
          </span>
        </button>
      </aside>
    );
  }

  // Expanded Widget View
  return (
    <aside
      className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-5 sm:right-5 z-50 w-auto sm:w-[410px] md:w-[430px] max-w-[calc(100vw-1.5rem)] h-[min(590px,calc(100dvh-2.5rem))] max-h-[calc(100dvh-2rem)] bg-card border border-border/90 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 animate-scale-up"
      role="dialog"
      aria-modal="true"
      aria-label="EduAI Admissions Concierge"
    >
      {/* 1. Header Bar */}
      <header className="bg-[#042A2B] text-white px-3.5 py-3 sm:px-4 sm:py-3.5 flex items-center justify-between border-b border-emerald-900/60 shrink-0 select-none shadow-sm">
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#063F40] text-[#E7B76A] border border-[#E7B76A]/40 flex items-center justify-center font-black shrink-0 shadow-xs">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="font-extrabold text-xs sm:text-sm tracking-tight text-white truncate">
                EduAI Concierge
              </h3>
              <span
                className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"
                title="Online"
              />
            </div>
            <p className="text-[10px] text-emerald-200/80 font-medium truncate">
              Admissions & Enrollment Desk
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* New Conversation Button */}
          <button
            onClick={() => setShowConfirmReset(true)}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Start new conversation"
            aria-label="Restart Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Minimize / Close */}
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Minimize Chat"
            aria-label="Minimize Chat Assistant"
          >
            <ChevronDown className="w-4 h-4 hidden sm:block" />
            <X className="w-4 h-4 sm:hidden" />
          </button>
        </div>
      </header>

      {/* Confirmation Modal for Resetting Conversation */}
      {showConfirmReset && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-xs z-30 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-5 rounded-2xl shadow-xl max-w-xs text-center space-y-3">
            <h4 className="font-extrabold text-sm text-foreground">Start New Conversation?</h4>
            <p className="text-xs text-muted-foreground">
              This will clear the current chat thread on your screen and start a fresh session.
            </p>
            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setShowConfirmReset(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs font-bold bg-[#063F40] hover:bg-[#042A2B] text-[#E7B76A]"
                onClick={() => {
                  setShowConfirmReset(false);
                  startNewConversation();
                }}
              >
                Start Fresh
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Message History Thread */}
      <div
        className="flex-1 p-3 sm:p-4 overflow-y-auto bg-muted/20 space-y-2 text-left focus:outline-none scroll-smooth"
        tabIndex={0}
        role="log"
        aria-live="polite"
        aria-label="Conversation History"
      >
        {/* Quick Service Links Banner */}
        <div className="p-2.5 sm:p-3 bg-card border border-border/70 rounded-xl sm:rounded-2xl space-y-1.5 mb-2.5 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-[11px] sm:text-xs font-bold text-[#063F40] dark:text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-[#E7B76A] shrink-0" />
            <span>Fast School Services</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={() => {
                onClose();
                navigate('/enquiry');
              }}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-muted/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-border/60 text-left text-[10px] sm:text-[11px] font-semibold text-foreground flex items-center justify-between transition-colors"
            >
              <span className="truncate">Submit Enquiry</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 ml-1" />
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/admission/register');
              }}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-muted/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-border/60 text-left text-[10px] sm:text-[11px] font-semibold text-foreground flex items-center justify-between transition-colors"
            >
              <span className="truncate">Apply Online</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 ml-1" />
            </button>
          </div>
        </div>

        {/* Message Bubbles */}
        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            onSelectFollowUp={handleSelectFollowUp}
            onRetry={retryLastMessage}
          />
        ))}

        {/* Typing Indicator */}
        {isLoading && <ChatTypingIndicator />}

        {/* Inline Error State */}
        {error && (
          <div
            className="p-3 my-2 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-between text-xs text-destructive animate-fade-in"
            role="alert"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            {lastFailedMessage && (
              <button
                onClick={() => retryLastMessage()}
                className="font-bold underline hover:no-underline text-xs shrink-0 ml-2"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Input Bar */}
      <footer className="p-2.5 sm:p-3 bg-card border-t border-border/80 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end space-x-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
              placeholder="Ask about admissions, fees, grades..."
              aria-label="Type your message"
              className="w-full resize-none max-h-20 py-2 sm:py-2.5 px-3 sm:px-3.5 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/80 focus:border-[#063F40] dark:focus:border-[#E7B76A] rounded-xl sm:rounded-2xl text-xs sm:text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#063F40]/20 transition-all leading-tight"
            />
          </div>

          <Button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            size="sm"
            className="h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-xl sm:rounded-2xl bg-[#063F40] hover:bg-[#042A2B] text-[#E7B76A] disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs transition-transform active:scale-95"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </form>

        {/* Footer Disclaimer & Hotline Shortcut */}
        <div className="flex items-center justify-between pt-1.5 sm:pt-2 px-1 text-[10px] text-muted-foreground font-medium">
          <span>AI Admissions Assistant</span>
          <button
            onClick={() => {
              onClose();
              navigate('/contact');
            }}
            className="hover:underline flex items-center space-x-1 text-[#063F40] dark:text-emerald-400 font-semibold"
          >
            <PhoneCall className="w-2.5 h-2.5 inline" />
            <span>Contact Desk</span>
          </button>
        </div>
      </footer>
    </aside>
  );
};

export default ChatbotWidget;
