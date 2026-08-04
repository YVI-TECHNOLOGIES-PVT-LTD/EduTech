import React, { useMemo } from 'react';
import { TrendingUp, Clock, AlertTriangle, UserCheck } from 'lucide-react';
import FunnelChart from './FunnelChart';
import { useAdmission } from '../../hooks/useAdmission';
import { useApplicationList } from '../../hooks/useApplication';
import { buildFunnelFromApplications, mapStatsToExecutiveKpis } from '../../utils/admissionIntegration.mapper';

const STAT_ICONS = [TrendingUp, Clock, AlertTriangle, UserCheck];
const STAT_COLORS = [
    'text-indigo-600 bg-indigo-50 border-indigo-100',
    'text-emerald-600 bg-emerald-50 border-emerald-100',
    'text-rose-600 bg-rose-50 border-rose-100',
    'text-amber-600 bg-amber-50 border-amber-100',
];

export function ExecutiveAnalytics() {
    const { stats, isLoading: statsLoading } = useAdmission();
    const { applications, isLoading: appsLoading } = useApplicationList({ limit: 500 });

    const kpiTiles = useMemo(() => mapStatsToExecutiveKpis(stats as Record<string, unknown>), [stats]);
    const funnelData = useMemo(() => buildFunnelFromApplications(applications), [applications]);

    const isLoading = statsLoading || appsLoading;

    if (isLoading) {
        return <p className="text-xs text-gray-400 animate-pulse py-8 text-center">Loading executive analytics…</p>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiTiles.map((stat, idx) => {
                    const Icon = STAT_ICONS[idx] ?? TrendingUp;
                    return (
                        <div key={stat.title} className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 rounded-2xl p-5 shadow-sm flex items-start justify-between">
                            <div className="space-y-2">
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">
                                    {stat.title}
                                </span>
                                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">{stat.value}</h3>
                                <span className="text-[10px] text-gray-400 font-bold">{stat.change}</span>
                            </div>
                            <span className={`p-2.5 rounded-xl border ${STAT_COLORS[idx] ?? STAT_COLORS[0]}`}>
                                <Icon className="w-5 h-5" />
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-card border border-gray-150 dark:border-border/60 p-6 rounded-2xl shadow-sm">
                    {funnelData.every(f => f.count === 0) ? (
                        <p className="text-xs text-gray-400 py-12 text-center">No pipeline data yet.</p>
                    ) : (
                        <FunnelChart data={funnelData} />
                    )}
                </div>

                <div className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">Pipeline Stage Counts</h4>
                    <div className="space-y-3 text-xs">
                        {funnelData.map(item => (
                            <div key={item.stage} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                                <span className="font-bold text-gray-700 dark:text-gray-300">{item.stage}</span>
                                <span className="font-black text-indigo-600">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExecutiveAnalytics;
