import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { UserCheck, Sparkles } from 'lucide-react';

export interface LeadPerformanceData {
  total: number;
  newLeads: number;
  qualified: number;
  inProgress: number;
  converted: number;
  lost: number;
  conversionRate: number;
}

export interface LeadPerformanceSectionProps {
  data?: LeadPerformanceData | null;
  isLoading?: boolean;
}

export const LeadPerformanceSection: React.FC<LeadPerformanceSectionProps> = ({
  data,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const safeData = data || {
    total: 0,
    newLeads: 0,
    qualified: 0,
    inProgress: 0,
    converted: 0,
    lost: 0,
    conversionRate: 0,
  };

  const newLeads = Number(safeData.newLeads) || 0;
  const qualified = Number(safeData.qualified) || 0;
  const inProgress = Number(safeData.inProgress) || 0;
  const converted = Number(safeData.converted) || 0;
  const lost = Number(safeData.lost) || 0;
  const total = Number(safeData.total) || 0;
  const conversionRate = Number(safeData.conversionRate) || 0;

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground font-sans">
              {t('dashboard.frontOffice.leadPerformance.title', 'Lead Performance')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                'dashboard.frontOffice.leadPerformance.subtitle',
                'Lead status and qualification tracking',
              )}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-black">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>{conversionRate.toFixed(1)}% Conversion Rate</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-4">
          <div className="h-10 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
            <div className="h-16 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="space-y-5 mt-2">
          {/* Conversion Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>
                {t(
                  'dashboard.frontOffice.leadPerformance.conversionRate',
                  'Lead-to-App Conversion',
                )}
              </span>
              <span className="font-mono text-foreground font-extrabold">
                {converted} of {total} Converted
              </span>
            </div>
            <div className="h-3 w-full bg-muted/50 dark:bg-zinc-900 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(Math.max(conversionRate, 5), 100)}%` }}
              />
            </div>
          </div>

          {/* Micro Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {t('dashboard.frontOffice.leadPerformance.new', 'New')}
              </span>
              <p className="text-lg font-black text-foreground font-mono ltr-isolate mt-0.5">
                {newLeads.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-800/40">
              <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider block">
                {t('dashboard.frontOffice.leadPerformance.qualified', 'Qualified')}
              </span>
              <p className="text-lg font-black text-cyan-900 dark:text-cyan-200 font-mono ltr-isolate mt-0.5">
                {qualified.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
                {t('dashboard.frontOffice.leadPerformance.hot', 'In-Progress')}
              </span>
              <p className="text-lg font-black text-amber-900 dark:text-amber-200 font-mono ltr-isolate mt-0.5">
                {inProgress.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                {t('dashboard.frontOffice.leadPerformance.converted', 'Converted')}
              </span>
              <p className="text-lg font-black text-emerald-900 dark:text-emerald-200 font-mono ltr-isolate mt-0.5">
                {converted.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">
                {t('dashboard.frontOffice.leadPerformance.lost', 'Lost / Rejected')}
              </span>
              <p className="text-lg font-black text-rose-900 dark:text-rose-200 font-mono ltr-isolate mt-0.5">
                {lost.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Total Tracked
              </span>
              <p className="text-lg font-black text-foreground font-mono ltr-isolate mt-0.5">
                {total.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
