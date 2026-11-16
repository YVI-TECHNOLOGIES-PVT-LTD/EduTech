import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Filter, ArrowDown, Sparkles } from 'lucide-react';

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  color?: string;
}

export interface AdmissionConversionFunnelProps {
  stages: FunnelStage[];
  isLoading?: boolean;
}

export const AdmissionConversionFunnel: React.FC<AdmissionConversionFunnelProps> = ({
  stages,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const firstCount = stages[0]?.count || 0;
  const lastCount = stages[stages.length - 1]?.count || 0;
  const overallRate = firstCount > 0 ? ((lastCount / firstCount) * 100).toFixed(1) : '0.0';

  const defaultColors = [
    'bg-indigo-600',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-emerald-600',
  ];

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground font-sans">
              {t('dashboard.frontOffice.funnel.title', 'Admission Conversion Funnel')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                'dashboard.frontOffice.funnel.subtitle',
                'Stage-by-stage progression from initial inquiry to enrollment',
              )}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-black">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span className="ltr-isolate font-mono">{overallRate}%</span>
          <span>{t('dashboard.frontOffice.funnel.overallConversion', 'Overall Conversion')}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stages.every((s) => s.count === 0) ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-border rounded-xl">
          <Filter className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <p className="text-xs font-bold text-foreground">
            {t('dashboard.frontOffice.funnel.noData', 'Pipeline data not yet available.')}
          </p>
          <p className="text-[11px] text-muted-foreground">
            As candidate inquiries advance through qualification and review, the funnel will visualize stage velocity.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 mt-2">
          {stages.map((stage, index) => {
            const widthPct = Math.max(Math.round((stage.count / maxCount) * 100), 12);
            const prevCount = index > 0 ? stages[index - 1].count : 0;
            const stepConversion =
              index > 0 && prevCount > 0
                ? `${((stage.count / prevCount) * 100).toFixed(1)}%`
                : null;
            const colorBg = stage.color || defaultColors[index % defaultColors.length];
            const translatedLabel = t(`dashboard.frontOffice.funnel.stages.${stage.stage}`, stage.label);

            return (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{translatedLabel}</span>
                    {stepConversion && (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60 flex items-center gap-0.5 font-mono ltr-isolate">
                        <ArrowDown className="w-2.5 h-2.5 text-muted-foreground" />
                        {stepConversion}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-extrabold text-foreground ltr-isolate">
                    {stage.count.toLocaleString()}
                  </span>
                </div>

                <div className="h-3 w-full bg-muted/50 dark:bg-zinc-900 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full ${colorBg} transition-all duration-500`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
