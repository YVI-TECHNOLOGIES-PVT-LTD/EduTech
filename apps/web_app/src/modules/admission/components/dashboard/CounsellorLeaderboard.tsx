import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Award, User } from 'lucide-react';

export interface CounsellorMetricItem {
  id: string;
  name: string;
  leadsCount: number;
  appsCount: number;
  conversionsCount: number;
}

export interface CounsellorLeaderboardProps {
  counsellors: CounsellorMetricItem[];
  isLoading?: boolean;
}

export const CounsellorLeaderboard: React.FC<CounsellorLeaderboardProps> = ({
  counsellors = [],
  isLoading = false,
}) => {
  const { t } = useLanguage();

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground font-sans">
              {t('dashboard.frontOffice.counsellorPerformance.title', 'Counsellor Performance')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                'dashboard.frontOffice.counsellorPerformance.subtitle',
                'Lead handling and application conversion by counsellor',
              )}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60 shrink-0">
          Admissions Team
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : counsellors.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center text-center p-4 space-y-1.5 border border-dashed border-border rounded-xl">
          <User className="w-7 h-7 text-muted-foreground/40 mx-auto" />
          <p className="text-xs font-bold text-foreground">
            {t('dashboard.frontOffice.counsellorPerformance.noData', 'No counsellor metrics available.')}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Counsellor assignments and metrics will appear as leads are distributed.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pe-1">
          {counsellors.map((c, index) => (
            <div
              key={c.id}
              className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/60 flex items-center justify-between gap-3 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-[11px] shrink-0 border border-indigo-200 dark:border-indigo-800 font-mono ltr-isolate">
                  {index + 1}
                </div>
                <p className="font-bold text-foreground truncate">{c.name}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-end">
                  <span className="text-[10px] text-muted-foreground uppercase block">
                    {t('dashboard.frontOffice.counsellorPerformance.leads', 'Leads')}
                  </span>
                  <span className="font-mono font-bold text-foreground ltr-isolate">{c.leadsCount}</span>
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-muted-foreground uppercase block">
                    {t('dashboard.frontOffice.counsellorPerformance.applications', 'Apps')}
                  </span>
                  <span className="font-mono font-bold text-foreground ltr-isolate">{c.appsCount}</span>
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">
                    {t('dashboard.frontOffice.counsellorPerformance.conversions', 'Conversions')}
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 ltr-isolate">
                    {c.conversionsCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
