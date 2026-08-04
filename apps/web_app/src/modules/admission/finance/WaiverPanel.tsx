import { useState } from 'react';
import type { FinanceAction } from '../utils/finance.workflow';
import { Button } from '../../../components/ui/button';
import { Percent } from 'lucide-react';

interface WaiverPanelProps {
    canWaiver?: boolean;
    isSubmitting?: boolean;
    onAction: (action: FinanceAction, payload?: Record<string, unknown>) => void;
}

export function WaiverPanel({ canWaiver, isSubmitting, onAction }: WaiverPanelProps) {
    const [componentId, setComponentId] = useState('');
    const [waiverAmount, setWaiverAmount] = useState('');
    const [remark, setRemark] = useState('');

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" /> Fee Waiver
            </h3>
            {canWaiver ? (
                <>
                    <input type="text" value={componentId} onChange={e => setComponentId(e.target.value)} placeholder="Fee component ID (UUID)" className="w-full px-3 py-2 border rounded-xl text-xs" />
                    <input type="number" value={waiverAmount} onChange={e => setWaiverAmount(e.target.value)} placeholder="Waiver amount" className="w-full px-3 py-2 border rounded-xl text-xs" />
                    <textarea value={remark} onChange={e => setRemark(e.target.value)} placeholder="Waiver reason…" className="w-full px-3 py-2 border rounded-xl text-xs min-h-[50px]" />
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" className="h-8 text-[10px] bg-indigo-600 text-white" disabled={isSubmitting || !componentId || !waiverAmount} onClick={() => onAction('apply_waiver', { componentId, waiverAmount: Number(waiverAmount), remark })}>
                            Apply Waiver
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px]" disabled={isSubmitting} onClick={() => onAction('approve_waiver', { componentId, waiverAmount: Number(waiverAmount), remark })}>
                            Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] border-rose-200 text-rose-600" disabled={isSubmitting} onClick={() => onAction('reject_waiver', { remark })}>
                            Reject
                        </Button>
                    </div>
                </>
            ) : (
                <p className="text-xs text-gray-400">You do not have permission to manage waivers.</p>
            )}
        </div>
    );
}

export default WaiverPanel;
