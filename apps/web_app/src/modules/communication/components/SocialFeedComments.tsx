import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, MessageCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';
import { FeedComment } from '../types';
import { toast } from 'sonner';

interface SocialFeedCommentsProps {
  postId: string;
  commentsEnabled: boolean;
  isStaff: boolean;
  onCommentCountChange?: (newCount: number) => void;
}

export const SocialFeedComments: React.FC<SocialFeedCommentsProps> = ({
  postId,
  commentsEnabled,
  isStaff,
  onCommentCountChange,
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch comments
  useEffect(() => {
    let isMounted = true;
    const fetchComments = async () => {
      try {
        setLoading(true);
        const res: any = await apiClient.get(`/communication/feeds/${postId}/comments`);
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        if (isMounted) {
          setComments(list);
          onCommentCountChange?.(list.length);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchComments();
    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || submitting || !commentsEnabled) return;

    try {
      setSubmitting(true);
      const res: any = await apiClient.post(`/communication/feeds/${postId}/comments`, {
        content,
      });

      const created: FeedComment = res.data?.data || res.data;
      const updatedList = [...comments, created];
      setComments(updatedList);
      setNewComment('');
      onCommentCountChange?.(updatedList.length);
      toast.success('Comment posted');
    } catch (err: any) {
      console.error('Failed to add comment:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!commentId || deletingId) return;
    try {
      setDeletingId(commentId);
      await apiClient.delete(`/communication/comments/${commentId}`);
      const updatedList = comments.filter((c) => (c.commentId || c.feed_comment_id) !== commentId);
      setComments(updatedList);
      onCommentCountChange?.(updatedList.length);
      toast.success('Comment deleted');
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  };

  const getAuthorInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getAuthorInitials(
    user?.full_name ||
      ((user as any)?.first_name
        ? `${(user as any).first_name} ${(user as any).last_name || ''}`
        : user?.email),
  );

  return (
    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5 animate-in fade-in duration-200">
      {/* Existing Comments List */}
      {loading ? (
        <div className="py-4 space-y-2">
          <div className="flex gap-2.5 items-start animate-pulse">
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-3/4 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-4 text-center">
          <MessageCircle className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No comments yet. Join the conversation and share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const commentId = comment.commentId || comment.feed_comment_id || '';
            const authorName = comment.author?.name || 'School Community';
            const isAuthor =
              (comment.author?.userId || (comment as any).author_user_id) === user?.id;
            const canDelete = isAuthor || isStaff;

            let formattedTime = 'Just now';
            try {
              if (comment.createdAt) {
                formattedTime = formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                });
              }
            } catch {
              formattedTime = 'Recently';
            }

            return (
              <div key={commentId} className="flex gap-2.5 items-start group">
                {/* Commenter Avatar */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-white/10 shadow-xs">
                  {getAuthorInitials(authorName)}
                </div>

                {/* Comment Bubble */}
                <div className="flex-1 min-w-0">
                  <div className="inline-block bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 rounded-2xl max-w-full transition-colors border border-slate-200/50 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {authorName}
                      </span>
                      {isAuthor && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                      {comment.content}
                    </p>
                  </div>

                  {/* Comment meta footer */}
                  <div className="flex items-center gap-2.5 mt-1 ml-1 text-[10px] text-slate-400">
                    <span>{formattedTime}</span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(commentId)}
                        disabled={deletingId === commentId}
                        className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity font-medium flex items-center gap-1 focus:opacity-100"
                        title={isAuthor ? 'Delete your comment' : 'Moderate / Delete comment'}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comment Input Composer */}
      {commentsEnabled ? (
        <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
            {userInitials}
          </div>
          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              disabled={submitting}
              className="w-full pl-3.5 pr-10 py-1.5 text-xs bg-slate-100/90 dark:bg-slate-800/90 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 rounded-full transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className={`absolute right-1.5 p-1 rounded-full text-white transition-all ${
                newComment.trim() && !submitting
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xs'
                  : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-50'
              }`}
              title="Post comment"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 text-slate-500 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Comments are disabled for this announcement.</span>
        </div>
      )}
    </div>
  );
};

export default SocialFeedComments;
