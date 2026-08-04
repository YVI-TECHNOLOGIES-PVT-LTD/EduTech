import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AdmissionPermissions } from '../core/AdmissionPermissions';
import { useExamQueue } from '../hooks/useExamQueue';
import { useExamEvaluation } from '../hooks/useExamEvaluation';
import type { ExamRecord } from '../utils/exam.mapper';
import { ExamQueue } from './ExamQueue';
import { ExamCard } from './ExamCard';
import { ExamSummary } from './ExamSummary';
import { EvaluationPanel } from './EvaluationPanel';
import { ExamHistory } from './ExamHistory';
import { ExportMenu } from '../../common/reports/ExportMenu';
import { examRecordToExportRow } from '../utils/exam.mapper';
import { Button } from '../../../components/ui/button';
import { ROUTES } from '../../../constants/routes';

export function ExamWorkspace() {
    const navigate = useNavigate();
    const { user, hasPermission, hasRole } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };

    const [queueSearch, setQueueSearch] = useState('');
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<ExamRecord | null>(null);
    const [recordQuery, setRecordQuery] = useState('');

    const canAccess =
        AdmissionPermissions.canManageExams(permCtx) ||
        AdmissionPermissions.canReviewApplications(permCtx);

    const { queue, isLoading: queueLoading, refetch: refetchQueue } = useExamQueue(queueSearch);

    const {
        application,
        records,
        summary,
        history,
        isLoading,
        error,
        isSubmitting,
        refetch,
        permissions,
        runEvaluation,
        filterRecords,
    } = useExamEvaluation(selectedAppId ?? undefined, permCtx);

    const filteredRecords = filterRecords(recordQuery, 'all');
    const exportData = records.map(examRecordToExportRow);

    if (!canAccess) {
        return (
            <div className="py-16 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-gray-700">You do not have permission to access exam evaluation.</p>
            </div>
        );
    }

    if (!selectedAppId) {
        return (
            <div className="space-y-6 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Entrance Exam & Evaluation</h1>
                    <p className="text-sm text-gray-500 mt-1">Operational workspace — live queue via Admission Engine</p>
                </div>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={queueSearch}
                        onChange={e => setQueueSearch(e.target.value)}
                        placeholder="Search queue…"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs"
                    />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900">Exam Evaluation Queue</h2>
                        <Button variant="ghost" size="sm" onClick={() => refetchQueue()} className="gap-1 text-xs">
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </Button>
                    </div>
                    <ExamQueue items={queue} isLoading={queueLoading} onSelect={id => { setSelectedAppId(id); setSelectedRecord(null); }} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4 flex-wrap">
                <button
                    type="button"
                    onClick={() => { setSelectedAppId(null); setSelectedRecord(null); refetchQueue(); }}
                    className="p-2 hover:bg-gray-100 rounded-xl"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-black text-gray-900 truncate">{application?.student_name ?? 'Exam Evaluation'}</h1>
                    <p className="text-sm text-gray-500">{application?.grade_applied_for ?? ''} · {application?.status ?? ''}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ADMISSION.DETAILS(selectedAppId))} className="text-xs">
                    Applicant 360
                </Button>
                <ExportMenu title="Exam Results" data={exportData} columns={Object.keys(exportData[0] ?? { Student: '' })} />
                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
            </div>

            {error ? (
                <div className="py-8 text-center">
                    <p className="text-sm text-rose-600 font-bold">Failed to load exam data.</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Retry</Button>
                </div>
            ) : isLoading ? (
                <div className="py-16 text-center text-sm text-gray-400 animate-pulse">Loading evaluation data…</div>
            ) : (
                <>
                    <ExamSummary summary={summary} />

                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={recordQuery}
                            onChange={e => setRecordQuery(e.target.value)}
                            placeholder="Filter exam records…"
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs"
                        />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            {filteredRecords.map(record => (
                                <ExamCard
                                    key={record.id}
                                    record={record}
                                    selected={selectedRecord?.id === record.id}
                                    onSelect={() => setSelectedRecord(record)}
                                />
                            ))}
                        </div>
                        <div className="space-y-4">
                            <EvaluationPanel
                                record={selectedRecord ?? filteredRecords[0] ?? null}
                                canEvaluate={permissions.canEvaluate}
                                canApprove={permissions.canApprove}
                                canReject={permissions.canReject}
                                isSubmitting={isSubmitting}
                                onAction={(action, payload) => runEvaluation(action, payload ?? {})}
                            />
                            <div className="bg-white border rounded-2xl p-4 space-y-3">
                                <h3 className="text-xs font-black uppercase text-gray-400">Exam History</h3>
                                <ExamHistory entries={history} />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ExamWorkspace;
