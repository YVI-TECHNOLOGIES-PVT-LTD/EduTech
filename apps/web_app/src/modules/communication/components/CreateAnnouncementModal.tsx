import React, { useState, useRef } from 'react';
import { X, Sparkles, Send, Image as ImageIcon, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { toast } from 'sonner';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  isTeacher: boolean;
}

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > MAX_ATTACHMENTS) {
      toast.error(`A post can have at most ${MAX_ATTACHMENTS} image attachments.`);
      return;
    }

    const newValidFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      // Size check
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 10 MB file size limit.`);
        continue;
      }

      // MIME check
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        toast.error(
          `"${file.name}" is not an accepted format. Only JPEG, PNG, and WebP are allowed.`,
        );
        continue;
      }

      newValidFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...newValidFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);

    // Reset input so re-selecting same file triggers event
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      // Revoke preview URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const cleanupPreviews = () => {
    filePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  const handleClose = () => {
    if (!submitting) {
      cleanupPreviews();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Announcement message cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgressText('Creating announcement...');

      // 1. Create post
      const createRes = await apiClient.post<{ success: boolean; data: any }>(
        '/communication/feeds',
        {
          title: title.trim() || undefined,
          content: content.trim(),
          feed_type: feedType,
          audience_scope: audienceScope,
          status,
          comments_enabled: commentsEnabled,
          reactions_enabled: reactionsEnabled,
        },
      );

      const postData = createRes.data?.data || createRes.data;
      const newPostId = postData?.feedPostId || postData?.feed_post_id;

      // 2. Upload attachments if selected
      if (newPostId && selectedFiles.length > 0) {
        let uploadSuccessCount = 0;
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setUploadProgressText(`Uploading image ${i + 1} of ${selectedFiles.length}...`);

          const formData = new FormData();
          formData.append('file', file);
          formData.append('caption', file.name.replace(/\.[^/.]+$/, ''));

          try {
            await apiClient.post(`/communication/feeds/${newPostId}/attachments`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            uploadSuccessCount++;
          } catch (uploadErr: any) {
            console.error(`Failed uploading attachment ${file.name}:`, uploadErr);
            toast.error(
              `Failed to upload "${file.name}": ${uploadErr.response?.data?.message || uploadErr.message}`,
            );
          }
        }

        if (uploadSuccessCount === selectedFiles.length) {
          toast.success(
            status === 'published'
              ? 'Announcement and all images published!'
              : 'Draft announcement and images saved!',
          );
        } else {
          toast.warning(
            `Announcement saved with ${uploadSuccessCount} of ${selectedFiles.length} images.`,
          );
        }
      } else {
        toast.success(
          status === 'published'
            ? 'Announcement published to community!'
            : 'Draft announcement saved',
        );
      }

      cleanupPreviews();
      setTitle('');
      setContent('');
      onCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create post:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
      setUploadProgressText(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4 max-h-[90vh] overflow-y-auto">
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
            onClick={handleClose}
            disabled={submitting}
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
              disabled={submitting}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 border rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all disabled:opacity-50"
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
              disabled={submitting}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-900 dark:text-white transition-all leading-relaxed disabled:opacity-50"
              placeholder="Write the full announcement text..."
            />
          </div>

          {/* ─── IMAGE ATTACHMENTS SECTION ──────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Image Attachments
              </label>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  selectedFiles.length >= MAX_ATTACHMENTS
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {selectedFiles.length} / {MAX_ATTACHMENTS}
              </span>
            </div>

            {/* Thumbnail Previews */}
            {filePreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-white/5">
                {filePreviews.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-xs"
                  >
                    <img
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/90 text-white rounded-full transition-opacity opacity-80 group-hover:opacity-100"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3 text-rose-300" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add Images Action Button */}
            {selectedFiles.length < MAX_ATTACHMENTS && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={submitting}
                  className="hidden"
                  id="feed-image-input"
                />
                <label
                  htmlFor="feed-image-input"
                  className={`flex items-center justify-center gap-2 px-3.5 py-2.5 border border-dashed rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    submitting
                      ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-white/10 text-slate-400'
                      : 'border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>
                    {selectedFiles.length === 0
                      ? 'Add Images (JPEG, PNG, WebP up to 10 MB)'
                      : `Add More Images (${MAX_ATTACHMENTS - selectedFiles.length} remaining)`}
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Feed Channel
              </label>
              <select
                value={feedType}
                disabled={submitting}
                onChange={(e) => setFeedType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 outline-none disabled:opacity-50"
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
                disabled={submitting}
                onChange={(e) => setAudienceScope(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 outline-none disabled:opacity-50"
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
                disabled={submitting}
                onChange={(e) => setReactionsEnabled(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
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
                disabled={submitting}
                onChange={(e) => setCommentsEnabled(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
              />
              <label
                htmlFor="commentsEnabled"
                className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
              >
                Allow Comments
              </label>
            </div>
          </div>

          {/* Progress / Status banner during upload */}
          {uploadProgressText && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span className="font-medium">{uploadProgressText}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStatus(status === 'published' ? 'draft' : 'published')}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
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
                disabled={submitting}
                onClick={handleClose}
                className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
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
