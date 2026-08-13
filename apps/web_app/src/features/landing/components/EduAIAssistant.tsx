import React from 'react';
import { Bot, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EduAIAssistantProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const EduAIAssistant: React.FC<EduAIAssistantProps> = ({ isOpen, onOpen, onClose }) => {
  if (!isOpen) {
    return (
      <button
        onClick={onOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-transform border border-indigo-400/30"
        title="EduAI Concierge"
      >
        <Bot className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
      <div className="bg-indigo-950 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs">EduAI Admissions Assistant</h4>
            <p className="text-[10px] text-indigo-300">24/7 AI Concierge</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-indigo-900 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-muted/50 h-64 overflow-y-auto space-y-3 text-xs">
        <div className="p-3 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Hello! I am EduAI Concierge. How can I assist with your child's admission enquiry today?
          </p>
        </div>
      </div>

      <div className="p-3 bg-white dark:bg-card border-t border-slate-200 dark:border-border">
        <Button onClick={onClose} variant="outline" className="w-full text-xs font-bold rounded-xl">
          Close Chat
        </Button>
      </div>
    </div>
  );
};

export default EduAIAssistant;
