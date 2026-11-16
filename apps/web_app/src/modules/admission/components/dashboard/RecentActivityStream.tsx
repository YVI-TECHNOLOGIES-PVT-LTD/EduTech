import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Activity, UserPlus, FileText, CheckCircle2, Receipt, Calendar } from 'lucide-react';

export interface RecentActivityItem {
  id: string;
  type: 'lead_created' | 'application_submitted' | 'doc_verified' | 'payment_received' | 'visit_scheduled' | 'general';
  title: string;
  description: string;
  entityId?: string;
  timestamp: string;
}

export interface RecentActivityStreamProps {
  activities: RecentActivityItem[];
  isLoading?: boolean;
}

export const RecentActivityStream: React.FC<RecentActivityStreamProps> = ({
  activities = [],
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const getRelativeTime = (timeStr: string) => {
    try {
      const now = new Date().getTime();
      const past = new Date(timeStr).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 60) return t('dashboard.frontOffice.recentActivity.justNow', 'Just now');
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay === 1) return 'Yesterday';
      return `${diffDay}d ago`;
    } catch {
      return timeStr;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_created':
        return <UserPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      case 'application_submitted':
        return <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />;
      case 'doc_verified':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'payment_received':
        return <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'visit_scheduled':
        return <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-border/80 dark:border-zinc-800 bg-white dark:bg-black shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground font-sans">
              {t('dashboard.frontOffice.recentActivity.title', 'Recent Activity')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                'dashboard.frontOffice.recentActivity.subtitle',
                'Live event timeline across front office workflows',
              )}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60 shrink-0">
          Live Stream
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-muted/40 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center p-4 space-y-1.5 border border-dashed border-border rounded-xl">
          <Activity className="w-7 h-7 text-muted-foreground/40 mx-auto" />
          <p className="text-xs font-bold text-foreground">
            {t('dashboard.frontOffice.recentActivity.noActivity', 'No recent activity recorded.')}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Admissions actions and candidate status changes will stream here live.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pe-1">
          {activities.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/60 flex items-start justify-between gap-3 text-xs transition-colors"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-background border border-border shrink-0 mt-0.5">
                  {getActivityIcon(item.type)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</p>
                  {item.entityId && (
                    <span className="text-[10px] font-mono text-muted-foreground/90 ltr-isolate">
                      ID: {item.entityId}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5 font-mono ltr-isolate">
                {getRelativeTime(item.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
