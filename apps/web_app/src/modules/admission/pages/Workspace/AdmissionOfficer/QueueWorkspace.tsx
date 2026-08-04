import React, { useMemo, useState } from 'react';
import { Clock, Users, AlertTriangle, ArrowRight, CheckCircle2, Eye, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdmissionQueueService } from '../../../services/AdmissionQueueService';

interface QueueWorkspaceProps {
    applications: any[];
    isLoading: boolean;
    onSelectApp: (id: string) => void;
    counselorEmail?: string;
}

export function QueueWorkspace({
    applications,
    isLoading,
    onSelectApp,
    counselorEmail = 'officer@school.com'
}: QueueWorkspaceProps) {
    const [activeQueue, setActiveQueue] = useState<string>('My Queue');

    const queueSummaries = useMemo(() => {
        return AdmissionQueueService.getQueueSummaries(applications, counselorEmail);
    }, [applications, counselorEmail]);

    const filteredApplications = useMemo(() => {
        return AdmissionQueueService.filterQueue(applications, activeQueue, counselorEmail);
    }, [applications, activeQueue, counselorEmail]);

    const getQueueIcon = (id: string) => {
        switch (id) {
            case 'My Queue': return Users;
            case 'Due Today': return Clock;
            case 'Over SLA': return ShieldAlert;
            case 'Completed Today': return CheckCircle2;
            case 'Escalated': return AlertTriangle;
            case 'Rejected': return ShieldAlert;
            default: return Clock;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Sidebar list of operational queues */}
            <div className="space-y-3 bg-white dark:bg-card p-4 border rounded-2xl shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 px-2 pb-2 border-b flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-500" /> Operational Queues
                </h3>
                <div className="flex flex-col gap-1">
                    {queueSummaries.map(q => {
                        const Icon = getQueueIcon(q.id);
                        const isActive = activeQueue === q.id;
                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => setActiveQueue(q.id)}
                                className={`w-full text-left text-xs px-3 py-2.5 rounded-xl font-bold transition-all flex items-center justify-between ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {q.label}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {q.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main view area */}
            <div className="lg:col-span-3 space-y-4 text-xs text-gray-700">
                <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">
                        Queue: {activeQueue} ({filteredApplications.length} Application(s))
                    </span>
                </div>

                {isLoading ? (
                    <div className="py-20 text-center text-xs text-gray-400 animate-pulse">Loading queue data...</div>
                ) : filteredApplications.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-gray-50/50">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-bold">This queue is completely empty. Great work!</p>
                    </div>
                ) : (
                    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b text-[10px] font-black uppercase text-gray-500">
                                    <th className="p-3">Application</th>
                                    <th className="p-3">Student Name</th>
                                    <th className="p-3">Grade</th>
                                    <th className="p-3">Stage</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredApplications.map(app => (
                                    <tr key={app.id} className="hover:bg-gray-50/50">
                                        <td className="p-3 font-bold text-gray-900 uppercase">{app.id.slice(0, 8)}</td>
                                        <td className="p-3 font-medium text-gray-900">{app.student_name}</td>
                                        <td className="p-3 text-gray-500 font-bold">{app.grade_applied_for}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-50 text-indigo-600">
                                                {app.status?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onSelectApp(app.id)}
                                                className="text-xs h-7 gap-1"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Dossier
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default QueueWorkspace;
