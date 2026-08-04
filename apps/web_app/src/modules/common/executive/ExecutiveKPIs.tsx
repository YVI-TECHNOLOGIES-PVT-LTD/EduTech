import React from 'react';
import { Skeleton } from '../../../components/ui/skeleton';
import type { DashboardCard } from '../../dashboard/types/dashboard.types';

interface ExecutiveKPIsProps {
    kpis: DashboardCard[];
    loading?: boolean;
}

export function ExecutiveKPIs({ kpis, loading }: ExecutiveKPIsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
            </div>
        );
    }

    const display = kpis.slice(0, 8);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {display.map(kpi => (
                <div key={kpi.id} className="bg-card border border-border rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {kpi.label}
                    </p>
                    <p className="text-2xl font-black mt-2">{kpi.value}</p>
                    {kpi.trend && (
                        <p
                            className={`text-[10px] font-bold mt-1 ${
                                kpi.trend.direction === 'up'
                                    ? 'text-emerald-600'
                                    : kpi.trend.direction === 'down'
                                      ? 'text-red-600'
                                      : 'text-muted-foreground'
                            }`}
                        >
                            {kpi.trend.label || `${kpi.trend.percentage ?? kpi.trend.value}%`}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
