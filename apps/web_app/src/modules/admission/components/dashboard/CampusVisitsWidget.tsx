import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Calendar, MapPin, Video, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LeadVisitItem } from '@/shared/api/crm.api';

export interface CampusVisitsWidgetProps {
  metrics: {
    today: number;
    upcoming: number;
    completed: number;
    cancelledOrNoShow: number;
  };
  upcomingVisits: LeadVisitItem[];
  onScheduleClick?: () => void;
  onViewAllClick?: () => void;
  isLoading?: boolean;
}

export const CampusVisitsWidget: React.FC<CampusVisitsWidgetProps> = ({
  metrics,
  upcomingVisits = [],
  onScheduleClick,
  onViewAllClick,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const formatVisitTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatVisitDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground font-sans">
              {t('dashboard.frontOffice.campusVisits.title', 'Campus Visits & Sessions')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                'dashboard.frontOffice.campusVisits.subtitle',
                'Scheduled walk-ins and virtual counselling',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onScheduleClick && (
            <Button
              size="sm"
              onClick={onScheduleClick}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('dashboard.frontOffice.campusVisits.scheduleVisit', 'Schedule')}</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-4">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-28 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4 mt-1">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {t('dashboard.frontOffice.campusVisits.scheduled', 'Today')}
              </span>
              <p className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                {metrics.today}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-800/40 text-center">
              <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider block">
                {t('dashboard.frontOffice.campusVisits.upcoming', 'Upcoming')}
              </span>
              <p className="text-base font-black text-cyan-900 dark:text-cyan-200 font-mono mt-0.5">
                {metrics.upcoming}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-center">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                {t('dashboard.frontOffice.campusVisits.completed', 'Completed')}
              </span>
              <p className="text-base font-black text-emerald-900 dark:text-emerald-200 font-mono mt-0.5">
                {metrics.completed}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Cancelled/No-Show
              </span>
              <p className="text-base font-black text-foreground font-mono mt-0.5">
                {metrics.cancelledOrNoShow}
              </p>
            </div>
          </div>

          {/* Upcoming Schedule Mini-List */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
              <span>{t('dashboard.frontOffice.campusVisits.upcomingVisits', 'Upcoming Visits')}</span>
              {onViewAllClick && (
                <button
                  onClick={onViewAllClick}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {upcomingVisits.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-border rounded-xl space-y-1">
                <Calendar className="w-6 h-6 text-muted-foreground/40 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.frontOffice.campusVisits.noUpcoming', 'No upcoming campus visits scheduled.')}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pe-1">
                {upcomingVisits.slice(0, 4).map((visit) => {
                  const leadObj: any = visit.leads || visit.lead;
                  const student = leadObj?.student_first_name
                    ? `${leadObj.student_first_name} ${leadObj.student_last_name || ''}`.trim()
                    : leadObj?.student_name || 'Applicant';
                  const leadNo = leadObj?.lead_number || '';
                  const isVirtual = visit.visit_type === 'virtual';

                  return (
                    <div
                      key={visit.visit_id}
                      className="p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/60 flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isVirtual
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                              : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                          }`}
                        >
                          {isVirtual ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{student}</p>
                          <p className="text-[10px] text-muted-foreground font-mono ltr-isolate truncate">
                            {leadNo}
                          </p>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <p className="font-bold text-foreground font-mono ltr-isolate text-[11px]">
                          {formatVisitDate(visit.scheduled_at)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono ltr-isolate">
                          {formatVisitTime(visit.scheduled_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
