import type { MeritRecord } from '../utils/merit.mapper';
import type { MeritAction } from '../utils/merit.workflow';
import { Button } from '../../../components/ui/button';
import { ArrowUpDown, Snowflake, XCircle } from 'lucide-react';

interface WaitlistManagerProps {
    record: MeritRecord | null;
    canPublish?: boolean;
    canReject?: boolean;
    isSubmitting?: boolean;
    onAction: (action: MeritAction, payload?: Record<string, unknown>) => void;
}

export function WaitlistManager({ record, canPublish, canReject, isSubmitting, onAction }: WaitlistManagerProps) {
    if (!record) return null;

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400">Waitlist & Selection</h3>
            {(record.waitlistPriority !== undefined || record.waitlistGroup) && (
                <p className="text-[10px] text-gray-500">
                    Waitlist: {record.waitlistGroup ?? '—'} · Priority {record.waitlistPriority ?? '—'}
                </p>
            )}
            <div className="flex flex-wrap gap-2">
                {canPublish && (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] gap-1"
                            disabled={isSubmitting}
                            onClick={() => onAction('publish_merit', { remark: 'Merit rank published' })}
                        >
                            Publish Merit
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] gap-1"
                            disabled={isSubmitting}
                            onClick={() => onAction('move_waitlist', { remark: 'Waitlist position updated' })}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" /> Move Waitlist
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] gap-1"
                            disabled={isSubmitting}
                            onClick={() => onAction('freeze_rank', { remark: 'Merit rank frozen' })}
                        >
                            <Snowflake className="w-3.5 h-3.5" /> Freeze Rank
                        </Button>
                    </>
                )}
                {canReject && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] gap-1 border-rose-200 text-rose-600"
                        disabled={isSubmitting}
                        onClick={() => onAction('reject', { remark: 'Rejected from merit selection' })}
                    >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                )}
            </div>
        </div>
    );
}

export default WaitlistManager;
