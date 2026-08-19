import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Clock, PhoneCall, Mail, MessageSquare, Calendar, FileText, ArrowRight } from 'lucide-react';
import type { LeadActivityItem } from '@/shared/api/crm.api';

export interface UpcomingActivitiesWidgetProps {
  activities: LeadActivityItem[];
  onViewAllClick?: () => void;
  isLoading?: boolean;
}

export const UpcomingActivitiesWidget: React.FC<UpcomingActivitiesWidgetProps> = ({
  activities = [],
  onViewAllClick,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'phone_call':
        return <PhoneCall className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'counselling':
      case 'follow_up':
        return <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    }
  };

  const formatActivityDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground font-sans">
              {t('dashboard.frontOffice.upcomingActivities.title', 'Upcoming Activities')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                'dashboard.frontOffice.upcomingActivities.subtitle',
                'Actionable admissions agenda and candidate follow-ups',
              )}
            </p>
          </div>
        </div>

        {onViewAllClick && (
          <button
            onClick={onViewAllClick}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 shrink-0"
          >
            All Queue <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 py-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center p-4 space-y-1.5 border border-dashed border-border rounded-xl">
          <Clock className="w-7 h-7 text-muted-foreground/40 mx-auto" />
          <p className="text-xs font-bold text-foreground">
            {t('dashboard.frontOffice.upcomingActivities.noActivities', 'No upcoming activities due.')}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Scheduled follow-ups and applicant check-ins will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 mt-1">
          {activities.slice(0, 5).map((act) => {
            const leadObj: any = act.leads || act.lead;
            const student = leadObj?.student_first_name
              ? `${leadObj.student_first_name} ${leadObj.student_last_name || ''}`.trim()
              : leadObj?.student_name || 'Candidate';
            const leadNo = leadObj?.lead_number || '';
            const phone = leadObj?.contact_phone || '';

            return (
              <div
                key={act.activity_id}
                className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/60 flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-background border border-border shrink-0">
                    {getActivityIcon(act.activity_type)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{student}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {act.notes || (
                        <span className="capitalize">{act.activity_type.replace(/_/g, ' ')}</span>
                      )}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-mono ltr-isolate">
                      {leadNo} {phone ? `· ${phone}` : ''}
                    </span>
                  </div>
                </div>

                <div className="text-end shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono ltr-isolate">
                    {t('dashboard.frontOffice.upcomingActivities.due', 'Due')}{' '}
                    {formatActivityDate(act.next_followup_date || act.activity_date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
