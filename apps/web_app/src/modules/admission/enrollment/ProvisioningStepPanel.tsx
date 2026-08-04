import type { ProvisioningStep } from '../utils/enrollment.mapper';
import { CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface ProvisioningStepPanelProps {
    step?: ProvisioningStep;
    title: string;
}

export function ProvisioningStepPanel({ step, title }: ProvisioningStepPanelProps) {
    const status = step?.status ?? 'PENDING';

    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-muted/30 rounded-xl border border-gray-100 dark:border-border/60">
            <div>
                <p className="text-[10px] font-black uppercase text-gray-400">{title}</p>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100 mt-0.5">{step?.label ?? title}</p>
                {step?.errorMessage && (
                    <p className="text-[10px] text-rose-500 mt-1">{step.errorMessage}</p>
                )}
            </div>
            <StatusBadge status={status} />
        </div>
    );
}

function StatusBadge({ status }: { status: ProvisioningStep['status'] }) {
    if (status === 'COMPLETED') {
        return (
            <span className="flex items-center gap-1 text-[10px] font-black text-green-600">
                <CheckCircle2 className="w-4 h-4" /> DONE
            </span>
        );
    }
    if (status === 'FAILED') {
        return (
            <span className="flex items-center gap-1 text-[10px] font-black text-rose-500">
                <AlertCircle className="w-4 h-4" /> FAILED
            </span>
        );
    }
    if (status === 'PROCESSING') {
        return (
            <span className="flex items-center gap-1 text-[10px] font-black text-indigo-600">
                <Loader2 className="w-4 h-4 animate-spin" /> RUNNING
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-[10px] font-black text-gray-400">
            <Clock className="w-4 h-4" /> PENDING
        </span>
    );
}

export default ProvisioningStepPanel;
