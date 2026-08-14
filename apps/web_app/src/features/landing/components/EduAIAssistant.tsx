import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, X, Sparkles, FileText, ArrowRight, HelpCircle, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EduAIAssistantProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const EduAIAssistant: React.FC<EduAIAssistantProps> = ({ isOpen, onOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) {
    return (
      <button
        onClick={onOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#063F40] text-[#E7B76A] flex items-center justify-center shadow-2xl hover:scale-105 transition-transform border border-[#E7B76A]/40"
        title="EduAI Concierge"
        aria-label="Open Admissions Concierge"
      >
        <Bot className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E7B76A] border-2 border-white animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div className="bg-[#042A2B] text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E7B76A] text-[#063F40] flex items-center justify-center font-black shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs tracking-tight">EduAI Admissions Concierge</h4>
            <p className="text-[10px] text-emerald-200/80">Fast Navigation & Help Desk</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          aria-label="Close Assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 bg-muted/40 max-h-72 overflow-y-auto space-y-3 text-xs">
        <div className="p-3 bg-card border border-border/80 rounded-xl space-y-1.5">
          <p className="font-bold text-foreground">
            Welcome to EduTrack! How can we assist you with admissions today?
          </p>
          <p className="text-[11px] text-muted-foreground">
            Select a quick action below to navigate to key admission services:
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              onClose();
              navigate('/enquiry');
            }}
            className="w-full p-2.5 bg-card hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-border/80 rounded-xl text-left font-bold text-[#063F40] dark:text-emerald-300 flex items-center justify-between transition-colors shadow-xs"
          >
            <span className="flex items-center space-x-2">
              <FileText className="w-3.5 h-3.5 text-[#063F40] dark:text-emerald-400" />
              <span>Submit Admission Enquiry</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#063F40]" />
          </button>

          <Button
            onClick={() => {
              onClose();
              navigate('/admission/register');
            }}
            className="w-full h-10 p-2.5 text-xs font-bold rounded-xl bg-[#E7B76A] hover:bg-[#d8a658] text-[#063F40] flex items-center justify-between shadow-xs"
          >
            <span className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-[#063F40]" />
              <span>Apply for New Admission</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#063F40]" />
          </Button>

          <button
            onClick={() => {
              onClose();
              navigate('/contact');
            }}
            className="w-full p-2.5 bg-card hover:bg-muted/80 border border-border/80 rounded-xl text-left font-bold text-foreground flex items-center justify-between transition-colors shadow-sm"
          >
            <span className="flex items-center space-x-2">
              <PhoneCall className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Contact Admissions Desk</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="p-3 bg-card border-t border-border/80">
        <Button onClick={onClose} variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl">
          Minimize Assistant
        </Button>
      </div>
    </div>
  );
};

export default EduAIAssistant;
