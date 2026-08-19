import React from 'react';
import { CheckCircle2, Clock, XCircle, RotateCcw, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DocumentVerifyStatus = 'pending' | 'verified' | 'rejected' | 'resubmission_requested' | string;

interface DocumentStatusBadgeProps {
  status?: DocumentVerifyStatus | null;
  className?: string;
  showIcon?: boolean;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status = 'pending',
  className,
  showIcon = true,
}) => {
  const normalized = (status || 'pending').toLowerCase();

  switch (normalized) {
    case 'verified':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider',
            'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
            className
          )}
        >
          {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
          Verified
        </span>
      );

    case 'rejected':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider',
            'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
            className
          )}
        >
          {showIcon && <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />}
          Rejected
        </span>
      );

    case 'resubmission_requested':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider',
            'bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
            className
          )}
        >
          {showIcon && <RotateCcw className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />}
          Resubmission Required
        </span>
      );

    case 'pending':
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider',
            'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
            className
          )}
        >
          {showIcon && <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />}
          Pending Review
        </span>
      );
  }
};
