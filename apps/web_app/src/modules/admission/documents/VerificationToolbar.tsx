import { CheckCircle2, XCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface VerificationToolbarProps {
    onApproveAll?: () => void;
    onRejectAll?: () => void;
    onComplete?: () => void;
    onRefresh?: () => void;
    canVerify?: boolean;
    canReject?: boolean;
    isSubmitting?: boolean;
    completeEnabled?: boolean;
}

export function VerificationToolbar({
    onApproveAll,
    onRejectAll,
    onComplete,
    onRefresh,
    canVerify,
    canReject,
    isSubmitting,
    completeEnabled = true,
}: VerificationToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {canVerify && (
                <>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] gap-1"
                        onClick={onApproveAll}
                        disabled={isSubmitting || !completeEnabled}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approve All
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={onComplete}
                        disabled={isSubmitting || !completeEnabled}
                    >
                        <ShieldCheck className="w-3.5 h-3.5" /> Complete Verification
                    </Button>
                </>
            )}
            {canReject && (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[10px] gap-1 border-rose-200 text-rose-600"
                    onClick={onRejectAll}
                    disabled={isSubmitting}
                >
                    <XCircle className="w-3.5 h-3.5" /> Reject All
                </Button>
            )}
            {onRefresh && (
                <Button size="sm" variant="ghost" className="h-8 text-[10px] gap-1" onClick={onRefresh} disabled={isSubmitting}>
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
            )}
        </div>
    );
}

export default VerificationToolbar;
