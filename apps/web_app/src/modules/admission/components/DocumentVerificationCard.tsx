import React from 'react';
import { FileCheck, AlertCircle, UploadCloud, Trash2, Eye, RefreshCw, FileText } from 'lucide-react';
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
    status: 'VERIFIED' | 'IN REVIEW' | 'ACTION NEEDED' | 'REJECTED' | 'APPROVED' | 'NOT_UPLOADED' | string;
    reason?: string;
    url?: string;
  };
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
  onView?: () => void;
}

export const DocumentVerificationCard: React.FC<DocumentVerificationCardProps> = ({
  name,
  mandatory,
  hint,
  uploaded,
  onUpload,
  onRemove,
  onView,
}) => {
  const isUploaded = !!uploaded;
  const status = uploaded?.status || 'NOT_UPLOADED';

  const isVerified = status === 'VERIFIED' || status === 'APPROVED';
  const isInReview = status === 'IN REVIEW';
  const isActionNeeded = status === 'ACTION NEEDED' || status === 'REJECTED';

  const getStatusBadge = () => {
    if (!isUploaded) {
      return (
        <Badge variant="outline" className="text-[10px] font-black uppercase text-slate-400 border-slate-200">
          NOT UPLOADED
        </Badge>
      );
    }
    if (isVerified) {
      return (
        <Badge variant="outline" className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
          VERIFIED ✓
        </Badge>
      );
    }
    if (isInReview) {
      return (
        <Badge variant="outline" className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
          IN REVIEW ⏳
        </Badge>
      );
    }
    if (isActionNeeded) {
      return (
        <Badge variant="outline" className="text-[10px] font-black uppercase text-red-700 bg-red-50 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800">
          ACTION NEEDED ⚠
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] font-black uppercase text-slate-600 border-slate-200">
        {status}
      </Badge>
    );
  };

  return (
    <Card
      className={`p-5 rounded-2xl border transition-all ${
        isActionNeeded
          ? 'border-red-200 bg-red-50/20 dark:bg-red-950/20'
          : isVerified
            ? 'border-emerald-100/80 bg-emerald-50/10 dark:bg-emerald-950/10'
            : 'border-slate-200/80 dark:border-border bg-white dark:bg-card'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Document Icon & Info */}
        <div className="flex items-start sm:items-center space-x-4 min-w-0 flex-1">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              isVerified
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : isActionNeeded
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                  : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
            }`}
          >
            {isVerified ? (
              <FileCheck className="w-5.5 h-5.5" />
            ) : isActionNeeded ? (
              <AlertCircle className="w-5.5 h-5.5" />
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
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
                {uploaded.file_name} • {uploaded.file_size}
              </p>
            ) : (
              <p className="text-xs text-slate-400 font-medium truncate">{hint}</p>
            )}

            {uploaded?.reason && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1">
                Reason: {uploaded.reason}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-border">
          {onView && isUploaded && (
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="h-9 px-3 text-xs font-bold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>View</span>
            </Button>
          )}

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={onUpload}
              className="hidden"
            />
            <span className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center space-x-1.5 shadow-xs">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isActionNeeded ? 'Re-upload' : isUploaded ? 'Replace' : 'Upload'}</span>
            </span>
          </label>

          {isUploaded && onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-9 px-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
              title="Remove Document"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
