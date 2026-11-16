import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SpotlightCard } from '@/components/react-bits/SpotlightCard';
import { CountUp } from '@/components/react-bits/CountUp';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
    periodText?: string;
  };
  subtitle?: string;
  badgeText?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'info' | 'purple';
  onClick?: () => void;
  isLoading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-indigo-600 dark:text-indigo-400',
  iconBg = 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/60',
  trend,
  subtitle,
  badgeText,
  badgeVariant = 'default',
  onClick,
  isLoading = false,
}) => {
  const isPureNumber = typeof value === 'number';
  const numericParsed =
    typeof value === 'string' && !isNaN(Number(value.replace(/,/g, '')))
      ? Number(value.replace(/,/g, ''))
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <SpotlightCard
        onClick={onClick}
        spotlightColor="rgba(6, 63, 64, 0.08)"
        className={`p-5 bg-white dark:bg-black shadow-sm ${
          onClick ? 'cursor-pointer hover:shadow-md hover:border-border group' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
              {title}
            </p>
            {isLoading ? (
              <div className="h-8 w-24 bg-muted/50 dark:bg-zinc-900 rounded-lg animate-pulse my-1" />
            ) : (
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-mono ltr-isolate">
                {isPureNumber ? (
                  <CountUp to={value} />
                ) : numericParsed !== null ? (
                  <CountUp to={numericParsed} />
                ) : (
                  value
                )}
              </h3>
            )}
          </div>

          <div
            className={`p-3 rounded-xl border shrink-0 ${iconBg} ${iconColor} transition-transform ${
              onClick ? 'group-hover:scale-105' : ''
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-border/60 dark:border-zinc-850 flex items-center justify-between text-xs">
          {trend ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-extrabold text-[11px] ${
                  trend.isPositive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                    : trend.value === 0
                      ? 'bg-muted text-muted-foreground border border-border'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : trend.value === 0 ? (
                  <Minus className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="font-mono ltr-isolate">
                  {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
                </span>
              </span>
              {trend.periodText && (
                <span className="text-[11px] text-muted-foreground font-medium">
                  {trend.periodText}
                </span>
              )}
            </div>
          ) : subtitle ? (
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              {subtitle}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/80 font-medium">Live Snapshot</span>
          )}

          {badgeText && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                badgeVariant === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : badgeVariant === 'warning'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : badgeVariant === 'purple'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>
      </SpotlightCard>
    </motion.div>
  );
};
