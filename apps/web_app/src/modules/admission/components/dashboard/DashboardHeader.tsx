import React from 'react';
import { Sparkles, RefreshCw, Calendar as CalendarIcon, Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/context/LanguageContext';
import { FadeContent } from '@/components/react-bits/FadeContent';

export type DateRangeOption =
  | 'today'
  | 'yesterday'
  | 'last7Days'
  | 'last30Days'
  | 'thisMonth'
  | 'prevMonth'
  | 'thisAcademicYear'
  | 'customRange';

export interface DashboardHeaderProps {
  userName: string;
  userRole?: string;
  dateRange: DateRangeOption;
  onDateRangeChange: (range: DateRangeOption) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExport?: () => void;
  customTabs?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  userRole = 'Front Office Desk',
  dateRange,
  onDateRangeChange,
  onRefresh,
  isRefreshing = false,
  onExport,
  customTabs,
}) => {
  const { t, formatDate } = useLanguage();

  const todayFormatted = formatDate(new Date(), {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-black text-foreground dark:text-white shadow-sm relative overflow-hidden border border-border/80 dark:border-zinc-800 transition-colors">
      {/* Subtle executive top border accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 opacity-80" />

      {/* Top Meta & Executive Controls Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-border/60 dark:border-zinc-850">
        {/* Left / Start: Operations Badge & Today Date */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/80 dark:border-indigo-800/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>{t('dashboard.frontOffice.title', 'Front Office Operations')}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 dark:bg-zinc-900/80 text-muted-foreground dark:text-zinc-300 text-xs font-medium border border-border/60 dark:border-zinc-800">
            <CalendarIcon className="w-3 h-3 text-muted-foreground" />
            <span>{todayFormatted}</span>
          </div>
        </div>

        {/* Right / End: Executive Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-muted/40 dark:bg-zinc-900/90 rounded-xl border border-border/80 dark:border-zinc-800 p-0.5">
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground ms-2.5 shrink-0" />
            <Select
              value={dateRange}
              onValueChange={(val) => onDateRangeChange(val as DateRangeOption)}
            >
              <SelectTrigger className="h-8.5 w-40 bg-transparent border-0 text-foreground dark:text-white text-xs font-bold focus:ring-0 focus:ring-offset-0 shadow-none">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-950 border-border dark:border-zinc-800 text-foreground dark:text-zinc-100">
                <SelectItem value="today" className="text-xs">
                  {t('dashboard.frontOffice.dateRanges.today', 'Today')}
                </SelectItem>
                <SelectItem value="yesterday" className="text-xs">
                  {t('dashboard.frontOffice.dateRanges.yesterday', 'Yesterday')}
                </SelectItem>
                <SelectItem value="last7Days" className="text-xs">
                  {t('dashboard.frontOffice.dateRanges.last7Days', 'Last 7 Days')}
                </SelectItem>
                <SelectItem value="last30Days" className="text-xs">
                  {t('dashboard.frontOffice.dateRanges.last30Days', 'Last 30 Days')}
                </SelectItem>
                <SelectItem value="thisMonth" className="text-xs">
                  {t('dashboard.frontOffice.dateRanges.thisMonth', 'This Month')}
                </SelectItem>
                <SelectItem value="prevMonth" className="text-xs">
                  {t('dashboard.frontOffice.dateRanges.prevMonth', 'Previous Month')}
                </SelectItem>
                <SelectItem value="thisAcademicYear" className="text-xs">
                  {t('dashboard.frontOffice.dateRanges.thisAcademicYear', 'This Academic Year')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Action */}
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="h-8.5 px-3 rounded-xl bg-muted/40 dark:bg-zinc-900/90 hover:bg-muted dark:hover:bg-zinc-800 border-border/80 dark:border-zinc-800 text-foreground dark:text-white gap-1.5 font-bold text-xs shadow-none"
            title="Refresh All Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>
              {isRefreshing
                ? t('dashboard.frontOffice.refreshing', 'Refreshing...')
                : t('dashboard.frontOffice.refresh', 'Refresh')}
            </span>
          </Button>

          {/* Export Action */}
          {onExport && (
            <Button
              onClick={onExport}
              variant="outline"
              size="sm"
              className="h-8.5 px-3 rounded-xl bg-muted/40 dark:bg-zinc-900/90 hover:bg-muted dark:hover:bg-zinc-800 border-border/80 dark:border-zinc-800 text-foreground dark:text-white gap-1.5 font-bold text-xs shadow-none"
              title="Export Dashboard Metrics"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t('dashboard.frontOffice.export', 'Export Summary')}</span>
            </Button>
          )}

          {/* Persona Badge */}
          <div className="hidden xl:inline-flex items-center gap-1.5 bg-muted/40 dark:bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-border/80 dark:border-zinc-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              {userRole}
            </span>
          </div>
        </div>
      </div>

      {/* Main Greeting & Subtitle Area */}
      <FadeContent
        direction="up"
        duration={0.35}
        className="pt-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-3"
      >
        <div className="space-y-1 max-w-4xl">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-sans truncate">
            {t('dashboard.frontOffice.goodDay', 'Good day')}, {userName}
          </h1>
          <p className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed max-w-3xl">
            {t(
              'dashboard.frontOffice.subtitle',
              'Operational admissions command center for inquiries, leads, applications, documents, payments, campus visits, and admissions.',
            )}
          </p>
        </div>

        {/* Mobile Persona Badge */}
        <div className="xl:hidden inline-flex items-center gap-1.5 bg-muted/40 dark:bg-zinc-900/90 px-2.5 py-1 rounded-lg border border-border/80 dark:border-zinc-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
            {userRole}
          </span>
        </div>
      </FadeContent>

      {/* Optional Contextual Tabs */}
      {customTabs && (
        <div className="mt-4 pt-3 border-t border-border/60 dark:border-zinc-850 overflow-x-auto scrollbar-hide">
          {customTabs}
        </div>
      )}
    </header>
  );
};
