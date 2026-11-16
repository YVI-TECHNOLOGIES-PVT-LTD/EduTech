import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp } from 'lucide-react';
import { ReactionType, ReactionSummaryItem } from '../types';

interface SocialFeedReactionsProps {
  postId: string;
  reactionsEnabled: boolean;
  reactionSummary: ReactionSummaryItem[];
  currentUserReactionId: string | null;
  reactionCatalog: ReactionType[];
  onReact: (postId: string, reactionTypeId: string) => Promise<void>;
  onRemoveReaction: (postId: string) => Promise<void>;
  loading?: boolean;
}

export const SocialFeedReactions: React.FC<SocialFeedReactionsProps> = ({
  postId,
  reactionsEnabled,
  reactionSummary,
  currentUserReactionId,
  reactionCatalog,
  onReact,
  onRemoveReaction,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (!reactionsEnabled) return;
    if (pickerTimerRef.current) clearTimeout(pickerTimerRef.current);
    pickerTimerRef.current = setTimeout(() => {
      setShowPicker(true);
    }, 250);
  };

  const handleMouseLeave = () => {
    if (pickerTimerRef.current) clearTimeout(pickerTimerRef.current);
    pickerTimerRef.current = setTimeout(() => {
      setShowPicker(false);
    }, 300);
  };

  // Find active reaction
  const activeReaction = reactionCatalog.find(
    (r) => (r.reactionTypeId || r.reaction_type_id) === currentUserReactionId,
  );

  // Default "Like" reaction in catalog
  const defaultLikeReaction =
    reactionCatalog.find((r) => r.reactionCode === 'like' || r.reaction_code === 'like') ||
    reactionCatalog[0];

  const handleMainButtonClick = async () => {
    if (!reactionsEnabled) return;
    if (currentUserReactionId) {
      // Toggle off if already reacted
      await onRemoveReaction(postId);
    } else if (defaultLikeReaction) {
      // React with default Like
      const reactionTypeId =
        defaultLikeReaction.reactionTypeId || defaultLikeReaction.reaction_type_id!;
      await onReact(postId, reactionTypeId);
    }
  };

  const handleSelectReaction = async (r: ReactionType) => {
    setShowPicker(false);
    const reactionTypeId = r.reactionTypeId || r.reaction_type_id!;
    if (reactionTypeId === currentUserReactionId) {
      // Clicking same reaction removes it
      await onRemoveReaction(postId);
    } else {
      await onReact(postId, reactionTypeId);
    }
  };

  if (!reactionsEnabled) {
    return (
      <button
        disabled
        className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
        title="Reactions are disabled for this announcement"
      >
        <ThumbsUp className="w-4 h-4" />
        <span>Reactions Disabled</span>
      </button>
    );
  }

  // Get color styles for active reaction
  const getReactionTextStyle = (code?: string) => {
    switch (code) {
      case 'love':
        return 'text-rose-600 dark:text-rose-400 font-semibold';
      case 'celebrate':
        return 'text-amber-600 dark:text-amber-400 font-semibold';
      case 'support':
        return 'text-indigo-600 dark:text-indigo-400 font-semibold';
      case 'insightful':
        return 'text-emerald-600 dark:text-emerald-400 font-semibold';
      case 'like':
      default:
        return 'text-blue-600 dark:text-blue-400 font-semibold';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Reaction Bar (Facebook / LinkedIn Style) */}
      {showPicker && reactionCatalog.length > 0 && (
        <div
          role="menu"
          aria-label="Reaction picker"
          className="absolute -top-12 left-0 z-30 flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200/80 dark:border-white/10 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          {reactionCatalog.map((r) => {
            const rId = r.reactionTypeId || r.reaction_type_id!;
            const isSelected = rId === currentUserReactionId;
            return (
              <button
                key={rId}
                type="button"
                onClick={() => handleSelectReaction(r)}
                className={`group/emoji relative p-1.5 text-xl leading-none transition-transform duration-200 hover:scale-135 focus:outline-none ${
                  isSelected ? 'scale-120 bg-slate-100 dark:bg-slate-700 rounded-full' : ''
                }`}
                title={r.reactionLabel || r.reaction_label}
              >
                <span className="inline-block transition-transform duration-150 group-hover/emoji:-translate-y-1">
                  {r.emoji}
                </span>
                <span className="sr-only">{r.reactionLabel || r.reaction_label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={handleMainButtonClick}
        className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-150 select-none ${
          currentUserReactionId
            ? 'bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        {activeReaction ? (
          <>
            <span className="text-base leading-none animate-in zoom-in-75 duration-150">
              {activeReaction.emoji}
            </span>
            <span
              className={getReactionTextStyle(
                activeReaction.reactionCode || activeReaction.reaction_code,
              )}
            >
              {activeReaction.reactionLabel || activeReaction.reaction_label}
            </span>
          </>
        ) : (
          <>
            <ThumbsUp className="w-4 h-4 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 transition-colors" />
            <span>React</span>
          </>
        )}
      </button>
    </div>
  );
};

export default SocialFeedReactions;
