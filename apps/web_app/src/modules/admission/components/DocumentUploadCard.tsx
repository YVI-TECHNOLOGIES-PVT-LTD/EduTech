import React from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Trash2, FileText, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  };
  isReselectRequired?: boolean;
  uploadError?: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDoc: () => void;
  isReadOnly?: boolean;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  name,
  mandatory,
  hint = 'PDF / JPG / PNG • Max 5 MB',
  accept = '.pdf,.jpg,.jpeg,.png',
  uploadedDoc,
  isReselectRequired = false,
  uploadError,
  onFileUpload,
  onRemoveDoc,
  isReadOnly = false,
}) => {
  const isUploaded = !!uploadedDoc;

  return (
    <Card
      className={`p-5 rounded-2xl border transition-all ${
        uploadError
          ? 'border-red-200 bg-red-50/20 dark:bg-red-950/20'
          : isUploaded
            ? 'border-emerald-100 bg-emerald-50/10 dark:bg-emerald-950/10'
            : 'border-slate-200/80 dark:border-border bg-white dark:bg-card'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Column: Icon + Document Title & Metadata */}
        <div className="flex items-start sm:items-center space-x-4 min-w-0 flex-1">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              isUploaded
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
            }`}
          >
            {isUploaded ? (
              <CheckCircle2 className="w-5.5 h-5.5" />
            ) : (
              <UploadCloud className="w-5.5 h-5.5" />
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {name}
              </h4>
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

              {isReselectRequired ? (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Re-select File Required
                </Badge>
              ) : isUploaded ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-black uppercase tracking-wider"
                >
                  Ready for Upload ✓
                </Badge>
              ) : null}
            </div>

            <p className="text-xs text-slate-400 font-medium truncate">{hint}</p>

            {isReselectRequired ? (
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  File binary lost on refresh ({uploadedDoc?.file_name}). Re-select file before
                  submitting.
                </span>
              </p>
            ) : isUploaded ? (
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5 truncate">
                <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{uploadedDoc.file_name}</span>
                <span className="text-slate-400 shrink-0">({uploadedDoc.file_size})</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">No file selected</p>
            )}

            {uploadError && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{uploadError}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Upload Actions */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-border">
          <label className="cursor-pointer">
            <input
              type="file"
              disabled={isReadOnly}
              accept={accept}
              onChange={onFileUpload}
              className="hidden"
            />
            <span
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center space-x-1.5 shadow-xs ${
                isUploaded
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-muted dark:hover:bg-muted/80 dark:text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploaded ? 'Replace File' : 'Upload File'}</span>
            </span>
          </label>

          {isUploaded && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isReadOnly}
              onClick={onRemoveDoc}
              className="h-9 px-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
              title="Remove File"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
