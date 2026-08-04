import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface AnalyticsInsightProps {
    label: string;
    value: string | number;
    subtext?: string;
    trend?: {
        direction: 'up' | 'down' | 'neutral';
        percentage?: number;
        label?: string;
    };
    icon?: LucideIcon;
    accent?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'indigo';
}

const ACCENT_MAP = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/20',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-900/20',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-900/20',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/10 dark:text-indigo-400 dark:border-indigo-900/20',
};

export const AnalyticsCard: React.FC<AnalyticsInsightProps> = ({
    label,
    value,
    subtext,
    trend,
    icon: Icon,
    accent = 'blue'
}) => {
    const TrendIcon = trend?.direction === 'up' ? TrendingUp
        : trend?.direction === 'down' ? TrendingDown
        : Minus;

    const trendColor = trend?.direction === 'up' ? 'text-emerald-600'
        : trend?.direction === 'down' ? 'text-rose-600'
        : 'text-muted-foreground';

    return (
        <div className="bg-white dark:bg-card border border-border/40 rounded-2xl p-5 shadow-premium-sm flex flex-col gap-3 hover:shadow-premium-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {label}
                </span>
                {Icon && (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${ACCENT_MAP[accent]}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                )}
            </div>
            <p className="text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                {value}
            </p>
            <div className="flex items-center justify-between">
                {subtext && (
                    <span className="text-[11px] text-muted-foreground font-semibold">{subtext}</span>
                )}
                {trend && (
                    <span className={`flex items-center gap-1 text-[11px] font-black ${trendColor}`}>
                        <TrendIcon className="w-3.5 h-3.5" />
                        {trend.percentage != null && `${trend.percentage}%`}
                        {trend.label && ` ${trend.label}`}
                    </span>
                )}
            </div>
        </div>
    );
};

export default AnalyticsCard;
