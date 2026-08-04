import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AdmissionAnalyticsService } from '../../../services/AdmissionAnalyticsService';

interface ReportsWorkspaceProps {
    applications: any[];
}

export function ReportsWorkspace({ applications }: ReportsWorkspaceProps) {
    const metrics = useMemo(() => {
        return AdmissionAnalyticsService.computeMetrics(applications);
    }, [applications]);

    const slaData = useMemo(() => {
        return [
            { stage: 'Review', avgHours: 12, target: 24 },
            { stage: 'Documents', avgHours: 18, target: 24 },
            { stage: 'Exams', avgHours: 42, target: 72 },
            { stage: 'Interviews', avgHours: 28, target: 48 },
            { stage: 'Billing', avgHours: 35, target: 72 }
        ];
    }, []);

    return (
        <div className="space-y-6 text-xs text-gray-700">
            {/* KPI top widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 bg-white border rounded-2xl shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Conversion Ratio</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{metrics.conversionRate}%</p>
                    </div>
                </div>

                <div className="p-5 bg-white border rounded-2xl shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Total Enrolled</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{metrics.enrolledCount}</p>
                    </div>
                </div>

                <div className="p-5 bg-white border rounded-2xl shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Total Declined</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{metrics.rejectedCount}</p>
                    </div>
                </div>

                <div className="p-5 bg-white border rounded-2xl shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Total Handled</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{metrics.totalReceived}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SLA Compliance by Stage Chart */}
                <div className="bg-white p-6 border rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-indigo-500" /> Avg Processing SLA (Hours) vs Target
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={slaData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="stage" tick={{ fontSize: 9, fontWeight: 700 }} />
                                <YAxis tick={{ fontSize: 9, fontWeight: 700 }} />
                                <Tooltip />
                                <Bar dataKey="avgHours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Actual Avg Hours" />
                                <Bar dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="SLA Limit" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Counselor Load distribution chart */}
                <div className="bg-white p-6 border rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-500" /> Counselor Workload Assignment Distribution
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics.workload}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} />
                                <YAxis tick={{ fontSize: 9, fontWeight: 700 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="count" stroke="#10b981" fill="#ecfdf5" strokeWidth={2} name="Assigned Applications" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportsWorkspace;
