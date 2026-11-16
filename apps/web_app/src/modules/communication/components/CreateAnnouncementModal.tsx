import React, { useState } from 'react';
import { X, Sparkles, Send, Globe, Users, BookOpen, GraduationCap } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { toast } from 'sonner';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  isTeacher: boolean;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  isTeacher,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [feedType, setFeedType] = useState(isTeacher ? 'classroom' : 'parent');
  const [audienceScope, setAudienceScope] = useState(
    isTeacher ? 'selected_academic_groups' : 'organization',
  );
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Announcement message cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/communication/feeds', {
        title: title.trim() || undefined,
        content: content.trim(),
        feed_type: feedType,
        audience_scope: audienceScope,
        status,
        comments_enabled: commentsEnabled,
        reactions_enabled: reactionsEnabled,
      });

      toast.success(
        status === 'published'
          ? 'Announcement published to community!'
          : 'Draft announcement saved',
      );
      setTitle('');
      setContent('');
      onCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create post:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                New School Announcement
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share updates with parents, classrooms, or the school community
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Headline / Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 border rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all"
              placeholder="e.g. Science Fair 2026 Guidelines & Schedule"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Announcement Message *
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all leading-relaxed"
              placeholder="Write the full announcement text. You may also include image links..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Feed Channel
              </label>
              <select
                value={feedType}
                onChange={(e) => setFeedType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="parent">Parent Bulletin</option>
                <option value="classroom">Classroom Update</option>
                <option value="student">Student Recognition</option>
                <option value="staff_community">Staff Community</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Audience Scope
              </label>
              <select
                value={audienceScope}
                onChange={(e) => setAudienceScope(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="organization">School-Wide (Everyone)</option>
                <option value="all_parents">All Parents</option>
                <option value="selected_academic_groups">Classroom & Grades</option>
                <option value="staff_only">Staff Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reactionsEnabled"
                checked={reactionsEnabled}
                onChange={(e) => setReactionsEnabled(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="reactionsEnabled"
                className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
              >
                Allow Reactions
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="commentsEnabled"
                checked={commentsEnabled}
                onChange={(e) => setCommentsEnabled(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="commentsEnabled"
                className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
              >
                Allow Comments
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus(status === 'published' ? 'draft' : 'published')}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  status === 'draft'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-400'
                }`}
              >
                Save as {status === 'draft' ? 'Draft (Selected)' : 'Draft'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {submitting
                    ? 'Submitting...'
                    : status === 'draft'
                      ? 'Save Draft'
                      : 'Publish Announcement'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;
