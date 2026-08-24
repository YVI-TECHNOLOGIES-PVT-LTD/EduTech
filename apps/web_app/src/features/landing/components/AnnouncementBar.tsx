import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'edutrack-admissions-announcement-dismissed-v1';

interface AnnouncementBarProps {
  onApplyClick?: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onApplyClick }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) {
          setIsDismissed(false);
          // Trigger entry transition smoothly
          requestAnimationFrame(() => setIsVisible(true));
        }
      }
    } catch {
      setIsDismissed(false);
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsDismissed(true);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, 'true');
        }
      } catch {}
    }, 280);
  };

  const handleApply = () => {
    if (onApplyClick) {
      onApplyClick();
    } else {
      navigate('/admission/register');
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Admissions Announcement"
      className={`relative z-50 bg-[#042A2B] text-white text-xs border-b border-white/10 transition-all duration-300 ease-in-out overflow-hidden ${
        isVisible
          ? 'max-h-20 opacity-100 translate-y-0'
          : 'max-h-0 opacity-0 -translate-y-2 py-0 border-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        {/* Centered / Flow Content */}
        <div className="flex-1 flex items-center justify-center gap-2 flex-wrap text-center">
          <div className="flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#E7B76A] shrink-0" />
            <span className="font-semibold text-emerald-50 tracking-wide text-[11px] sm:text-xs">
              Admissions Open for Academic Year 2026–27
            </span>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="group font-bold text-[#E7B76A] hover:text-white inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E7B76A] text-[11px] sm:text-xs cursor-pointer"
          >
            <span>Apply Now</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          title="Dismiss announcement"
          className="shrink-0 p-1 rounded-md text-emerald-200/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E7B76A] cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};

export default AnnouncementBar;
