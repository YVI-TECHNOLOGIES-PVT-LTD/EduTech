import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { ANNOUNCEMENT_DATA } from '../data/landing-content';

interface AnnouncementBarProps {
  onApplyClick?: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onApplyClick }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative z-50 border-b border-slate-800/60 text-xs sm:text-sm py-2 px-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
            <span className="hidden sm:inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {ANNOUNCEMENT_DATA.badgeText}
            </span>
            <p className="font-medium text-slate-200 text-xs sm:text-sm leading-tight sm:truncate text-center sm:text-left">
              {ANNOUNCEMENT_DATA.message}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onApplyClick ? (
              <button
                onClick={onApplyClick}
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold text-xs transition-colors py-1 px-1.5 rounded"
              >
                <span>{ANNOUNCEMENT_DATA.ctaText}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <Link
                to={ANNOUNCEMENT_DATA.ctaLink || '/admissions/apply'}
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold text-xs transition-colors py-1 px-1.5 rounded"
              >
                <span>{ANNOUNCEMENT_DATA.ctaText}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}

            {ANNOUNCEMENT_DATA.isDismissible && (
              <button
                onClick={() => setIsVisible(false)}
                aria-label="Dismiss announcement"
                className="text-slate-400 hover:text-white p-1.5 rounded-md transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementBar;
