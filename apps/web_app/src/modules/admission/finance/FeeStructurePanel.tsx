import { useState } from 'react';
import type { FinanceAction } from '../utils/finance.workflow';
import { Button } from '../../../components/ui/button';
import { Layers } from 'lucide-react';

interface FeeStructurePanelProps {
    canAssign?: boolean;
    isSubmitting?: boolean;
    onAction: (action: FinanceAction, payload?: Record<string, unknown>) => void;
}

export function FeeStructurePanel({ canAssign, isSubmitting, onAction }: FeeStructurePanelProps) {
    const [structureId, setStructureId] = useState('');

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Fee Structure Assignment
            </h3>
            <p className="text-[10px] text-gray-500">
                Required before payment collection. Copy a fee structure UUID from Fees module or admin configuration.
            </p>
            {canAssign ? (
                <>
                    <input
                        type="text"
                        value={structureId}
                        onChange={e => setStructureId(e.target.value)}
                        placeholder="Fee structure ID (UUID)"
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                    />
                    <Button
                        size="sm"
                        className="h-8 text-[10px] bg-indigo-600 text-white"
                        disabled={isSubmitting || !structureId}
                        onClick={() => onAction('assign_fee_structure', { structureId, remark: 'Fee structure assigned for admission' })}
                    >
                        Assign Fee Structure
                    </Button>
                </>
            ) : (
                <p className="text-xs text-gray-400">Read-only access</p>
            )}
        </div>
    );
}

export default FeeStructurePanel;
