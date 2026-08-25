import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

export interface ProfilePhotoPickerProps {
  avatarUrl?: string | null;
  name?: string;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  isUploading?: boolean;
  isDeleting?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'xl';
}

export const ProfilePhotoPicker: React.FC<ProfilePhotoPickerProps> = ({
  avatarUrl,
  name = 'User',
  onUpload,
  onDelete,
  isUploading = false,
  isDeleting = false,
  disabled = false,
  className = '',
  size = 'xl',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when previewUrl changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const getInitials = (str: string) => {
    return (
      str
        .split(' ')
        .filter(Boolean)
        .map((n) => n.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U'
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so re-selecting same file works
    e.target.value = '';

    const mimeType = (file.type || '').toLowerCase();
    const ext = (file.name || '').split('.').pop()?.toLowerCase() || '';

    // Frontend Format Validation
    if (!ALLOWED_MIME_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(ext)) {
      const msg = 'Please select a valid JPG, PNG, or WEBP image.';
      toast.error(msg);
      return;
    }

    // Frontend File Size Validation
    if (file.size > MAX_FILE_SIZE) {
      const msg = 'Profile photo must be 5 MB or smaller.';
      toast.error(msg);
      return;
    }

    // Revoke existing preview URL before creating new one
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setUploadError(null);
    setIsPreviewOpen(true);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || isUploading) return;
    try {
      setUploadError(null);
      await onUpload(selectedFile);
      toast.success('Profile photo updated successfully.');
      setIsPreviewOpen(false);
      setSelectedFile(null);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Unable to upload profile photo. Please try again.';
      setUploadError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete || isDeleting) return;
    try {
      await onDelete();
      toast.success('Profile photo removed successfully.');
      setIsDeleteConfirmOpen(false);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Unable to remove profile photo. Please try again.';
      toast.error(errorMsg);
    }
  };

  const handleCancelPreview = () => {
    setIsPreviewOpen(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-4 ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Select profile photo file"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading || isDeleting}
      />

      {/* Main Avatar Display */}
      <div className="relative group shrink-0">
        <Avatar
          size={size}
          className="border-2 border-border shadow-xs bg-slate-100 dark:bg-neutral-900"
        >
          <AvatarImage src={avatarUrl || undefined} alt={`${name}'s profile photo`} />
          <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        {/* Floating Upload Trigger Camera Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading || isDeleting}
          aria-label="Change profile photo"
          title="Change profile photo"
          className="absolute -bottom-1 -right-1 p-1.5 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 rounded-full shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-white disabled:opacity-50 cursor-pointer"
        >
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading || isDeleting}
          aria-label="Upload new photo"
          className="text-xs font-semibold gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Photo
        </Button>

        {avatarUrl && onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteConfirmOpen(true)}
            disabled={disabled || isUploading || isDeleting}
            aria-label="Remove profile photo"
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-1.5"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Remove Photo
          </Button>
        )}
      </div>

      {/* ─── Image Preview & Confirmation Modal ────────────────────────────────────── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Preview Profile Photo</DialogTitle>
            <DialogDescription className="text-xs">
              Confirm your selected photo. Allowed formats: JPEG, PNG, WEBP (Max 5MB).
            </DialogDescription>
          </DialogHeader>

          {previewUrl && (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-neutral-900 rounded-xl border border-border space-y-3">
              <img
                src={previewUrl}
                alt="Avatar Preview"
                className="w-36 h-36 rounded-full object-cover border-2 border-primary/20 shadow-md"
              />
              <p className="text-[11px] text-muted-foreground truncate max-w-full font-mono">
                {selectedFile?.name} (
                {(selectedFile ? selectedFile.size / 1024 / 1024 : 0).toFixed(2)} MB)
              </p>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs rounded-lg border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <DialogFooter className="flex sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelPreview}
              disabled={isUploading}
              aria-label="Cancel image upload"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmUpload}
              disabled={isUploading}
              aria-label="Confirm avatar upload"
              className="gap-1.5"
            >
              {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isUploading ? 'Uploading...' : 'Save Profile Photo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Alert Dialog ──────────────────────────────────────── */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">Remove Profile Photo?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to remove your profile photo? Your avatar will revert to your
              default initials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Remove Photo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
