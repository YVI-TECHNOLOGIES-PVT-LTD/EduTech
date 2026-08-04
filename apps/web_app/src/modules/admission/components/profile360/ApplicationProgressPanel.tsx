import React from 'react';
import type { ApplicationProgressReport } from '../../hooks/useApplicationProgress';
import { formatSectionStatus } from '../../hooks/useApplicationProgress';

interface ApplicationProgressPanelProps {
    progress: ApplicationProgressReport | null;
    isLoading?: boolean;
}

export function ApplicationProgressPanel({ progress, isLoading }: ApplicationProgressPanelProps) {
    if (isLoading) {
        return <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />;
    }
    if (!progress) return null;

    const pct = progress.progressPercent;

    return (
        <div className="bg-white dark:bg-card p-5 border border-gray-150 dark:border-border/60 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                    Application Progress
                </h3>
                <span className="text-sm font-black text-indigo-600">{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                    className="bg-indigo-500 h-full transition-all duration-500"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                />
            </div>
            <div className="space-y-2">
                <ProgressRow
                    label="Documents"
                    detail={`${progress.sections.documents.completed} / ${progress.sections.documents.total}`}
                    status={formatSectionStatus(progress.sections.documents.status)}
                />
                <ProgressRow label="Interview" detail="" status={formatSectionStatus(progress.sections.interview.status)} />
                <ProgressRow label="Exam" detail="" status={formatSectionStatus(progress.sections.exam.status)} />
                <ProgressRow label="Fees" detail="" status={formatSectionStatus(progress.sections.fees.status)} />
                <ProgressRow label="Verification" detail="" status={formatSectionStatus(progress.sections.verification.status)} />
            </div>
        </div>
    );
}

function ProgressRow({ label, detail, status }: { label: string; detail: string; status: string }) {
    const statusColor =
        status === 'Completed' || status === 'Approved'
            ? 'text-emerald-600'
            : status === 'In Progress'
              ? 'text-amber-600'
              : status === 'Failed'
                ? 'text-rose-600'
                : 'text-gray-400';

    return (
        <div className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-border/10 last:border-0">
            <span className="text-gray-500 font-medium">{label}</span>
            <div className="text-right">
                {detail && <span className="text-[10px] text-gray-400 mr-2">{detail}</span>}
                <span className={`font-bold ${statusColor}`}>{status}</span>
            </div>
        </div>
    );
}

export default ApplicationProgressPanel;
