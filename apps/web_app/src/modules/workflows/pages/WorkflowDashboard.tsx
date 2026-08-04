import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Activity, Clock, CheckCircle2, AlertTriangle, Play, FileText,
    ArrowRight, Sparkles, Filter, Search, RotateCcw, AlertOctagon, Trash2
} from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

export const WorkflowDashboard = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [runs, setRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const load = async () => {
            try {
                const [analRes, runsRes] = await Promise.all([
                    apiClient.get('/v1/workflows/analytics'),
                    apiClient.get('/v1/workflows/runs')
                ]);
                setAnalytics(analRes.data);
                setRuns(runsRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Automation Dashboard...</p>
        </div>
    );

    const counts = analytics?.counts || {};
    const kpis = [
        { label: 'Active Runs', value: counts.running || 0, icon: Play, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
        { label: 'Pending Approvals', value: counts.waiting || 0, icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
        { label: 'SLA Compliance', value: `${analytics?.slaCompliancePercent || 100}%`, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
        { label: 'System Errors / DLQ', value: counts.failed || 0, icon: AlertOctagon, color: 'text-red-500 bg-red-500/10 border-red-500/20' }
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

    const filteredRuns = runs.filter(r => statusFilter === 'all' || r.status === statusFilter);

    // Mock trend database for Recharts area representation
    const trendData = [
        { name: 'Mon', active: 4 },
        { name: 'Tue', active: 7 },
        { name: 'Wed', active: 5 },
        { name: 'Thu', active: 8 },
        { name: 'Fri', active: 12 },
        { name: 'Sat', active: 9 },
        { name: 'Sun', active: 15 }
    ];

    return (
        <PageWrapper
            title="Workflows Dashboard"
            description="Track, orchestrate, and audit automated business run cycles across campuses."
            icon={Sparkles}
            kpis={<>{kpiElements}</>}
            timeline={
                <div className="space-y-6">
                    <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                        <h3 className="text-xs font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider pb-4 border-b border-border/40 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            Workflows Activity Spark
                        </h3>
                        <div className="h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="currentColor" className="text-[10px] text-muted-foreground" />
                                    <YAxis stroke="currentColor" className="text-[10px] text-muted-foreground" />
                                    <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="active" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="space-y-6 lg:space-y-8">
                {/* Filters Row */}
                <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-5 shadow-premium-sm flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2">
                        {['all', 'running', 'waiting', 'completed', 'escalated', 'failed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                                    statusFilter === status
                                        ? 'bg-primary text-primary-foreground border-transparent'
                                        : 'bg-gray-50/50 dark:bg-muted/10 border-border/50 text-muted-foreground hover:bg-white dark:hover:bg-card'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Workflow Runs Logs */}
                <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider pb-4 border-b border-border/40 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Run Records List
                    </h3>

                    {filteredRuns.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-border/60 rounded-2xl">
                            <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-xs font-bold text-muted-foreground italic">No workflow runs found matching status filters.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRuns.map((run, i) => {
                                const statusStyle = {
                                    running: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
                                    waiting: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
                                    completed: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
                                    escalated: 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse',
                                    failed: 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                }[run.status as string] || 'bg-muted text-muted-foreground';

                                return (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-border/40 bg-gray-50/10 dark:bg-muted/5 hover:border-primary/20 transition-all gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{run.workflow_versions?.workflows?.name || 'Workflow Run'}</span>
                                                <span className="text-[9px] font-bold text-muted-foreground">Version {run.workflow_versions?.version}</span>
                                            </div>
                                            <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">Entity: {run.entity_type} · ID: {run.entity_id}</div>
                                            <div className="text-[9px] text-muted-foreground font-semibold">Started at: {new Date(run.created_at).toLocaleString()}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-xl ${statusStyle}`}>
                                                {run.status}
                                            </span>
                                            <a
                                                href={`/app/workflows/runs/${run.id}`}
                                                className="text-xs font-black text-indigo-500 hover:underline uppercase tracking-wider flex items-center gap-1"
                                            >
                                                Details <ArrowRight className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};
export default WorkflowDashboard;
