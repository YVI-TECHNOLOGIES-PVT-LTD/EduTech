import React from 'react';
import { FileText, CheckCircle, HelpCircle } from 'lucide-react';
import { TimelineEngine } from '../../components/timeline/TimelineEngine';
import { useApplicationList } from '../../hooks/useApplication';
import { useApplicant360 } from '../../hooks/useApplicant360';
import { formatStatusLabel } from '../../core/AdmissionStatusMapper';

export function ParentDashboard() {
    const { applications, isLoading } = useApplicationList({ limit: 20 }, { mine: true });
    const activeApplications = applications.filter(
        app => !['enrolled', 'rejected', 'withdrawn'].includes(app.status.toLowerCase())
    );
    const primaryApp = activeApplications[0] ?? applications[0];
    const { view, isLoading: viewLoading } = useApplicant360(primaryApp?.id);

    if (isLoading || viewLoading) {
        return <p className="text-xs text-gray-400 animate-pulse py-12 text-center">Loading your applications…</p>;
    }

    if (!primaryApp || !view) {
        return (
            <div className="py-16 text-center space-y-3">
                <FileText className="w-10 h-10 text-indigo-400 mx-auto" />
                <p className="text-sm font-bold text-gray-700">No applications found.</p>
                <p className="text-xs text-gray-400">Start a new application from the admissions menu.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 space-y-2 max-w-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                        Parent Console
                    </span>
                    <h2 className="text-xl font-black">Track Your Child&apos;s Admission</h2>
                    <p className="text-xs text-indigo-100 font-medium">
                        Application for {view.grade} is currently at: {view.status}. Progress: {view.progressPercent}%.
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pr-8 pointer-events-none">
                    <FileText className="w-48 h-48 rotate-12" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 p-6 rounded-2xl shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                            Workflow Progress Stage
                        </h3>
                        <TimelineEngine nodes={view.timelineNodes} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 p-5 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                                Required Documents
                            </h3>
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black rounded-lg">
                                {formatStatusLabel(primaryApp.status)}
                            </span>
                        </div>

                        <div className="space-y-3 text-xs">
                            {view.documentChecklist.length === 0 ? (
                                <p className="text-gray-400">No documents on file yet.</p>
                            ) : (
                                view.documentChecklist.map(doc => (
                                    <div key={doc.name} className="flex items-center justify-between py-1.5 border-b last:border-0 border-gray-50">
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-gray-200">{doc.name}</p>
                                        </div>
                                        {doc.verified ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        ) : (
                                            <span className="text-[9px] font-black uppercase text-amber-600">Pending</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 p-5 rounded-2xl shadow-sm space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-1">
                            <HelpCircle className="w-4 h-4 text-indigo-500" /> Need Assistance?
                        </h3>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Contact your admissions counselor for exam schedules, interview timings, or fee payment support.
                        </p>
                        <div className="pt-2">
                            <a
                                href={`mailto:${view.email !== '—' ? view.email : 'admissions@school.edu'}`}
                                className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-xl transition-colors"
                            >
                                Contact Counselor
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ParentDashboard;
