import React, { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../../context/AuthContext';
import { AdmissionPermissions } from '../../core/AdmissionPermissions';
import { useApplication } from '../../hooks/useApplication';
import { useWorkflow } from '../../hooks/useWorkflow';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';

interface Applicant360ReviewPanelProps {
    applicationId: string;
}

export function Applicant360ReviewPanel({ applicationId }: Applicant360ReviewPanelProps) {
    const { user, hasPermission, hasRole } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };
    const [remarks, setRemarks] = useState('');

    const canReview = AdmissionPermissions.canReviewApplications(permCtx);
    const canApprove = AdmissionPermissions.isPrincipal(permCtx) || AdmissionPermissions.canReviewApplications(permCtx);

    const { application, isLoading, error, refetch } = useApplication(applicationId);
    const { executeAction, isSubmitting } = useWorkflow(applicationId);

    const runAction = async (action: 'review' | 'approve' | 'reject' | 'recommend') => {
        try {
            await executeAction(action, { remark: remarks });
            toast.success(`${action} completed`);
            setRemarks('');
            await refetch();
        } catch (err: unknown) {
            const message = (err as Error)?.message ?? 'Review action failed';
            toast.error(message);
        }
    };

    if (!canReview && !canApprove) {
        return (
            <div className="py-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-gray-600">You do not have permission to review applications.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center space-y-3">
                <p className="text-sm text-rose-600 font-bold">Failed to load review data.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return <div className="py-12 text-center text-sm text-gray-400 animate-pulse">Loading review workspace…</div>;
    }

    return (
        <div className="space-y-4">
            <div className="p-4 border rounded-xl bg-gray-50/50 space-y-2">
                <p className="text-xs font-black text-gray-800">Committee Review</p>
                <p className="text-xs text-gray-500">
                    Status: <span className="font-bold text-indigo-600">{application?.status ?? '—'}</span>
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                    Record eligibility notes, committee decision, approval or rejection rationale. Actions update the
                    centralized workflow orchestrator.
                </p>
            </div>

            <Textarea
                value={remarks}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
                placeholder="Committee notes, eligibility remarks, hold/clarification details…"
                className="text-xs min-h-[100px]"
            />

            <div className="flex flex-wrap gap-2">
                {canReview && (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => runAction('review')}
                        >
                            Submit for Review
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => runAction('recommend')}
                        >
                            Recommend
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={isSubmitting}
                            onClick={() => runAction('reject')}
                        >
                            Reject
                        </Button>
                    </>
                )}
                {canApprove && (
                    <Button size="sm" disabled={isSubmitting} onClick={() => runAction('approve')}>
                        Principal Approval
                    </Button>
                )}
            </div>
        </div>
    );
}
