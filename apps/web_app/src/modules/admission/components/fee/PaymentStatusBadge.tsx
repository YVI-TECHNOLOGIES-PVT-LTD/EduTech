import React from 'react';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

export type AdmissionPaymentStatus =
  'pending' | 'partial' | 'paid' | 'failed' | 'waived' | 'refunded' | string;

interface PaymentStatusBadgeProps {
  status?: AdmissionPaymentStatus | null;
  className?: string;
  showIcon?: boolean;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status = 'pending',
  className,
  showIcon = true,
}) => {
  const normalized = (status || 'pending').toLowerCase().trim();

  switch (normalized) {
    case 'paid':
    case 'completed':
    case 'success':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
            'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
            className,
          )}
        >
          {showIcon && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          Paid
        </span>
      );

    case 'partial':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
            'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
            className,
          )}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          Partial
        </span>
      );

    case 'failed':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
            'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
            className,
          )}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
          Failed
        </span>
      );

    case 'waived':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
            'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
            className,
          )}
        >
          {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
          Waived
        </span>
      );

    case 'refunded':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
            'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
            className,
          )}
        >
          {showIcon && <RotateCcw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
          Refunded
        </span>
      );

    case 'pending':
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
            'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
            className,
          )}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
          Pending
        </span>
      );
  }
};
