import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Check, X, ShieldAlert, Clock } from 'lucide-react';

export interface CorrectionItem {
    id: string;
    student_name: string;
    date: string;
    original_status: string;
    requested_status: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface CorrectionQueueProps {
    items: CorrectionItem[];
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    isProcessing?: boolean;
}

export function CorrectionQueue({ items, onApprove, onReject, isProcessing }: CorrectionQueueProps) {
    return (
        <div className="space-y-4">
            {items.map(item => (
                <Card key={item.id} className="p-5 border-0 shadow-sm space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                            <h4 className="text-xs font-black text-gray-900">{item.student_name}</h4>
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider mt-0.5">Date: {new Date(item.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            item.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                            {item.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50 text-center">
                        <div>
                            <span className="text-[9px] font-black text-gray-400 block uppercase">Original</span>
                            <span className="text-rose-600">{item.original_status}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-gray-400 block uppercase">Requested</span>
                            <span className="text-emerald-600">{item.requested_status}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Reason / Remarks</span>
                        <p className="text-xs font-medium text-gray-600 italic bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                            "{item.reason}"
                        </p>
                    </div>

                    {item.status === 'PENDING' && (onApprove || onReject) && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100/50">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => onReject?.(item.id)}
                                className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                            >
                                <X className="w-3.5 h-3.5" /> Reject
                            </Button>
                            <Button
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => onApprove?.(item.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                            >
                                <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                        </div>
                    )}
                </Card>
            ))}
            {items.length === 0 && (
                <div className="text-center py-12 text-xs font-bold text-gray-400 italic">
                    No pending correction requests found.
                </div>
            )}
        </div>
    );
}

export default CorrectionQueue;
