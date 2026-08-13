import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AnnouncementBarProps {
  onApplyClick?: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onApplyClick }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white text-xs py-2 px-4 text-center flex items-center justify-center space-x-2 border-b border-indigo-700/50">
      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
      <span className="font-medium">Admissions Open for Academic Year 2026-27</span>
      <button
        onClick={onApplyClick}
        className="ml-2 font-bold underline hover:text-amber-300 inline-flex items-center space-x-1 transition-colors"
      >
        <span>Apply Now</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};

export default AnnouncementBar;
