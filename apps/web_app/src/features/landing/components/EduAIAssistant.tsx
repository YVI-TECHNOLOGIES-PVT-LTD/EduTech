import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEduAI } from '../hooks/useEduAI';

interface EduAIAssistantProps {
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export const EduAIAssistant: React.FC<EduAIAssistantProps> = ({
  isOpen: externalIsOpen,
  onOpen: externalOnOpen,
  onClose: externalOnClose,
}) => {
  const { messages, suggestedPrompts, isTyping, sendMessage } = useEduAI();
  const [inputText, setInputText] = useState('');
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Controlled or uncontrolled open state (defaults to false)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleOpen = () => {
    if (externalOnOpen) {
      externalOnOpen();
    } else {
      setInternalIsOpen(true);
    }
  };

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {!isOpen ? (
        /* CLOSED STATE: Small Floating Launcher Button */
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={handleOpen}
          aria-label="Open EduAI Concierge"
          className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-full shadow-2xl border border-indigo-500/40 hover:scale-105 transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-amber-300 flex items-center justify-center font-bold shrink-0">
            <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="text-left pr-1">
            <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1">
              <span>Ask EduAI</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-[10px] text-slate-300 font-medium leading-none">
              Admissions Concierge
            </div>
          </div>
        </motion.button>
      ) : (
        /* OPEN STATE: Compact Floating Chat Box (Bottom-Right, No Overlay) */
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[380px] h-[520px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden text-slate-900"
          >
            {/* Widget Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-amber-300 flex items-center justify-center font-bold shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm font-display flex items-center gap-1.5">
                    <span>EduAI Concierge</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                      Online
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Admissions Assistant
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                aria-label="Close EduAI"
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white font-medium rounded-br-xs shadow-sm'
                        : msg.sender === 'system'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-bl-xs'
                        : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 bg-white text-slate-500 text-xs px-3 py-2 rounded-xl border border-slate-200 w-fit shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Questions */}
            {suggestedPrompts.length > 0 && (
              <div className="p-2.5 bg-white border-t border-slate-100 flex flex-wrap gap-1.5 shrink-0 max-h-24 overflow-y-auto">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handlePromptClick(prompt)}
                    className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 text-slate-700 font-semibold px-2.5 py-1 rounded-full border border-slate-200/80 transition-colors text-left cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask EduAI..."
                className="text-xs h-9 focus-visible:ring-indigo-900"
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold h-9 px-3 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default EduAIAssistant;
