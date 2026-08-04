import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '../../../components/ui/skeleton';
import type { DashboardChart } from '../../dashboard/types/dashboard.types';

interface ExecutiveChartsProps {
    charts: DashboardChart[];
    loading?: boolean;
}

export function ExecutiveCharts({ charts, loading }: ExecutiveChartsProps) {
    const chartData = useMemo(() => {
        const first = charts[0];
        if (!first?.data?.length) return [];
        const seriesKey = first.series[0]?.key || 'value';
        return first.data.map(point => ({
            name: point.name,
            value: Number(point[seriesKey]) || 0,
        }));
    }, [charts]);

    if (loading) return <Skeleton className="h-64 rounded-2xl" />;

    if (chartData.length === 0) {
        return (
            <div className="bg-card border border-border rounded-2xl p-6 h-64 flex items-center justify-center text-xs text-muted-foreground italic">
                No chart data available
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-xs font-black uppercase tracking-wider mb-4">
                {charts[0]?.title || 'Cross-Module Trends'}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
