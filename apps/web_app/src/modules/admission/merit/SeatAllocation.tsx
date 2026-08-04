import type { MeritRecord } from '../utils/merit.mapper';
import type { MeritAction } from '../utils/merit.workflow';
import { Button } from '../../../components/ui/button';
import { CheckCircle2, Armchair } from 'lucide-react';

interface SeatAllocationProps {
    record: MeritRecord | null;
    canAllocate?: boolean;
    canApprove?: boolean;
    isSubmitting?: boolean;
    onAction: (action: MeritAction, payload?: Record<string, unknown>) => void;
}

export function SeatAllocation({ record, canAllocate, canApprove, isSubmitting, onAction }: SeatAllocationProps) {
    if (!record) return null;

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400">Seat Allocation</h3>
            <p className="text-xs text-gray-600">
                Current status: <span className="font-bold">{record.seatStatus}</span>
                {record.rank !== undefined ? ` · Rank #${record.rank}` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
                {canAllocate && (
                    <Button
                        size="sm"
                        className="h-8 text-[10px] gap-1 bg-emerald-600 text-white"
                        disabled={isSubmitting}
                        onClick={() => onAction('allocate_seat', { remark: 'Seat allocated via merit workspace' })}
                    >
                        <Armchair className="w-3.5 h-3.5" /> Allocate Seat
                    </Button>
                )}
                {canApprove && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] gap-1"
                        disabled={isSubmitting}
                        onClick={() => onAction('approve_merit', { remark: 'Merit approved for allocation' })}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Merit
                    </Button>
                )}
            </div>
        </div>
    );
}

export default SeatAllocation;
