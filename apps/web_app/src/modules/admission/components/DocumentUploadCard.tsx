import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileText,
  Upload,
  Eye,
  RefreshCw,
  X,
  FileCheck,
  ImageIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface DocumentUploadCardProps {
  id: string;
  name: string;
  mandatory: boolean;
  hint?: string;
  accept?: string;
  maxSizeMb?: number;
  uploadedDoc?: {
    file_name: string;
    file_size: string;
    uploaded_at?: string;
    status?: string;
    reason?: string;
    url?: string;
  };
  selectedFile?: File | null;
  isReselectRequired?: boolean;
  uploadError?: string | null;
  isUploading?: boolean;
  uploadProgress?: number;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect?: (file: File) => void;
  onUploadDoc?: (file: File) => Promise<void> | void;
  onRemoveDoc: () => void;
  onViewDoc?: () => void;
  isReadOnly?: boolean;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  id,
  name,
  mandatory,
  hint = 'PDF / JPG / PNG • Max 10 MB',
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMb = 10,
  uploadedDoc,
  selectedFile: externalSelectedFile,
  isReselectRequired = false,
  uploadError: externalUploadError,
  isUploading = false,
  uploadProgress = 0,
  onFileUpload,
  onFileSelect,
  onUploadDoc,
  onRemoveDoc,
  onViewDoc,
  isReadOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Active file: external if passed from parent wizard, else internal
  const activeFile = externalSelectedFile !== undefined ? externalSelectedFile : internalFile;

  // Active error: local validation error or server error
  const activeError = localError || externalUploadError;

  // Manage object URL for preview
  useEffect(() => {
    if (activeFile) {
      const url = URL.createObjectURL(activeFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [activeFile]);

  // Validate selected file against requirements
  const validateFile = (file: File): string | null => {
    if (!file) {
      return 'Please select a valid document.';
    }

    if (file.size === 0) {
      return 'The selected file is empty (0 bytes). Please select a valid document.';
    }

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return `File size (${sizeMb} MB) exceeds the maximum allowed limit of ${maxSizeMb} MB.`;
    }

    // Extension validation
    const lastDotIndex = file.name.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return 'Unsupported file format. Please select a PDF, JPG, or PNG document.';
    }
    const ext = file.name.substring(lastDotIndex).toLowerCase();
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (!allowedExtensions.includes(ext)) {
      return `Unsupported file format (${ext}). Allowed formats: PDF, JPG, PNG.`;
    }

    // MIME type validation
    const allowedMimePrefixes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (
      file.type &&
      !allowedMimePrefixes.some((mime) => file.type.toLowerCase().startsWith(mime))
    ) {
      return 'Unsupported file MIME type. Please select a genuine PDF or image file.';
    }

    return null;
  };

  // Handle native file selection
  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const validationMsg = validateFile(file);
    if (validationMsg) {
      setLocalError(validationMsg);
      // Clear input so user can try again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setInternalFile(file);

    // Call external callbacks
    if (onFileSelect) {
      onFileSelect(file);
    }
    if (onFileUpload) {
      onFileUpload(e);
    }
  };

  const handleSelectButtonClick = () => {
    setLocalError(null);
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setInternalFile(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemoveDoc();
  };

  const handleDirectUpload = async () => {
    if (!activeFile || !onUploadDoc) return;
    setLocalError(null);
    try {
      await onUploadDoc(activeFile);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to upload document. Please retry.');
    }
  };

  const isUploaded = !!uploadedDoc && uploadedDoc.status !== 'NOT_UPLOADED';
  const isSelected = !!activeFile;
  const isImage =
    (activeFile &&
      (activeFile.type.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(activeFile.name))) ||
    (uploadedDoc && /\.(jpg|jpeg|png)$/i.test(uploadedDoc.file_name));
  const isPdf =
    (activeFile && (activeFile.type === 'application/pdf' || activeFile.name.endsWith('.pdf'))) ||
    (uploadedDoc && uploadedDoc.file_name.endsWith('.pdf'));

  const status = uploadedDoc?.status?.toUpperCase() || '';
  const isRejected = status === 'REJECTED';
  const isActionNeeded =
    status === 'ACTION NEEDED' ||
    status === 'ACTION_NEEDED' ||
    status === 'RESUBMISSION_REQUESTED' ||
    status === 'CORRECTION_REQUIRED';
  const isVerified = status === 'VERIFIED' || status === 'APPROVED' || status === 'ACCEPTED';
  const isInReview = status === 'IN REVIEW' || status === 'PENDING' || status === 'UNDER_REVIEW';

  // Display file info
  const displayFileName = activeFile ? activeFile.name : uploadedDoc?.file_name;
  const displayFileSize = activeFile
    ? `${(activeFile.size / (1024 * 1024)).toFixed(2)} MB`
    : uploadedDoc?.file_size;

  return (
    <Card
      className={`p-5 rounded-2xl border transition-all ${
        activeError
          ? 'border-red-200 bg-red-50/15 dark:bg-red-950/20'
          : isUploading
            ? 'border-indigo-200 bg-indigo-50/10 dark:bg-indigo-950/10'
            : isVerified
              ? 'border-emerald-200 bg-emerald-50/10 dark:bg-emerald-950/10'
              : isSelected || isUploaded
                ? 'border-indigo-100 bg-indigo-50/5 dark:bg-indigo-950/5'
                : 'border-slate-200/80 dark:border-border bg-white dark:bg-card'
      }`}
    >
      {/* Hidden Native Local File Input */}
      <input
        ref={fileInputRef}
        type="file"
        id={`file-input-${id}`}
        disabled={isReadOnly || isUploading}
        accept={accept}
        onChange={handleNativeFileChange}
        className="hidden"
        aria-label={`Select document file for ${name}`}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Column: Icon + Document Title, Status & File Details */}
        <div className="flex items-start sm:items-center space-x-4 min-w-0 flex-1">
          {/* Document Thumbnail / State Icon */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-xs ${
              isVerified
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : isRejected || isActionNeeded
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : isSelected || isUploaded
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {isVerified ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : isRejected ? (
              <AlertCircle className="w-6 h-6 text-rose-600" />
            ) : previewUrl && isImage ? (
              <img
                src={previewUrl}
                alt="Selected document thumbnail"
                className="w-12 h-12 rounded-2xl object-cover cursor-pointer hover:opacity-90"
                onClick={() => setIsPreviewOpen(true)}
              />
            ) : isPdf ? (
              <FileText className="w-6 h-6 text-indigo-600" />
            ) : isImage ? (
              <ImageIcon className="w-6 h-6 text-indigo-600" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          {/* Details & Status Badges */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {name}
              </h4>

              {/* Requirement Badge */}
              <Badge
                variant={mandatory ? 'destructive' : 'outline'}
                className={
                  mandatory
                    ? 'bg-red-50 text-red-600 border-red-200 text-[10px] font-black'
                    : 'text-slate-400 border-slate-200 text-[10px] font-bold'
                }
              >
                {mandatory ? 'Required' : 'Optional'}
              </Badge>

              {/* Lifecycle Status Badge */}
              {isUploading ? (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                  Uploading...
                </Badge>
              ) : isReselectRequired ? (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Re-select File Required
                </Badge>
              ) : isSelected && !isUploaded ? (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-black uppercase tracking-wider"
                >
                  Selected • Review Below
                </Badge>
              ) : isVerified ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-black uppercase tracking-wider"
                >
                  Accepted ✓
                </Badge>
              ) : isRejected ? (
                <Badge
                  variant="outline"
                  className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-black uppercase tracking-wider"
                >
                  Rejected ✕
                </Badge>
              ) : isActionNeeded ? (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-black uppercase tracking-wider"
                >
                  Resubmission Required
                </Badge>
              ) : isInReview ? (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-black uppercase tracking-wider"
                >
                  Uploaded • In Review ⏳
                </Badge>
              ) : isUploaded ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-black uppercase tracking-wider"
                >
                  Ready for Upload ✓
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-slate-50 text-slate-500 border-slate-200 text-[10px] font-bold uppercase tracking-wider"
                >
                  Not Uploaded
                </Badge>
              )}
            </div>

            {/* Hint or Selected/Uploaded File Line */}
            {displayFileName ? (
              <div className="flex flex-wrap items-center gap-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1 truncate max-w-[240px] sm:max-w-xs">
                  {isPdf ? (
                    <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  <span className="truncate">{displayFileName}</span>
                </span>
                {displayFileSize && (
                  <span className="text-slate-400 font-normal shrink-0">({displayFileSize})</span>
                )}
                {uploadedDoc?.uploaded_at && (
                  <span className="text-slate-400 font-normal shrink-0">
                    • Uploaded {new Date(uploadedDoc.uploaded_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium truncate">{hint}</p>
            )}

            {/* Error Message Feedback */}
            {activeError && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5 mt-1 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{activeError}</span>
              </p>
            )}

            {/* Rejection / Resubmission Notice */}
            {uploadedDoc?.reason && (isRejected || isActionNeeded) && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 mt-1">
                <span className="font-extrabold uppercase text-[10px] block tracking-wider">
                  Reviewer Feedback:
                </span>
                <p className="mt-0.5 leading-relaxed font-medium">{uploadedDoc.reason}</p>
              </div>
            )}

            {/* Real Progress Bar */}
            {isUploading && (
              <div className="space-y-1 pt-1.5 max-w-sm">
                <div className="flex justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                  <span>Uploading to secure vault...</span>
                  <span>{uploadProgress || 65}%</span>
                </div>
                <Progress value={uploadProgress || 65} className="h-1.5" />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Native Selection & Upload Action Controls */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-border shrink-0">
          {/* Preview Button (If local preview or remote signed URL exists) */}
          {(previewUrl || onViewDoc) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (previewUrl) {
                  setIsPreviewOpen(true);
                } else if (onViewDoc) {
                  onViewDoc();
                }
              }}
              className="h-9 px-3 text-xs font-bold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-border dark:text-slate-200"
              title="Preview selected document"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>Preview</span>
            </Button>
          )}

          {/* If file is selected and direct upload handler is provided */}
          {isSelected && onUploadDoc && !isUploaded && (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isReadOnly || isUploading}
              onClick={handleDirectUpload}
              className="h-9 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Button>
          )}

          {/* Primary Select / Replace Button Triggering Native File Input */}
          <Button
            type="button"
            variant={isSelected || isUploaded ? 'outline' : 'default'}
            size="sm"
            disabled={isReadOnly || isUploading}
            onClick={handleSelectButtonClick}
            className={`h-9 px-4 text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center justify-center space-x-1.5 ${
              isSelected || isUploaded
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-muted dark:hover:bg-muted/80 dark:text-white border-slate-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>
              {isUploading
                ? 'Uploading...'
                : isSelected || isUploaded
                  ? 'Replace File'
                  : 'Select Document File'}
            </span>
          </Button>

          {/* Remove File Button */}
          {(isSelected || isUploaded) && !isReadOnly && !isUploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-9 px-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
              title="Remove File"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Lightweight Local Preview Modal */}
      {isPreviewOpen && previewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {name}
                </h3>
                <p className="text-xs text-slate-400 truncate">{displayFileName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center min-h-[240px] max-h-[60vh] overflow-auto rounded-xl bg-slate-50 dark:bg-slate-950/50 p-2">
              {isImage ? (
                <img
                  src={previewUrl}
                  alt={name}
                  className="max-h-[55vh] max-w-full object-contain rounded-lg"
                />
              ) : isPdf ? (
                <iframe
                  src={previewUrl}
                  title={name}
                  className="w-full h-[55vh] rounded-lg border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <FileCheck className="w-12 h-12 text-indigo-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {displayFileName}
                  </p>
                  <p className="text-xs text-slate-400">File is ready for upload.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-semibold text-slate-400">
                {displayFileSize} • Local Device File
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
                className="text-xs font-bold"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
