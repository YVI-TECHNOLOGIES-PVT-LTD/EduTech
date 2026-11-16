import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { FileCheck, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export interface DocumentVerificationData {
  verified: number;
  pending: number;
  rejected: number;
  total?: number;
}

export interface DocumentVerificationWidgetProps {
  data: DocumentVerificationData;
  isLoading?: boolean;
}

export const DocumentVerificationWidget: React.FC<DocumentVerificationWidgetProps> = ({
  data,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const total = data.total ?? (data.verified + data.pending + data.rejected);
  const completionRate = total > 0 ? Math.round((data.verified / total) * 100) : 0;

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground font-sans">
              {t('dashboard.frontOffice.documentVerification.title', 'Document Verification')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                'dashboard.frontOffice.documentVerification.subtitle',
                'Status of submitted candidate documents',
              )}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/60 shrink-0">
          {completionRate}% {t('dashboard.frontOffice.documentVerification.verified', 'Verified')}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-4">
          <div className="h-12 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
          <div className="h-16 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
        </div>
      ) : total === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center text-center p-4 space-y-1.5 border border-dashed border-border rounded-xl">
          <FileCheck className="w-7 h-7 text-muted-foreground/50 mx-auto" />
          <p className="text-xs font-bold text-foreground">
            {t('dashboard.frontOffice.documentVerification.noData', 'No documents uploaded yet.')}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Document queues will appear as applicants upload certificates and proofs.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mt-2">
          {/* Progress Bar with 3 segments */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>{t('dashboard.frontOffice.documentVerification.completionRate', 'Verification Rate')}</span>
              <span className="font-mono text-foreground font-extrabold ltr-isolate">{completionRate}%</span>
            </div>
            <div className="h-3 w-full bg-muted/50 dark:bg-zinc-900 rounded-full overflow-hidden p-0.5 flex gap-1">
              {data.verified > 0 && (
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(data.verified / total) * 100}%` }}
                />
              )}
              {data.pending > 0 && (
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${(data.pending / total) * 100}%` }}
                />
              )}
              {data.rejected > 0 && (
                <div
                  className="h-full rounded-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${(data.rejected / total) * 100}%` }}
                />
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" />
                <span>{t('dashboard.frontOffice.documentVerification.verified', 'Verified')}</span>
              </div>
              <p className="text-base font-black text-emerald-900 dark:text-emerald-200 font-mono ltr-isolate mt-1">
                {data.verified.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                <Clock className="w-3 h-3" />
                <span>{t('dashboard.frontOffice.documentVerification.pending', 'Pending')}</span>
              </div>
              <p className="text-base font-black text-amber-900 dark:text-amber-200 font-mono ltr-isolate mt-1">
                {data.pending.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40">
              <div className="flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3" />
                <span>{t('dashboard.frontOffice.documentVerification.rejected', 'Rejected')}</span>
              </div>
              <p className="text-base font-black text-rose-900 dark:text-rose-200 font-mono ltr-isolate mt-1">
                {data.rejected.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
