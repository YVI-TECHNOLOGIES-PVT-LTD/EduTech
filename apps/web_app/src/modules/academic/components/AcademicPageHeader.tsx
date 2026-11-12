import React from 'react';
import { LucideIcon, RefreshCw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AcademicPageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onRefresh?: () => void;
  loading?: boolean;
  actions?: React.ReactNode;
  badgeText?: string;
}

export const AcademicPageHeader: React.FC<AcademicPageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  onRefresh,
  loading = false,
  actions,
  badgeText,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-foreground">{title}</h1>
              {badgeText && (
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                  {badgeText}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        {actions}
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="gap-2 font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
};

export const AcademicStatusBanner: React.FC<{
  error?: string | null;
  success?: string | null;
  info?: string | null;
}> = ({ error, success, info }) => {
  if (!error && !success && !info) return null;

  return (
    <div className="space-y-2">
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-center gap-2.5 text-sm"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-sm"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {info && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 flex items-center gap-2.5 text-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>{info}</span>
        </div>
      )}
    </div>
  );
};

export function getAcademicStatusBadgeClass(status?: string | null): string {
  const normalized = (status || '').toLowerCase();
  if (
    normalized === 'teaching' ||
    normalized === 'active' ||
    normalized === 'published' ||
    normalized === 'passed' ||
    normalized === 'ready' ||
    normalized === 'ready_to_publish' ||
    normalized === 'balanced'
  ) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
  }
  if (
    normalized === 'open' ||
    normalized === 'review' ||
    normalized === 'approved' ||
    normalized === 'needs_attention' ||
    normalized === 'needs_review' ||
    normalized === 'warning' ||
    normalized === 'light'
  ) {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
  }
  if (
    normalized === 'blocked' ||
    normalized === 'failed' ||
    normalized === 'error' ||
    normalized === 'heavy'
  ) {
    return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
}

export function formatShortDate(dateValue?: string | null): string {
  if (!dateValue) return '—';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
