import type { EnrollmentAction } from '../utils/enrollment.workflow';
import type { EnrollmentRecord } from '../utils/enrollment.mapper';
import { Button } from '../../../components/ui/button';
import { EnrollmentChecklist } from './EnrollmentChecklist';
import { CheckCircle2, GraduationCap, RotateCcw, XCircle } from 'lucide-react';

interface EnrollmentValidationProps {
    record: EnrollmentRecord | null;
    canConfirm?: boolean;
    canEnroll?: boolean;
    canReject?: boolean;
    canRollback?: boolean;
    isSubmitting?: boolean;
    onAction: (action: EnrollmentAction, payload?: Record<string, unknown>) => void;
}

export function EnrollmentValidation({
    record,
    canConfirm,
    canEnroll,
    canReject,
    canRollback,
    isSubmitting,
    onAction,
}: EnrollmentValidationProps) {
    if (!record) {
        return (
            <div className="border border-dashed rounded-2xl p-6 text-center text-sm text-gray-400">
                Select a candidate to validate enrollment readiness.
            </div>
        );
    }

    const allPassed = record.validation.every(v => v.passed);
    const canRunEnroll = record.phase === 'ready_to_enroll' && allPassed;

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-400">Enrollment Validation</h3>
            <EnrollmentChecklist items={record.validation} />
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {canConfirm && record.phase === 'awaiting_confirmation' && (
                    <Button size="sm" className="h-8 text-[10px] gap-1 bg-indigo-600 text-white" disabled={isSubmitting || !allPassed} onClick={() => onAction('confirm_admission')}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Admission
                    </Button>
                )}
                {canEnroll && canRunEnroll && (
                    <Button size="sm" className="h-8 text-[10px] gap-1 bg-emerald-600 text-white" disabled={isSubmitting} onClick={() => onAction('enroll_student')}>
                        <GraduationCap className="w-3.5 h-3.5" /> Enroll & Provision
                    </Button>
                )}
                {canEnroll && record.phase === 'failed' && (
                    <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('retry_provision')}>
                        <RotateCcw className="w-3.5 h-3.5" /> Retry Provisioning
                    </Button>
                )}
                {canReject && record.phase !== 'enrolled' && (
                    <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1 border-rose-200 text-rose-600" disabled={isSubmitting} onClick={() => onAction('reject_enrollment')}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                )}
                {canRollback && record.phase === 'enrolled' && (
                    <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" disabled={isSubmitting} onClick={() => onAction('rollback_enrollment')}>
                        Rollback
                    </Button>
                )}
            </div>
        </div>
    );
}

export default EnrollmentValidation;
