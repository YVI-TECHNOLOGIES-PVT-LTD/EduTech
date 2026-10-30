import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  ThumbsUp,
  MessageCircle,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

const GLASS_CARD =
  'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm transition-all';

export const FinanceCommunicationFeeds: React.FC = () => {
  const { user } = useAuth();
  const rawRoles = (user?.roles || []).map((r: string) =>
    String(r)
      .toUpperCase()
      .replace(/[\s-]+/g, '_'),
  );
  const isManagement = rawRoles.some((r) =>
    [
      'ADMIN',
      'ADMINISTRATOR',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
    ].includes(r),
  );
  const isTeacher = rawRoles.some((r) => ['TEACHER', 'FACULTY'].includes(r));
  const isFinance = rawRoles.some((r) =>
    ['FINANCE', 'FINANCE_OFFICER', 'FINANCE_MANAGER', 'ACCOUNTANT', 'BURSAR'].includes(r),
  );
  const isFrontOffice = rawRoles.some((r) =>
    [
      'FRONT_OFFICE',
      'FO',
      'RECEPTIONIST',
      'ADMISSION_OFFICER',
      'ADMISSIONS_OFFICER',
      'COUNSELLOR',
      'COUNSELOR',
    ].includes(r),
  );

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // New post form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [feedType, setFeedType] = useState(isTeacher ? 'classroom' : 'parent');
  const [audienceScope, setAudienceScope] = useState(
    isTeacher ? 'selected_academic_groups' : 'organization',
  );
  const [status, setStatus] = useState('published');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const query = filterType !== 'all' ? `?feed_type=${filterType}` : '';
      const res: any = await apiClient.get(`/fees/communication/posts${query}`);
      const list = Array.isArray(res.data?.posts)
        ? res.data.posts
        : Array.isArray(res.data?.data?.posts)
          ? res.data.data.posts
          : Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
              ? res.data
              : [];
      setPosts(list);
    } catch (err: any) {
      console.error('Failed to fetch posts:', err);
      toast.error('Failed to load feed announcements');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/fees/communication/posts', {
        title: title.trim() || undefined,
        content: content.trim(),
        feed_type: feedType,
        audience_scope: audienceScope,
        status,
        comments_enabled: commentsEnabled,
        reactions_enabled: reactionsEnabled,
      });

      toast.success('Post created successfully');
      setShowCreateModal(false);
      setTitle('');
      setContent('');
      fetchPosts();
    } catch (err: any) {
      console.error('Failed to create post:', err);
      toast.error(err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await apiClient.patch(`/fees/communication/posts/${id}/publish`);
      toast.success('Post published');
      fetchPosts();
    } catch (err: any) {
      toast.error('Failed to publish post');
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this post?')) return;
    try {
      await apiClient.delete(`/fees/communication/posts/${id}`);
      toast.success('Post removed');
      fetchPosts();
    } catch (err: any) {
      toast.error('Failed to remove post');
    }
  };

  const handleViewComments = async (post: any) => {
    setSelectedPost(post);
    try {
      const res: any = await apiClient.get(
        `/fees/communication/posts/${post.feed_post_id}/comments`,
      );
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setComments(list);
    } catch (err) {
      toast.error('Failed to load comments');
      setComments([]);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPost) return;

    try {
      setSubmittingComment(true);
      await apiClient.post(`/fees/communication/posts/${selectedPost.feed_post_id}/comments`, {
        comment: newComment.trim(),
      });
      setNewComment('');
      toast.success('Comment added');
      // Refresh comments
      const res: any = await apiClient.get(
        `/fees/communication/posts/${selectedPost.feed_post_id}/comments`,
      );
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setComments(list);
    } catch (err: any) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Announcements & Feeds
            </h1>
            {isManagement && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200">
                School-Wide Publisher
              </span>
            )}
            {isTeacher && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200">
                Classroom & Academic
              </span>
            )}
            {isFinance && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                Finance & Fee Updates
              </span>
            )}
            {isFrontOffice && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">
                Front Office Notices
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publish school announcements, finance alerts, and engagement updates to parents and
            staff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPosts}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
        {['all', 'parent', 'classroom', 'student', 'staff_community'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
              filterType === t
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading announcements...</div>
      ) : !Array.isArray(posts) || posts.length === 0 ? (
        <div className={`${GLASS_CARD} p-12 text-center`}>
          <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No announcements found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create an announcement to share updates with parents or staff.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((p) => (
            <div key={p.feed_post_id} className={`${GLASS_CARD} p-5 flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {p.feed_type} • {p.audience_scope}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      p.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : p.status === 'draft'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                {p.title && (
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                    {p.title}
                  </h3>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-4">
                  {p.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {p._count?.feed_post_reactions ?? p.feed_post_reactions?.length ?? 0}
                  </span>
                  <button
                    onClick={() => handleViewComments(p)}
                    className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {p._count?.feed_comments ?? p.feed_comments?.length ?? 0} Comments
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {p.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(p.feed_post_id)}
                      className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                      Publish
                    </button>
                  )}
                  {p.status !== 'removed' && (
                    <button
                      onClick={() => handleRemove(p.feed_post_id)}
                      className="p-1 text-rose-600 hover:text-rose-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-white/10 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Create New Announcement
            </h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-white/10 dark:text-white text-sm"
                  placeholder="e.g., Q2 Fee Due Reminder"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Content *
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-white/10 dark:text-white text-sm"
                  placeholder="Write the announcement message..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Feed Type
                  </label>
                  <select
                    value={feedType}
                    onChange={(e) => setFeedType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-white/10 dark:text-white text-sm"
                  >
                    <option value="parent">Parent</option>
                    <option value="classroom">Classroom</option>
                    <option value="student">Student</option>
                    <option value="staff_community">Staff Community</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Audience Scope
                  </label>
                  <select
                    value={audienceScope}
                    onChange={(e) => setAudienceScope(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-white/10 dark:text-white text-sm"
                  >
                    <option value="organization">Entire Organization</option>
                    <option value="all_parents">All Parents</option>
                    <option value="staff_only">Staff Only</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={commentsEnabled}
                    onChange={(e) => setCommentsEnabled(e.target.checked)}
                  />
                  <span>Allow Comments</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reactionsEnabled}
                    onChange={(e) => setReactionsEnabled(e.target.checked)}
                  />
                  <span>Allow Reactions</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                >
                  {submitting ? 'Creating...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Drawer / Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Comments ({comments.length})
              </h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                Close
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {!Array.isArray(comments) || comments.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">No comments yet.</div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.comment_id}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs"
                  >
                    <p className="text-slate-800 dark:text-slate-200">{c.comment}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-1.5 text-xs border rounded-xl dark:bg-slate-800 dark:border-white/10 dark:text-white"
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-xl font-medium"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceCommunicationFeeds;
