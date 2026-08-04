import React from 'react';
import { Clock, ShieldAlert, AlertTriangle } from 'lucide-react';

interface SLAIndicatorProps {
    hoursRemaining: number;
    totalHours: number;
    compact?: boolean;
}

export function SLAIndicator({ hoursRemaining, totalHours, compact = false }: SLAIndicatorProps) {
    const percentage = Math.max(0, Math.min(100, (hoursRemaining / totalHours) * 100));
    
    // Status definitions
    let status: 'normal' | 'warning' | 'breached' = 'normal';
    if (hoursRemaining <= 0) {
        status = 'breached';
    } else if (percentage < 25) {
        status = 'warning';
    }

    const badgeStyles = {
        normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        breached: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
    };

    const textStyles = {
        normal: 'text-emerald-500',
        warning: 'text-amber-500',
        breached: 'text-rose-500 font-bold'
    };

    if (compact) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase border ${badgeStyles[status]}`}>
                {status === 'breached' ? (
                    <ShieldAlert className="w-3.5 h-3.5" />
                ) : status === 'warning' ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                    <Clock className="w-3.5 h-3.5" />
                )}
                {status === 'breached' ? 'Breached' : `${hoursRemaining}h left`}
            </span>
        );
    }

    return (
        <div className="space-y-1.5 p-3.5 bg-gray-50/60 dark:bg-muted/10 border border-gray-150 dark:border-border/40 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-500">
                <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> SLA Timing Status
                </span>
                <span className={textStyles[status]}>
                    {status === 'breached' ? 'SLA BREACHED' : `${hoursRemaining} hours left of ${totalHours}h`}
                </span>
            </div>
            
            <div className="h-2 w-full bg-gray-200/60 dark:bg-muted/20 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                        status === 'breached' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export default SLAIndicator;
