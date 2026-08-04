import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Activity, Clock, CheckCircle2, TrendingUp, Sparkles, Award,
    BookOpen, ShieldAlert, BarChart3, PieChart
} from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart as RePieChart, Pie, Cell } from 'recharts';

export const WorkflowAnalytics = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/v1/workflows/analytics')
            .then(res => setAnalytics(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Analytics Data...</p>
        </div>
    );

    const kpis: { label: string; value: string | number; icon: any; color: string }[] = [
        { label: 'Average Completion', value: `${analytics?.averageCompletionHours || 0} hrs`, icon: Clock, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
        { label: 'SLA Compliance Ratio', value: `${analytics?.slaCompliancePercent || 100}%`, icon: Award, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
        { label: 'Total Scanned Runs', value: (Object.values(analytics?.counts || {}).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number), icon: BookOpen, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
    ];

    const kpiElements = kpis.map((c, i) => (
        <div key={i} className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 card-hover-lift flex flex-col justify-between">
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${c.color}`}>
                    <c.icon className="w-6 h-6" />
                </div>
            </div>

            <div className="mt-5 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                    {c.label}
                </p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        {c.value}
                    </span>
                </div>
            </div>
        </div>
    ));

    const counts = analytics?.counts || {};
    const chartData = [
        { name: 'Completed', count: counts.completed || 0 },
        { name: 'Running', count: counts.running || 0 },
        { name: 'Waiting', count: counts.waiting || 0 },
        { name: 'Escalated', count: counts.escalated || 0 },
        { name: 'Failed', count: counts.failed || 0 },
        { name: 'Cancelled', count: counts.cancelled || 0 }
    ].filter(item => item.count > 0);

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#6B7280'];

    return (
        <PageWrapper
            title="Workflows Analytics"
            description="Statistical diagnostics, SLA breach histories, and operational drop ratios."
            icon={Sparkles}
            kpis={<>{kpiElements}</>}
            timeline={
                <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider pb-4 border-b border-border/40 flex items-center gap-2">
                        <PieChart className="w-4.5 h-4.5 text-primary" />
                        Run Status Distribution
                    </h3>
                    <div className="h-56 flex items-center justify-center">
                        {chartData.length === 0 ? (
                            <p className="text-xs font-bold text-muted-foreground italic">No historical runs logs to map.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="count"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend formatter={(val) => <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{val}</span>} />
                                </RePieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            }
        >
            <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                <h3 className="text-xs font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider pb-4 border-b border-border/40 flex items-center gap-2">
                    <BarChart3 className="w-4.5 h-4.5 text-primary" />
                    SLA Ratios Bar Overview
                </h3>
                <div className="h-64">
                    {chartData.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-border/60 rounded-2xl">
                            <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-xs font-bold text-muted-foreground italic">No data entries recorded.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" stroke="currentColor" className="text-[10px] text-muted-foreground" />
                                <YAxis stroke="currentColor" className="text-[10px] text-muted-foreground" />
                                <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', borderRadius: '12px' }} />
                                <Bar dataKey="count" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};
export default WorkflowAnalytics;
