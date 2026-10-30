import React from 'react';

export const SocialFeedSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4 animate-pulse"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-1.5">
                <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="w-20 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
            </div>
            <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>

          {/* Title & Content */}
          <div className="space-y-2">
            <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="w-5/6 h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>

          {/* Footer counts */}
          <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="flex-1 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="flex-1 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SocialFeedSkeleton;
