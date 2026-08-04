import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Calendar, User, Clock, FileText } from 'lucide-react';

export interface LeaveRequest {
    id: string;
    student_name: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    remarks?: string;
}

export interface LeaveCardProps {
    request: LeaveRequest;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    isProcessing?: boolean;
}

export function LeaveCard({ request, onApprove, onReject, isProcessing }: LeaveCardProps) {
    const statusStyles = {
        PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
        APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
    };

    return (
        <Card className="p-5 border-0 shadow-sm space-y-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                    <h4 className="text-xs font-black text-gray-900">{request.student_name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">{request.leave_type}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${statusStyles[request.status]}`}>
                    {request.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Start: {new Date(request.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>End: {new Date(request.end_date).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Reason</span>
                <p className="text-xs font-medium text-gray-600 leading-relaxed italic bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                    "{request.reason}"
                </p>
            </div>

            {request.status === 'PENDING' && (onApprove || onReject) && (
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100/50">
                    <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => onReject?.(request.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider"
                    >
                        Reject
                    </Button>
                    <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => onApprove?.(request.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider"
                    >
                        Approve
                    </Button>
                </div>
            )}
        </Card>
    );
}

export default LeaveCard;
