import React, { useMemo } from 'react';
import {
    Users, FileText, Clock, AlertTriangle, Bell, ClipboardList, TrendingUp
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { AdmissionAnalyticsService } from '../../../services/AdmissionAnalyticsService';
import { AdmissionNotificationService } from '../../../services/AdmissionNotificationService';

interface DashboardWorkspaceProps {
    applications: any[];
    stats: any;
    onNavigate: (workspaceId: string) => void;
}

export function DashboardWorkspace({ applications, onNavigate }: DashboardWorkspaceProps) {
    const metrics = useMemo(() => {
        return AdmissionAnalyticsService.computeMetrics(applications);
    }, [applications]);

    const alerts = useMemo(() => {
        return AdmissionNotificationService.generateAlerts(applications);
    }, [applications]);

    const kpis = [
        { label: 'Applications Received', value: metrics.totalReceived, icon: FileText, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        { label: 'In Progress', value: metrics.inProgress, icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { label: 'Enrolled', value: metrics.enrolledCount, icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        { label: 'Rejections Issued', value: metrics.rejectedCount, icon: XCirclePlaceholder, color: 'text-rose-600 bg-rose-50 border-rose-100' },
        { label: 'SLA Breaches', value: metrics.slaBreaches, icon: AlertTriangle, color: 'text-rose-700 bg-rose-100 border-rose-300 font-bold' }
    ];

    const quickActions = [
        { label: 'Review Applications', target: 'APPLICATIONS', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
        { label: 'Document Queue', target: 'DOCUMENTS', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
        { label: 'Finance Workspace', target: 'FINANCE', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
        { label: 'Merit Compiler', target: 'MERIT', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' }
    ];

    const recentActivities = useMemo(() => {
        return applications
            .slice(0, 5)
            .map(a => ({
                time: new Date(a.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                student: a.student_name,
                action: a.status === 'enrolled' ? 'provisioned to ERP' : `moved to status ${a.status.replace(/_/g, ' ')}`,
                grade: a.grade_applied_for
            }));
    }, [applications]);

    return (
        <div className="space-y-6">
            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {kpis.map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={idx} className={`p-5 rounded-2xl border bg-white dark:bg-card shadow-sm flex items-start gap-4 ${kpi.color}`}>
                            <div className="w-10 h-10 rounded-xl bg-white/80 shadow-sm flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-current" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase text-gray-500 truncate">{kpi.label}</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{kpi.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Area */}
                <div className="lg:col-span-2 bg-white dark:bg-card p-6 border rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-indigo-500" /> Pipeline Drop-off Analytics
                        </h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics.funnel}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} />
                                <YAxis tick={{ fontSize: 9, fontWeight: 700 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sidebar controls */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-card p-6 border rounded-2xl shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {quickActions.map((act, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => onNavigate(act.target)}
                                    className={`p-3 rounded-xl border border-solid border-transparent text-xs font-bold text-center transition-all ${act.color}`}
                                >
                                    {act.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Operational Feed */}
                    <div className="bg-white dark:bg-card p-6 border rounded-2xl shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                            <ClipboardList className="w-4 h-4 text-indigo-500" /> Live Feed
                        </h3>
                        <div className="space-y-3">
                            {recentActivities.length === 0 ? (
                                <p className="text-xs text-gray-400">No recent activities logged.</p>
                            ) : (
                                recentActivities.map((act, idx) => (
                                    <div key={idx} className="flex justify-between items-start text-xs border-b pb-2 last:border-0 last:pb-0">
                                        <div className="min-w-0 pr-2">
                                            <p className="font-bold text-gray-800 truncate">{act.student}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{act.action} ({act.grade})</p>
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400 shrink-0">{act.time}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Center */}
            <div className="bg-white dark:bg-card p-6 border rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-500" /> Notification Center
                </h3>
                {alerts.length === 0 ? (
                    <p className="text-xs text-gray-400 font-medium">All queues are healthy. No alerts today.</p>
                ) : (
                    <div className="grid md:grid-cols-4 gap-4">
                        {alerts.map((note, idx) => (
                            <div key={idx} className={`p-4 border rounded-xl flex flex-col justify-between h-32 ${
                                note.type === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                                note.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                                'bg-indigo-50 border-indigo-100 text-indigo-800'
                            }`}>
                                <p className="text-xs font-semibold leading-relaxed">{note.message}</p>
                                <Button
                                    size="sm"
                                    onClick={() => onNavigate(note.target)}
                                    className="w-full text-[10px] uppercase font-black tracking-wider mt-2 py-1.5 h-auto bg-white/70 hover:bg-white text-current border border-current shadow-none"
                                >
                                    {note.actionLabel}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const XCirclePlaceholder = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);
export default DashboardWorkspace;
