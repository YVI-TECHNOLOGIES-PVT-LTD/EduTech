import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  ExternalLink,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileQuestion,
  RotateCw,
} from 'lucide-react';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { VerifyDocumentDialog } from './VerifyDocumentDialog';
import { RejectDocumentDialog } from './RejectDocumentDialog';
import { RequestResubmissionDialog } from './RequestResubmissionDialog';
import { useLazyGetDocumentSignedUrlQuery } from '@/shared/api/admission.api';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export interface DocumentPreviewItem {
  document_id: string;
  application_id?: string;
  application_number?: string;
  student_name?: string;
  grade_name?: string | null;
  academic_year_name?: string | null;
  lead_number?: string | null;
  document_name?: string;
  original_file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  verify_status?: string;
  verification_remarks?: string | null;
  uploaded_at?: string;
  verified_by?: string | null;
  verified_at?: string | null;
  is_mandatory?: boolean;
}

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentPreviewItem | null;
  onVerificationSuccess?: () => void;
}

export const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({
  open,
  onOpenChange,
  document,
  onVerificationSuccess,
}) => {
  const [
    getSignedUrl,
    { isLoading: isQueryLoading, isFetching: isQueryFetching, isError: isQueryError },
  ] = useLazyGetDocumentSignedUrlQuery();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  const [isDownloading, setIsDownloading] = useState(false);

  // Sub-dialog states for verification workflow
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [resubmitOpen, setResubmitOpen] = useState(false);

  // Fetch signed URL whenever modal opens with a valid document
  useEffect(() => {
    let isMounted = true;

    if (open && document?.document_id) {
      setSignedUrl(null);
      setFetchFailed(false);
      setIsInitializing(true);
      setZoomLevel(100);
      setIsDownloading(false);

      getSignedUrl(document.document_id)
        .unwrap()
        .then((res: any) => {
          if (isMounted) {
            const url = res?.signed_url || res?.signedUrl || res?.url || res?.file_url;
            if (url) {
              setSignedUrl(url);
              setFetchFailed(false);
            } else {
              setFetchFailed(true);
            }
            setIsInitializing(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setFetchFailed(true);
            setIsInitializing(false);
          }
        });
    } else {
      setIsInitializing(false);
    }

    return () => {
      isMounted = false;
    };
  }, [open, document?.document_id, getSignedUrl]);

  if (!document) return null;

  const fileName = document.original_file_name || document.document_name || 'Document';
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

  // Derive authoritative download filename preserving extension
  const getDownloadFileName = () => {
    if (document.original_file_name && document.original_file_name.trim()) {
      return document.original_file_name.trim();
    }
    if (document.document_name && document.document_name.trim()) {
      const base = document.document_name.trim().replace(/[^a-zA-Z0-9.\-_]/g, '_');
      if (fileExt && !base.toLowerCase().endsWith(`.${fileExt}`)) {
        return `${base}.${fileExt}`;
      }
      return base;
    }
    return fileExt ? `document.${fileExt}` : 'document';
  };

  // Determine file type
  const isPdf =
    fileExt === 'pdf' ||
    Boolean(document.mime_type && document.mime_type.toLowerCase().includes('pdf'));

  const isImage =
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(fileExt) ||
    Boolean(document.mime_type && document.mime_type.toLowerCase().startsWith('image/'));

  const handleDownload = async () => {
    if (!signedUrl || isDownloading) {
      if (!signedUrl) {
        toast({
          title: 'Download Unavailable',
          description: 'Document preview URL is not available for download.',
          variant: 'destructive',
        });
      }
      return;
    }

    const targetFileName = getDownloadFileName();
    setIsDownloading(true);

    try {
      // Primary download strategy: fetch as blob and force client-side download with exact filename
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const anchor = window.document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = targetFileName;
      anchor.style.display = 'none';
      window.document.body.appendChild(anchor);
      anchor.click();
      window.document.body.removeChild(anchor);

      window.URL.revokeObjectURL(blobUrl);

      toast({
        title: 'Download Complete',
        description: `Saved ${targetFileName} to your device.`,
      });
    } catch (err: any) {
      // Fallback strategy: Direct anchor click with target self to avoid leaving page
      try {
        const fallbackAnchor = window.document.createElement('a');
        fallbackAnchor.href = signedUrl;
        fallbackAnchor.download = targetFileName;
        fallbackAnchor.target = '_self';
        fallbackAnchor.rel = 'noopener noreferrer';
        fallbackAnchor.style.display = 'none';
        window.document.body.appendChild(fallbackAnchor);
        fallbackAnchor.click();
        window.document.body.removeChild(fallbackAnchor);

        toast({
          title: 'Download Initiated',
          description: `Downloading ${targetFileName}...`,
        });
      } catch (fallbackErr) {
        toast({
          title: 'Download Failed',
          description: 'Unable to download file. Please use "Open Link" to view and save.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenLink = () => {
    if (!signedUrl) {
      toast({
        title: 'Link Unavailable',
        description: 'Secure token has not been generated yet.',
        variant: 'destructive',
      });
      return;
    }
    window.open(signedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(250, prev + 25));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 25));
  const handleResetZoom = () => setZoomLevel(100);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // State Machine Evaluation: Loading -> Ready -> Actual Error
  const isLoading =
    isInitializing ||
    isQueryLoading ||
    isQueryFetching ||
    (!signedUrl && !fetchFailed && !isQueryError);
  const hasError = !isLoading && !signedUrl && (fetchFailed || isQueryError);
  const isDocumentReady = !isLoading && Boolean(signedUrl);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/30 supports-backdrop-filter:backdrop-blur-xs duration-100"
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            // Refined desktop modal sizing with more breathing room (88vw-92vw, max-w-[1400px])
            'w-[calc(100vw-48px)] sm:w-[90vw] max-w-[1400px] sm:max-w-none lg:max-w-[1400px]',
            'h-[90vh] max-h-[90vh] p-0 gap-0',
            'flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden outline-none',
          )}
        >
          {/* 1. Fixed Header Region (flex-shrink-0) */}
          <div className="flex-shrink-0 px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 select-none z-10">
            {/* Left & Center: Document Identity + Categorization + Filename + Applicant Metadata */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                {/* Row 1: Document Category & Mandatory Badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-blue-400">
                    DOCUMENT PREVIEW
                  </span>
                  {document.is_mandatory && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded-full">
                      MANDATORY
                    </span>
                  )}
                </div>

                {/* Row 2: Document Filename (Readable, truncate only when necessary) */}
                <h2
                  className="text-base sm:text-lg font-bold text-white truncate max-w-2xl leading-tight"
                  title={fileName}
                >
                  {fileName}
                </h2>

                {/* Row 3: Applicant Metadata */}
                <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                  <span className="text-slate-200 font-semibold">
                    {document.student_name || 'Applicant'}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-blue-400 font-medium">
                    {document.application_number}
                  </span>
                  {document.grade_name && (
                    <>
                      <span>•</span>
                      <span>{document.grade_name}</span>
                    </>
                  )}
                  {document.academic_year_name && (
                    <>
                      <span>•</span>
                      <span>{document.academic_year_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Header Action Buttons (Download, Open Link, Close) */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {/* Download Button */}
              <Button
                type="button"
                size="sm"
                onClick={handleDownload}
                disabled={!signedUrl || isLoading || isDownloading}
                aria-busy={isDownloading}
                className="h-9 px-3.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 shadow-sm disabled:opacity-50 min-w-[100px]"
                title="Download document to device"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </>
                )}
              </Button>

              {/* Open Link Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenLink}
                disabled={!signedUrl || isLoading}
                className="h-9 px-3.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 rounded-xl gap-2 shadow-sm disabled:opacity-50"
                title="Open secure pre-signed link in new tab"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Open Link</span>
              </Button>

              {/* Close Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Close viewer (Esc)"
              >
                <X className="w-5 h-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          {/* 2. Independently Scrollable Document Viewport (flex-1 min-h-0 overflow-auto) */}
          <div className="flex-1 min-h-0 bg-black p-4 sm:p-6 overflow-auto flex flex-col items-center justify-center relative custom-scrollbar">
            {/* Floating Zoom Toolbar for Images (Contained in viewport) */}
            {isImage && isDocumentReady && (
              <div className="sticky bottom-4 ml-auto mr-4 z-20 flex items-center bg-black/90 backdrop-blur-md border border-neutral-800 rounded-xl p-1 text-white shadow-2xl">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                  className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                  title="Zoom Out (-25%)"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2.5 text-xs font-mono font-bold text-slate-200 hover:text-white"
                  title="Reset Zoom (100%)"
                >
                  {zoomLevel}%
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 250}
                  className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                  title="Zoom In (+25%)"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleResetZoom}
                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg ml-0.5"
                  title="Fit to Screen"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {/* A. Loading State */}
            {isLoading && (
              <div
                className="text-center p-12 space-y-4 max-w-sm mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl"
                aria-live="polite"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-bold text-white">Loading document…</div>
                  <p className="text-xs text-slate-400">
                    Retrieving pre-signed access URL from storage vault...
                  </p>
                </div>
              </div>
            )}

            {/* B. Actual Query Error State */}
            {hasError && (
              <div className="text-center p-10 bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full mx-auto space-y-5 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold text-white">Unable to Load Document Preview</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    The document security token may have expired, or the file is temporarily
                    inaccessible.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (document?.document_id) {
                        setIsInitializing(true);
                        setFetchFailed(false);
                        getSignedUrl(document.document_id)
                          .unwrap()
                          .then((res: any) => {
                            const url =
                              res?.signed_url || res?.signedUrl || res?.url || res?.file_url;
                            if (url) {
                              setSignedUrl(url);
                              setFetchFailed(false);
                            } else {
                              setFetchFailed(true);
                            }
                            setIsInitializing(false);
                          })
                          .catch(() => {
                            setFetchFailed(true);
                            setIsInitializing(false);
                          });
                      }
                    }}
                    className="h-9 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 gap-1.5 px-3.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Loading
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="h-9 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 px-3.5"
                  >
                    Close Viewer
                  </Button>
                </div>
              </div>
            )}

            {/* C. Image Document Viewer */}
            {isDocumentReady && isImage && (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-2 sm:p-4">
                <div className="bg-slate-950 p-2 rounded-xl shadow-2xl border border-slate-800 transition-transform duration-150 ease-out flex items-center justify-center">
                  <img
                    src={signedUrl!}
                    alt={fileName}
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'center center',
                    }}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg transition-transform duration-150 ease-out"
                  />
                </div>
              </div>
            )}

            {/* D. PDF Document Viewer: Contained within viewport with 16-24px breathing room */}
            {isDocumentReady && isPdf && (
              <div className="w-full h-full min-h-full rounded-xl overflow-hidden bg-white shadow-2xl border border-slate-300 dark:border-slate-800 flex flex-col">
                <iframe
                  src={`${signedUrl}#toolbar=1&navpanes=0`}
                  title={fileName}
                  className="w-full h-full flex-1 border-none rounded-xl"
                />
              </div>
            )}

            {/* E. Unsupported / Fallback Document Viewer */}
            {isDocumentReady && !isImage && !isPdf && (
              <div className="text-center p-10 bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full mx-auto space-y-5 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                  <FileQuestion className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold text-white">Preview Not Supported in Browser</h4>
                  <p className="text-xs text-slate-400">
                    Direct in-modal preview is not available for{' '}
                    <strong>.{fileExt || 'bin'}</strong> files ({formatFileSize(document.file_size)}
                    ).
                  </p>
                </div>
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-left text-xs text-slate-300 space-y-1">
                  <div className="font-mono text-[11px] font-semibold truncate text-slate-100">
                    {fileName}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Uploaded:{' '}
                    {document.uploaded_at ? new Date(document.uploaded_at).toLocaleString() : '—'}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!signedUrl || isDownloading}
                    aria-busy={isDownloading}
                    className="h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 px-4 shadow-sm disabled:opacity-50 min-w-[130px]"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download File
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleOpenLink}
                    className="h-10 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 gap-2 px-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in External App
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Fixed Verification Footer Region (flex-shrink-0) */}
          <div className="flex-shrink-0 px-6 py-4 bg-card border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs z-10">
            {/* Left: Current Verification Status & Remarks */}
            <div className="flex items-center gap-3 flex-wrap">
              <DocumentStatusBadge status={document.verify_status} />
              {document.verified_at && (
                <span className="text-[11px] text-slate-500 font-medium">
                  Verified: {new Date(document.verified_at).toLocaleDateString()}
                </span>
              )}
              {document.verification_remarks && (
                <span
                  className="text-[11px] text-slate-500 italic truncate max-w-md"
                  title={document.verification_remarks}
                >
                  Remarks: {document.verification_remarks}
                </span>
              )}
            </div>

            {/* Right: Direct Workflow Actions */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResubmitOpen(true)}
                className="h-9 px-3.5 text-xs font-bold text-purple-700 border-purple-200 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-950/50 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resubmit
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectOpen(true)}
                className="h-9 px-3.5 text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-950/50 gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setVerifyOpen(true)}
                disabled={document.verify_status === 'verified'}
                className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {document.verify_status === 'verified' ? 'Verified' : 'Verify Document'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-action Dialogs triggered directly from Document Viewer */}
      <VerifyDocumentDialog
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        document={document}
        onSuccess={() => {
          onVerificationSuccess?.();
          onOpenChange(false);
        }}
      />

      <RejectDocumentDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        document={document}
        onSuccess={() => {
          onVerificationSuccess?.();
          onOpenChange(false);
        }}
      />

      <RequestResubmissionDialog
        open={resubmitOpen}
        onOpenChange={setResubmitOpen}
        document={document}
        onSuccess={() => {
          onVerificationSuccess?.();
          onOpenChange(false);
        }}
      />
    </>
  );
};
