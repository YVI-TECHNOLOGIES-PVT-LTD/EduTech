import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
    Activity, 
    RefreshCw, 
    ShieldCheck, 
    Server, 
    ToggleRight,
    Clock,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../../../context/AuthContext';

const StatusDot: React.FC<{ status: 'ok' | 'warn' | 'error'; label: string }> = ({ status, label }) => {
    const colors = {
        ok: 'bg-emerald-500',
        warn: 'bg-amber-500',
        error: 'bg-rose-500'
    };
    const icons = {
        ok: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
        warn: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
        error: <XCircle className="w-3.5 h-3.5 text-rose-500" />
    };
    return (
        <div className="flex items-center gap-2">
            {icons[status]}
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        </div>
    );
};

export const HealthPanel: React.FC = () => {
    const { user } = useAuth();
    const { loading, error, notifications, tasks } = useDashboard();
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);

    const allQueries = queryClient.getQueryCache().getAll();
    const failedQueries = allQueries.filter(q => q.state.status === 'error').length;
    const freshQueries = allQueries.filter(q => q.state.status === 'success').length;
    const loadingQueries = allQueries.filter(q => q.state.fetchStatus === 'fetching').length;

    const engineStatus = error ? 'error' : loading ? 'warn' : 'ok';
    const cacheStatus = failedQueries > 0 ? 'warn' : 'ok';

    const lastSync = allQueries.reduce((latest, q) => {
        const updated = q.state.dataUpdatedAt;
        return updated > latest ? updated : latest;
    }, 0);

    const lastSyncLabel = lastSync > 0
        ? new Date(lastSync).toLocaleTimeString()
        : 'Not yet synced';

    const roles = user?.roles?.join(', ') || 'Guest';

    return (
        <div className="bg-white dark:bg-card border border-border/40 rounded-3xl shadow-premium-sm overflow-hidden">
            {/* Header — always visible */}
            <button
                onClick={() => setExpanded(p => !p)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                        <Activity className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Dashboard Health
                        </p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                            Client-side diagnostics panel
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${engineStatus === 'ok' ? 'bg-emerald-500' : engineStatus === 'warn' ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`}></span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </button>

            {/* Expanded diagnostics grid */}
            {expanded && (
                <div className="px-6 pb-6 space-y-5 border-t border-border/30">
                    {/* Engine Status */}
                    <div className="pt-4 space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Server className="w-3 h-3" /> Engine Status
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <StatusDot status={engineStatus} label={`Dashboard Engine: ${engineStatus === 'ok' ? 'Online' : engineStatus === 'warn' ? 'Loading' : 'Error'}`} />
                            <StatusDot status={cacheStatus} label={`React Query Cache: ${failedQueries > 0 ? `${failedQueries} failed` : 'Healthy'}`} />
                        </div>
                    </div>

                    {/* Cache Stats */}
                    <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <RefreshCw className="w-3 h-3" /> Cache Stats
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                                { label: 'Cached', value: freshQueries, color: 'text-emerald-600' },
                                { label: 'Fetching', value: loadingQueries, color: 'text-amber-600' },
                                { label: 'Failed', value: failedQueries, color: 'text-rose-600' }
                            ].map(s => (
                                <div key={s.label} className="bg-gray-50 dark:bg-card/50 rounded-xl p-2 border border-border/30">
                                    <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Session Info */}
                    <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3" /> Session Context
                        </p>
                        <div className="space-y-1.5">
                            {[
                                { key: 'Active Role(s)', val: roles },
                                { key: 'User', val: user?.full_name || user?.email || 'Unknown' },
                                { key: 'Last Cache Sync', val: lastSyncLabel },
                                { key: 'Pending Tasks', val: String(tasks.filter(t => t.status === 'pending').length) },
                                { key: 'Unread Notifications', val: String(notifications.filter(n => !n.read).length) },
                            ].map(row => (
                                <div key={row.key} className="flex items-center justify-between text-[11px] py-1 border-b border-border/20 last:border-0">
                                    <span className="text-muted-foreground font-semibold">{row.key}</span>
                                    <span className="font-black text-gray-900 dark:text-white text-right max-w-[60%] truncate">{row.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feature Flags placeholder */}
                    <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <ToggleRight className="w-3 h-3" /> Feature Flags
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {['dashboard.analytics', 'workqueue.enabled', 'search.enabled', 'notifications.enabled'].map(flag => (
                                <span key={flag} className="px-2.5 py-1 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20 uppercase tracking-wide">
                                    ✓ {flag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthPanel;
