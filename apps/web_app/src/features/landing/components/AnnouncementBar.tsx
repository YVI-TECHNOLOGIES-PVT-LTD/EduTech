import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AnnouncementBarProps {
  onApplyClick?: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onApplyClick }) => {
  return (
    <div className="bg-[#042A2B] text-emerald-100 text-xs py-2 px-4 text-center flex items-center justify-center space-x-2 border-b border-white/10">
      <Sparkles className="w-3.5 h-3.5 text-[#E7B76A] shrink-0" />
      <span className="font-medium tracking-wide">Admissions Open for Academic Year 2026-27</span>
      <button
        onClick={onApplyClick}
        className="ml-2 font-bold text-[#E7B76A] hover:text-white inline-flex items-center space-x-1 transition-colors"
      >
        <span>Apply Now</span>
        <ArrowRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );
};

export default AnnouncementBar;

