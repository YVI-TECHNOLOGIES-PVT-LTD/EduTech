import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { AdmissionPermissions } from '../../core/AdmissionPermissions';
import { useFinanceWorkspace } from '../../hooks/useFinanceWorkspace';
import { PaymentSummary } from '../../finance/PaymentSummary';
import { PaymentCard } from '../../finance/PaymentCard';
import { PaymentTimeline } from '../../finance/PaymentTimeline';
import { PaymentHistory } from '../../finance/PaymentHistory';
import { ScholarshipPanel } from '../../finance/ScholarshipPanel';
import { WaiverPanel } from '../../finance/WaiverPanel';
import { FeeStructurePanel } from '../../finance/FeeStructurePanel';
import { PaymentToolbar } from '../../finance/PaymentToolbar';
import { Button } from '../../../../components/ui/button';

interface Applicant360FeesPanelProps {
    applicationId: string;
    readOnlyMode?: boolean;
}

export function Applicant360FeesPanel({ applicationId, readOnlyMode = false }: Applicant360FeesPanelProps) {
    const { user, hasPermission, hasRole } = useAuth();
    const permCtx = { roles: user?.roles ?? [], hasPermission, hasRole };

    const canAccess = readOnlyMode
        ? AdmissionPermissions.canViewFinance(permCtx)
        : AdmissionPermissions.canViewFinance(permCtx);

    const {
        record,
        summary,
        history,
        timeline,
        receipt,
        isLoading,
        error,
        isSubmitting,
        refetch,
        permissions,
        runFinanceAction,
    } = useFinanceWorkspace(applicationId, permCtx);

    if (!canAccess) {
        return (
            <div className="py-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-gray-600">You do not have permission to view finance.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center space-y-3">
                <p className="text-sm text-rose-600 font-bold">Failed to load finance workspace.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return <div className="py-12 text-center text-sm text-gray-400 animate-pulse">Loading finance workspace…</div>;
    }

    if (readOnlyMode) {
        return (
            <div className="space-y-4">
                <PaymentSummary summary={summary} />
                {record && <PaymentCard record={record} selected />}
                <PaymentTimeline entries={timeline ?? []} />
                <div className="border rounded-xl p-3 space-y-2">
                    <h3 className="text-[10px] font-black uppercase text-gray-400">Payment History</h3>
                    <PaymentHistory entries={history} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <PaymentSummary summary={summary} />
            <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                    {record && <PaymentCard record={record} selected />}
                    <FeeStructurePanel
                        canAssign={permissions.canCollect}
                        isSubmitting={isSubmitting}
                        onAction={(action, payload) => runFinanceAction(action, payload)}
                    />
                    <ScholarshipPanel
                        canVerify={permissions.canVerify}
                        isSubmitting={isSubmitting}
                        onAction={(action, payload) => runFinanceAction(action, payload)}
                    />
                    <WaiverPanel
                        canWaiver={permissions.canWaiver}
                        isSubmitting={isSubmitting}
                        onAction={(action, payload) => runFinanceAction(action, payload)}
                    />
                </div>
                <div className="space-y-3">
                    <PaymentToolbar
                        record={record}
                        canCollect={permissions.canCollect}
                        canVerify={permissions.canVerify}
                        canApprove={permissions.canApprove}
                        canReject={permissions.canReject}
                        canReceipt={permissions.canReceipt}
                        isSubmitting={isSubmitting}
                        onAction={(action, payload) => runFinanceAction(action, payload)}
                    />
                    <PaymentTimeline entries={timeline ?? []} />
                    <div className="border rounded-xl p-3 space-y-2">
                        <h3 className="text-[10px] font-black uppercase text-gray-400">Payment History</h3>
                        <PaymentHistory entries={history} />
                    </div>
                    {receipt && (
                        <p className="text-xs text-gray-500 font-medium">Latest receipt: {receipt.receiptNumber}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
