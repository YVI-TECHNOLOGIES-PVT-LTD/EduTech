import React, { useState } from 'react';
import {
  MessageCircle,
  Share2,
  MoreHorizontal,
  Clock,
  Sparkles,
  BookOpen,
  Users,
  GraduationCap,
  Globe,
  Trash2,
  Send,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { FeedPost, ReactionType } from '../types';
import { SocialFeedReactions } from './SocialFeedReactions';
import { SocialFeedComments } from './SocialFeedComments';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { toast } from 'sonner';

interface SocialFeedCardProps {
  post: FeedPost;
  reactionCatalog: ReactionType[];
  isStaff: boolean;
  onReact: (postId: string, reactionTypeId: string) => Promise<void>;
  onRemoveReaction: (postId: string) => Promise<void>;
  onPublishDraft?: (postId: string) => Promise<void>;
  onRemovePost?: (postId: string) => Promise<void>;
}

export const SocialFeedCard: React.FC<SocialFeedCardProps> = ({
  post,
  reactionCatalog,
  isStaff,
  onReact,
  onRemoveReaction,
  onPublishDraft,
  onRemovePost,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);

  // Author details
  const authorName = post.author?.name || 'School Administration';
  const authorInitials =
    authorName
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'SA';

  // Format creation / published time
  const dateToFormat = post.publishedAt || post.published_at || post.createdAt || post.created_at;
  let relativeTime = 'Recently';
  let formattedFullDate = '';
  try {
    const d = new Date(dateToFormat);
    relativeTime = formatDistanceToNow(d, { addSuffix: true });
    formattedFullDate = format(d, 'PPP p');
  } catch {
    relativeTime = 'Recently';
  }

  // Derive author designation/role
  const getAuthorDesignation = () => {
    if (post.feedType === 'classroom' || post.feed_type === 'classroom') {
      return 'Classroom Faculty';
    }
    if (post.feedType === 'student' || post.feed_type === 'student') {
      return 'Student Affairs';
    }
    if (post.author?.email?.includes('principal')) {
      return 'Principal & Leadership';
    }
    if (post.author?.email?.includes('finance')) {
      return 'Finance Office';
    }
    return 'School Administration';
  };

  // Audience scope badge configuration
  const getAudienceConfig = () => {
    const scope = post.audienceScope || post.audience_scope;
    switch (scope) {
      case 'all_parents':
        return {
          label: 'All Parents',
          icon: <Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
          style:
            'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800',
        };
      case 'selected_academic_groups':
        return {
          label: 'Classroom',
          icon: <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />,
          style:
            'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800',
        };
      case 'selected_students':
        return {
          label: 'Student Spotlight',
          icon: <GraduationCap className="w-3 h-3 text-sky-600 dark:text-sky-400" />,
          style:
            'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800',
        };
      case 'staff_only':
        return {
          label: 'Staff Only',
          icon: <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />,
          style:
            'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800',
        };
      case 'organization':
      default:
        return {
          label: 'School-Wide',
          icon: <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />,
          style:
            'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800',
        };
    }
  };

  const audience = getAudienceConfig();

  // Avatar gradient styles based on author name for consistent visual variety
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-purple-600 to-pink-600',
      'from-emerald-600 to-teal-600',
      'from-amber-600 to-orange-600',
      'from-sky-600 to-cyan-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  };

  // Extract image URL if any inside post content
  const extractImageUrl = (content: string): string | null => {
    // Markdown image ![alt](url)
    const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (mdMatch) return mdMatch[1];

    // Direct image URL
    const urlMatch = content.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|webp|gif))/i);
    if (urlMatch) return urlMatch[1];

    return null;
  };

  const detectedImage = extractImageUrl(post.content || '');
  // Clean content if markdown image is present
  const cleanContent = detectedImage
    ? (post.content || '').replace(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g, '').trim()
    : post.content || '';

  // Content truncation threshold
  const isLongContent = cleanContent.length > 260;
  const displayedContent =
    isLongContent && !isExpanded ? `${cleanContent.slice(0, 260)}...` : cleanContent;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/app/communication/feeds#post-${post.feed_post_id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Announcement link copied to clipboard');
    }
  };

  // Reaction stats
  const totalReactions =
    post.reactionSummary?.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0) ?? 0;

  return (
    <article
      id={`post-${post.feed_post_id}`}
      className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* ─── POST HEADER ────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Author avatar & meta */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                authorName,
              )} text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-800`}
            >
              {authorInitials}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                  {authorName}
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                  •
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {getAuthorDesignation()}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                <span
                  title={formattedFullDate}
                  className="flex items-center gap-1 hover:underline cursor-default"
                >
                  <Clock className="w-3 h-3 text-slate-400" />
                  {relativeTime}
                </span>

                <span>•</span>

                {/* Audience scope badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${audience.style}`}
                >
                  {audience.icon}
                  {audience.label}
                </span>

                {/* Staff Draft/Removed Badge */}
                {post.status !== 'published' && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      post.status === 'draft'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {post.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* More Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                aria-label="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                <Share2 className="w-4 h-4 mr-2 text-slate-500" />
                <span>Copy Post Link</span>
              </DropdownMenuItem>

              {isStaff && post.status === 'draft' && onPublishDraft && (
                <DropdownMenuItem
                  onClick={() => onPublishDraft(post.feed_post_id)}
                  className="cursor-pointer text-emerald-600 focus:text-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <span>Publish Draft</span>
                </DropdownMenuItem>
              )}

              {isStaff && post.status !== 'removed' && onRemovePost && (
                <DropdownMenuItem
                  onClick={() => onRemovePost(post.feed_post_id)}
                  className="cursor-pointer text-rose-600 focus:text-rose-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span>Remove Announcement</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Academic targets chips (e.g. Grade 4 - Section A) */}
        {(post.academicYearGradeTargets?.length > 0 || post.sectionTargets?.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
            {post.academicYearGradeTargets.map((gt) => (
              <span
                key={gt.academicYearGradeId}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5"
              >
                Grade: {gt.gradeName || 'Assigned Grade'}
              </span>
            ))}
            {post.sectionTargets.map((st) => (
              <span
                key={st.sectionId}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5"
              >
                Section: {st.sectionName || 'Assigned Section'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── POST CONTENT ────────────────────────────────────────── */}
      <div className="px-4 sm:px-5 pb-3">
        {post.title && (
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
            {post.title}
          </h2>
        )}

        <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
          {displayedContent}
        </div>

        {isLongContent && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1 inline-block focus:outline-none"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Embedded Image Attachment */}
      {detectedImage && (
        <div className="mt-2 mb-3 px-4 sm:px-5">
          <div className="relative rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 max-h-96 bg-slate-100 dark:bg-slate-800">
            <img
              src={detectedImage}
              alt={post.title || 'Post attachment'}
              className="w-full h-auto object-cover max-h-96 hover:scale-101 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* ─── ENGAGEMENT COUNTS ROW ────────────────────────────────── */}
      {(totalReactions > 0 || commentCount > 0) && (
        <div className="mx-4 sm:mx-5 py-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {/* Reaction icons breakdown */}
          <div className="flex items-center gap-1.5">
            {post.reactionSummary?.length > 0 ? (
              <div className="flex items-center -space-x-1">
                {post.reactionSummary
                  .filter((r) => r.count > 0)
                  .map((r) => (
                    <span
                      key={r.reactionTypeId}
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs shadow-xs ring-1 ring-white dark:ring-slate-900"
                      title={`${r.reactionLabel}: ${r.count}`}
                    >
                      {r.emoji}
                    </span>
                  ))}
              </div>
            ) : null}
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {totalReactions > 0
                ? `${totalReactions} ${totalReactions === 1 ? 'reaction' : 'reactions'}`
                : ''}
            </span>
          </div>

          {/* Comment count link */}
          {commentCount > 0 && (
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
            >
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* ─── ACTION BUTTONS BAR ──────────────────────────────────── */}
      <div className="px-3 sm:px-4 py-1.5 border-t border-slate-100 dark:border-white/5 flex items-center gap-1">
        {/* Real Reaction Control with Floating Picker */}
        <SocialFeedReactions
          postId={post.feed_post_id}
          reactionsEnabled={post.reactionsEnabled ?? post.reactions_enabled}
          reactionSummary={post.reactionSummary || []}
          currentUserReactionId={post.currentUserReaction}
          reactionCatalog={reactionCatalog}
          onReact={onReact}
          onRemoveReaction={onRemoveReaction}
        />

        {/* Comment Action Toggle */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-colors select-none ${
            showComments
              ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>

        {/* Share Action */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors select-none"
          title="Share announcement link"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* ─── INLINE COMMENTS SECTION ─────────────────────────────── */}
      {showComments && (
        <div className="bg-slate-50/70 dark:bg-slate-950/40 px-4 sm:px-5 pb-4">
          <SocialFeedComments
            postId={post.feed_post_id}
            commentsEnabled={post.commentsEnabled ?? post.comments_enabled}
            isStaff={isStaff}
            onCommentCountChange={(newCount) => setCommentCount(newCount)}
          />
        </div>
      )}
    </article>
  );
};

export default SocialFeedCard;
