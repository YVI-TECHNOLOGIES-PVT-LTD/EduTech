import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { AdmissionPermissions } from '../../core/AdmissionPermissions';
import { useInterviewEvaluation } from '../../hooks/useInterviewEvaluation';
import { InterviewSummary } from '../../interviews/InterviewSummary';
import { InterviewCard } from '../../interviews/InterviewCard';
import { PanelAssignment } from '../../interviews/PanelAssignment';
import { InterviewEvaluation } from '../../interviews/InterviewEvaluation';
import { InterviewHistory } from '../../interviews/InterviewHistory';
import { Button } from '../../../../components/ui/button';

interface Applicant360InterviewPanelProps {
    applicationId: string;
    readOnlyMode?: boolean;
}

export function Applicant360InterviewPanel({ applicationId, readOnlyMode = false }: Applicant360InterviewPanelProps) {
    const { user, hasPermission, hasRole } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };

    const canAccess = readOnlyMode
        ? AdmissionPermissions.canViewOwnApplications(permCtx)
        : AdmissionPermissions.canEvaluateInterviews(permCtx) ||
          AdmissionPermissions.canReviewApplications(permCtx);

    const {
        record,
        summary,
        history,
        isLoading,
        error,
        isSubmitting,
        refetch,
        permissions,
        runInterviewAction,
    } = useInterviewEvaluation(applicationId, permCtx);

    if (!canAccess) {
        return (
            <div className="py-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-gray-600">You do not have permission to manage interviews.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center space-y-3">
                <p className="text-sm text-rose-600 font-bold">Failed to load interview workspace.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return <div className="py-12 text-center text-sm text-gray-400 animate-pulse">Loading interview workspace…</div>;
    }

    if (readOnlyMode) {
        return (
            <div className="space-y-4">
                <InterviewSummary summary={summary} />
                {record && <InterviewCard record={record} selected />}
                <div className="border rounded-xl p-3 space-y-2">
                    <h3 className="text-[10px] font-black uppercase text-gray-400">Interview History</h3>
                    <InterviewHistory entries={history} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <InterviewSummary summary={summary} />
            <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                    {record && <InterviewCard record={record} selected />}
                    <PanelAssignment
                        record={record}
                        canAssign={permissions.canAssign}
                        isSubmitting={isSubmitting}
                        onAction={(action, payload) => runInterviewAction(action, payload)}
                    />
                </div>
                <div className="space-y-3">
                    <InterviewEvaluation
                        record={record}
                        canEvaluate={permissions.canEvaluate}
                        canRecommend={permissions.canRecommend}
                        canReject={permissions.canReject}
                        isSubmitting={isSubmitting}
                        onAction={(action, payload) => runInterviewAction(action, payload ?? {})}
                    />
                    <div className="border rounded-xl p-3 space-y-2">
                        <h3 className="text-[10px] font-black uppercase text-gray-400">Interview History</h3>
                        <InterviewHistory entries={history} />
                    </div>
                </div>
            </div>
        </div>
    );
}
