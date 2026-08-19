import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Zap, ArrowRight } from 'lucide-react';

export interface ConversionMetricsData {
  leadToAppRate: number;
  appToSubmitRate: number;
  submitToAdmitRate: number;
  admitToEnrollRate: number;
}

export interface ConversionMetricsBarProps {
  data: ConversionMetricsData;
  isLoading?: boolean;
}

export const ConversionMetricsBar: React.FC<ConversionMetricsBarProps> = ({
  data,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const metrics = [
    {
      label: t('dashboard.frontOffice.conversionMetrics.leadToApp', 'Lead → Application'),
      rate: data.leadToAppRate,
      color: 'bg-indigo-500',
    },
    {
      label: t('dashboard.frontOffice.conversionMetrics.appToSubmit', 'Application → Submission'),
      rate: data.appToSubmitRate,
      color: 'bg-cyan-500',
    },
    {
      label: t('dashboard.frontOffice.conversionMetrics.submitToAdmit', 'Submission → Admission'),
      rate: data.submitToAdmitRate,
      color: 'bg-amber-500',
    },
    {
      label: t('dashboard.frontOffice.conversionMetrics.admitToEnroll', 'Admission → Enrollment'),
      rate: data.admitToEnrollRate,
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground font-sans">
              Workflow Stage Velocity & Conversion
            </h3>
            <p className="text-xs text-muted-foreground">
              Micro-conversion efficiency across admissions lifecycle milestones
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground truncate">{m.label}</span>
                <span className="font-mono font-extrabold text-foreground ms-2 ltr-isolate">
                  {m.rate.toFixed(1)}%
                </span>
              </div>

              <div className="h-2 w-full bg-muted dark:bg-zinc-900 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full ${m.color} transition-all duration-500`}
                  style={{ width: `${Math.min(Math.max(m.rate, 2), 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
