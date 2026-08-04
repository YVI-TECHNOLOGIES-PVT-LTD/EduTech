import type { FinanceAction } from '../utils/finance.workflow';
import { Button } from '../../../components/ui/button';
import { Award } from 'lucide-react';

interface ScholarshipPanelProps {
    canVerify?: boolean;
    isSubmitting?: boolean;
    onAction: (action: FinanceAction, payload?: Record<string, unknown>) => void;
}

export function ScholarshipPanel({ canVerify, isSubmitting, onAction }: ScholarshipPanelProps) {
    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Scholarship Validation
            </h3>
            <p className="text-[10px] text-gray-500">
                Scholarship status is determined by backend fee assignment and waiver records. Use verify to record audit remarks.
            </p>
            {canVerify ? (
                <Button size="sm" variant="outline" className="h-8 text-[10px]" disabled={isSubmitting} onClick={() => onAction('verify_scholarship', { remark: 'Scholarship validated' })}>
                    Verify Scholarship
                </Button>
            ) : (
                <p className="text-xs text-gray-400">Read-only access</p>
            )}
        </div>
    );
}

export default ScholarshipPanel;
