import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Heart,
  Users,
  Info,
  CheckCircle2,
  Calendar,
  School,
  BookOpen,
} from 'lucide-react';
import { EnrolledChild, ReactionType, FeedPost } from '../types';

interface SocialFeedRightSidebarProps {
  tenantName?: string;
  isParent: boolean;
  childrenList: EnrolledChild[];
  selectedChildId: string | null;
  onSelectChild: (childId: string | null) => void;
  reactionCatalog: ReactionType[];
  posts: FeedPost[];
}

export const SocialFeedRightSidebar: React.FC<SocialFeedRightSidebarProps> = ({
  tenantName = 'Greenwood High School',
  isParent,
  childrenList,
  selectedChildId,
  onSelectChild,
  reactionCatalog,
  posts,
}) => {
  // Compute genuine statistics from actual loaded posts
  const totalPosts = posts.length;
  const totalReactions = posts.reduce(
    (sum, p) =>
      sum + (p.reactionSummary?.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0) ?? 0),
    0,
  );
  const totalComments = posts.reduce((sum, p) => sum + (Number(p.commentCount) || 0), 0);

  return (
    <aside className="space-y-4">
      {/* ─── 1. SCHOOL COMMUNITY IDENTITY CARD ──────────────────── */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {tenantName}
              </h3>
              <span title="Verified Institutional Portal">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Official School Community
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
          Welcome to your school community feed. Stay informed with official updates, circulars, and
          classroom announcements directly from school leadership and teachers.
        </p>

        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Verified notices & announcements</span>
        </div>
      </div>

      {/* ─── 2. ENROLLED CHILDREN QUICK CONTEXT (PARENTS ONLY) ─── */}
      {isParent && childrenList.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                My Enrolled Students
              </h4>
            </div>
            {selectedChildId && (
              <button
                type="button"
                onClick={() => onSelectChild(null)}
                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="space-y-2">
            {childrenList.map((child) => {
              const isSelected = selectedChildId === child.student_id;
              const childName = `${child.first_name} ${child.last_name}`.trim();
              const gradeSection = [child.grade, child.section ? `Sec ${child.section}` : '']
                .filter(Boolean)
                .join(' • ');

              return (
                <button
                  key={child.student_id}
                  type="button"
                  onClick={() => onSelectChild(isSelected ? null : child.student_id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 shadow-xs'
                      : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950 dark:group-hover:text-indigo-400'
                      }`}
                    >
                      {child.first_name?.[0] || 'S'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {childName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {gradeSection || 'Enrolled Student'}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 shrink-0">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 3. LIVE FEED ACTIVITY HIGHLIGHTS (GENUINE DATA) ────── */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Feed Activity
        </h4>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5">
            <span className="block text-base font-bold text-slate-900 dark:text-white">
              {totalPosts}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Updates</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5">
            <span className="block text-base font-bold text-slate-900 dark:text-white">
              {totalReactions}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Reactions</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5">
            <span className="block text-base font-bold text-slate-900 dark:text-white">
              {totalComments}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Comments</span>
          </div>
        </div>
      </div>

      {/* ─── 4. REACTION TYPES KEY ──────────────────────────────── */}
      {reactionCatalog.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            Interactive Reactions
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
            Express support on school updates with verified reaction types:
          </p>

          <div className="flex flex-wrap gap-1.5">
            {reactionCatalog.map((r) => (
              <span
                key={r.reactionTypeId || r.reaction_type_id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-200"
              >
                <span>{r.emoji}</span>
                <span className="font-medium text-[11px]">
                  {r.reactionLabel || r.reaction_label}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── 5. COMMUNITY GUIDELINES ─────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-indigo-700 dark:text-indigo-300">
          <Info className="w-4 h-4 shrink-0" />
          <span>Community Guidelines</span>
        </div>
        <p className="text-[11px] leading-relaxed text-indigo-800/80 dark:text-indigo-300/80">
          We encourage active participation, constructive feedback, and mutual respect. Please keep
          all comments relevant to classroom education and student growth.
        </p>
      </div>
    </aside>
  );
};

export default SocialFeedRightSidebar;
