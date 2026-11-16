import React from 'react';
import { FileCheck, Eye, FileText, Clock, RotateCcw, XCircle, UploadCloud } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface DocumentVerificationCardProps {
  docKey: string;
  name: string;
  mandatory: boolean;
  hint: string;
  uploaded?: {
    file_name: string;
    file_size: string;
    status:
      | 'VERIFIED'
      | 'IN REVIEW'
      | 'ACTION NEEDED'
      | 'REJECTED'
      | 'APPROVED'
      | 'NOT_UPLOADED'
      | string;
    reason?: string;
    url?: string;
    uploaded_at?: string;
  };
  isUploading?: boolean;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
  onView?: () => void;
}

export const DocumentVerificationCard: React.FC<DocumentVerificationCardProps> = ({
  name,
  mandatory,
  hint,
  uploaded,
  isUploading = false,
  onUpload,
  onView,
}) => {
  const isUploaded = !!uploaded && uploaded.status !== 'NOT_UPLOADED';
  const status = uploaded?.status?.toUpperCase() || 'NOT_UPLOADED';

  const isVerified = status === 'VERIFIED' || status === 'APPROVED' || status === 'ACCEPTED';
  const isInReview =
    status === 'IN REVIEW' ||
    status === 'IN_REVIEW' ||
    status === 'PENDING' ||
    status === 'UNDER_REVIEW';
  const isRejected = status === 'REJECTED';
  const isActionNeeded =
    status === 'ACTION NEEDED' ||
    status === 'ACTION_NEEDED' ||
    status === 'RESUBMISSION_REQUESTED' ||
    status === 'CORRECTION_REQUIRED';

  const getStatusBadge = () => {
    if (!isUploaded) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-black uppercase text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800"
        >
          Not Uploaded
        </Badge>
      );
    }
    if (isVerified) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
        >
          Accepted ✓
        </Badge>
      );
    }
    if (isInReview) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
        >
          Uploaded • In Review ⏳
        </Badge>
      );
    }
    if (isRejected) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
        >
          Rejected ✕
        </Badge>
      );
    }
    if (isActionNeeded) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
        >
          Action Needed ⚠
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-black uppercase text-slate-600 border-slate-200"
      >
        {status}
      </Badge>
    );
  };

  return (
    <Card
      className={`p-5 rounded-2xl border transition-all ${
        isRejected
          ? 'border-rose-200 bg-rose-50/20 dark:bg-rose-950/20 dark:border-rose-900/40'
          : isActionNeeded
            ? 'border-purple-200 bg-purple-50/20 dark:bg-purple-950/20 dark:border-purple-900/40'
            : isVerified
              ? 'border-emerald-100/80 bg-emerald-50/10 dark:bg-emerald-950/10 dark:border-emerald-900/30'
              : isInReview
                ? 'border-amber-100/80 bg-amber-50/10 dark:bg-amber-950/10 dark:border-amber-900/30'
                : 'border-slate-200/80 dark:border-border bg-white dark:bg-card'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Document Icon & Info */}
        <div className="flex items-start space-x-4 min-w-0 flex-1">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0 ${
              isVerified
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : isRejected
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : isActionNeeded
                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                    : isInReview
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {isVerified ? (
              <FileCheck className="w-5.5 h-5.5" />
            ) : isRejected ? (
              <XCircle className="w-5.5 h-5.5" />
            ) : isActionNeeded ? (
              <RotateCcw className="w-5.5 h-5.5" />
            ) : isInReview ? (
              <Clock className="w-5.5 h-5.5" />
            ) : (
              <FileText className="w-5.5 h-5.5" />
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {name}
              </h4>
              <span className="text-[10px] font-extrabold text-slate-400">
                ({mandatory ? 'Required' : 'Optional'})
              </span>
              {getStatusBadge()}
            </div>

            {uploaded ? (
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {uploaded.file_name}
                </span>
                <span>•</span>
                <span>{uploaded.file_size}</span>
                {uploaded.uploaded_at && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">
                      Uploaded {new Date(uploaded.uploaded_at).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium truncate">
                {hint || 'Document has not been submitted.'}
              </p>
            )}

            {/* Rejection Remarks Feedback Box */}
            {isRejected && uploaded?.reason && (
              <div className="p-3 mt-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs">
                <span className="font-bold text-rose-800 dark:text-rose-300 uppercase text-[10px] block tracking-wider">
                  Reason for rejection
                </span>
                <p className="text-rose-700 dark:text-rose-200 font-medium mt-0.5 leading-relaxed">
                  {uploaded.reason}
                </p>
              </div>
            )}

            {/* Resubmission Requested Remarks Feedback Box */}
            {isActionNeeded && uploaded?.reason && (
              <div className="p-3 mt-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs">
                <span className="font-bold text-purple-800 dark:text-purple-300 uppercase text-[10px] block tracking-wider">
                  Resubmission Required • Instructions from School
                </span>
                <p className="text-purple-700 dark:text-purple-200 font-medium mt-0.5 leading-relaxed">
                  {uploaded.reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-border shrink-0">
          {onView && isUploaded && (
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="h-9 px-3 text-xs font-bold rounded-xl border-border text-foreground hover:bg-muted"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>View</span>
            </Button>
          )}

          {/* Upload/Resubmit is ONLY rendered when action is needed (resubmission_requested) */}
          {isActionNeeded && onUpload && (
            <label
              className={`cursor-pointer ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={onUpload}
                disabled={isUploading}
                className="hidden"
              />
              <span className="h-9 px-3.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center space-x-1.5 shadow-xs bg-purple-600 hover:bg-purple-700 text-white">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Resubmit Document'}</span>
              </span>
            </label>
          )}
        </div>
      </div>
    </Card>
  );
};
