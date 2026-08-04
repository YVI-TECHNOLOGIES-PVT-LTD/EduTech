import type { PaymentRecord } from '../utils/finance.mapper';
import { CreditCard, Receipt, AlertCircle } from 'lucide-react';

interface PaymentCardProps {
    record: PaymentRecord;
    selected?: boolean;
    onSelect?: () => void;
}

const STATUS_STYLE: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
    SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-100',
    COMPLETED: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    FAILED: 'bg-rose-50 text-rose-700 border-rose-100',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
    REFUNDED: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function PaymentCard({ record, selected, onSelect }: PaymentCardProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full text-left rounded-2xl border p-4 space-y-3 transition-all ${
                selected ? 'border-emerald-400 bg-emerald-50/30' : 'border-gray-150 bg-white dark:bg-card hover:border-emerald-200'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-xs font-black text-gray-900">{record.candidate}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        {record.applicationNo} · {record.program}
                    </p>
                </div>
                <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${STATUS_STYLE[record.status] ?? STATUS_STYLE.PENDING}`}>
                    {record.status}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
                {record.amount !== undefined && (
                    <div className="flex items-center gap-1 font-bold">
                        <CreditCard className="w-3 h-3" /> ₹{record.amount}
                    </div>
                )}
                {record.outstanding !== undefined && (
                    <div className="flex items-center gap-1 text-rose-600 font-bold">
                        <AlertCircle className="w-3 h-3" /> Due ₹{record.outstanding}
                    </div>
                )}
                {record.receiptNumber && (
                    <div className="flex items-center gap-1 col-span-2 text-gray-500">
                        <Receipt className="w-3 h-3" /> {record.receiptNumber}
                    </div>
                )}
                {record.paymentMode && <div className="text-gray-500">Mode: {record.paymentMode}</div>}
                {record.totalPaid !== undefined && <div className="text-gray-500">Paid: ₹{record.totalPaid}</div>}
            </div>
        </button>
    );
}

export default PaymentCard;
