import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Sparkles,
  UserPlus,
  FilePlus,
  Receipt,
  Calendar,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export interface QuickActionItemConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  color: string;
  bgColor: string;
  permission?: string;
}

export interface QuickActionsGridProps {
  onNewLead: () => void;
  onNewApplication: () => void;
  onCollectFee: () => void;
  onScheduleVisit: () => void;
  onVerifyDocs: () => void;
  onViewApplications: () => void;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  onNewLead,
  onNewApplication,
  onCollectFee,
  onScheduleVisit,
  onVerifyDocs,
  onViewApplications,
}) => {
  const { t } = useLanguage();

  const actions = [
    {
      id: 'new_lead',
      title: t('dashboard.frontOffice.quickActions.newLead', 'New Lead / Enquiry'),
      description: 'Record candidate inquiry or direct walk-in',
      icon: UserPlus,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900',
      onClick: onNewLead,
    },
    {
      id: 'new_app',
      title: t('dashboard.frontOffice.quickActions.newApplication', 'New Application'),
      description: 'Create new candidate application form',
      icon: FilePlus,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-100 dark:border-cyan-900',
      onClick: onNewApplication,
    },
    {
      id: 'schedule_visit',
      title: t('dashboard.frontOffice.quickActions.scheduleVisit', 'Schedule Visit'),
      description: 'Book campus tour or counselling session',
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900',
      onClick: onScheduleVisit,
    },
    {
      id: 'collect_fee',
      title: t('dashboard.frontOffice.quickActions.collectFee', 'Collect Fee'),
      description: 'Record admission or processing payment',
      icon: Receipt,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900',
      onClick: onCollectFee,
    },
    {
      id: 'verify_docs',
      title: t('dashboard.frontOffice.quickActions.verifyDocs', 'Verify Documents'),
      description: 'Review pending applicant certificates',
      icon: CheckCircle2,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900',
      onClick: onVerifyDocs,
    },
    {
      id: 'view_apps',
      title: t('dashboard.frontOffice.quickActions.viewApplications', 'View Applications'),
      description: 'Open full admissions pipeline queue',
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900',
      onClick: onViewApplications,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {t('dashboard.frontOffice.quickActions.title', 'Quick Actions')}
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border/60">
          Front Office Shortcuts
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="p-4 rounded-2xl bg-white dark:bg-black border border-border/80 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-zinc-700 transition-all text-start group flex flex-col justify-between"
            >
              <div
                className={`w-9 h-9 rounded-xl ${action.bgColor} ${action.color} flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform border`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-foreground text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {action.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
