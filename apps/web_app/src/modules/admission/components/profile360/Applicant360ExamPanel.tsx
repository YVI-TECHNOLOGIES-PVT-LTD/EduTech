import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { AdmissionPermissions } from '../../core/AdmissionPermissions';
import { useExamEvaluation } from '../../hooks/useExamEvaluation';
import { ExamSummary } from '../../exams/ExamSummary';
import { ExamCard } from '../../exams/ExamCard';
import { EvaluationPanel } from '../../exams/EvaluationPanel';
import { ExamHistory } from '../../exams/ExamHistory';
import { Button } from '../../../../components/ui/button';

interface Applicant360ExamPanelProps {
    applicationId: string;
    readOnlyMode?: boolean;
}

export function Applicant360ExamPanel({ applicationId, readOnlyMode = false }: Applicant360ExamPanelProps) {
    const { user, hasPermission, hasRole } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };

    const canAccess = readOnlyMode
        ? AdmissionPermissions.canViewOwnApplications(permCtx)
        : AdmissionPermissions.canManageExams(permCtx) ||
          AdmissionPermissions.canReviewApplications(permCtx);

    const {
        records,
        summary,
        history,
        isLoading,
        error,
        isSubmitting,
        refetch,
        permissions,
        runEvaluation,
    } = useExamEvaluation(applicationId, permCtx);

    if (!canAccess) {
        return (
            <div className="py-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-gray-600">You do not have permission to manage exams.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center space-y-3">
                <p className="text-sm text-rose-600 font-bold">Failed to load exam workspace.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return <div className="py-12 text-center text-sm text-gray-400 animate-pulse">Loading exam workspace…</div>;
    }

    const record = records[0] ?? null;

    if (readOnlyMode) {
        return (
            <div className="space-y-4">
                <ExamSummary summary={summary} />
                {record && <ExamCard record={record} selected />}
                <div className="border rounded-xl p-3 space-y-2">
                    <h3 className="text-[10px] font-black uppercase text-gray-400">Exam History</h3>
                    <ExamHistory entries={history} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <ExamSummary summary={summary} />
            <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                    {record && <ExamCard record={record} selected />}
                </div>
                <div className="space-y-3">
                    <EvaluationPanel
                        record={record}
                        canEvaluate={permissions.canEvaluate}
                        canApprove={permissions.canApprove}
                        canReject={permissions.canReject}
                        isSubmitting={isSubmitting}
                        onAction={(action, payload) => runEvaluation(action, payload ?? {})}
                    />
                    <div className="border rounded-xl p-3 space-y-2">
                        <h3 className="text-[10px] font-black uppercase text-gray-400">Exam History</h3>
                        <ExamHistory entries={history} />
                    </div>
                </div>
            </div>
        </div>
    );
}
