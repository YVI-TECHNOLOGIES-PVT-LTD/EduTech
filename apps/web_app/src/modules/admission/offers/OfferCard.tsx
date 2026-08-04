import type { OfferRecord } from '../utils/offer.mapper';
import { Calendar, Mail, FileText, Award } from 'lucide-react';

interface OfferCardProps {
    record: OfferRecord;
    selected?: boolean;
    onSelect?: () => void;
}

const STATUS_STYLE: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
    GENERATED: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    SENT: 'bg-blue-50 text-blue-700 border-blue-100',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
    EXPIRED: 'bg-gray-100 text-gray-600 border-gray-200',
    WITHDRAWN: 'bg-gray-100 text-gray-600 border-gray-200',
    DEFERRED: 'bg-purple-50 text-purple-700 border-purple-100',
    CONDITIONAL: 'bg-yellow-50 text-yellow-700 border-yellow-100',
};

export function OfferCard({ record, selected, onSelect }: OfferCardProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full text-left rounded-2xl border p-4 space-y-3 transition-all ${
                selected ? 'border-rose-400 bg-rose-50/30' : 'border-gray-150 bg-white dark:bg-card hover:border-rose-200'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-xs font-black text-gray-900">{record.candidate}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        {record.applicationNo} · {record.program}
                    </p>
                </div>
                <span
                    className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${
                        STATUS_STYLE[record.status] ?? STATUS_STYLE.PENDING
                    }`}
                >
                    {record.status}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
                {record.offerNumber && (
                    <div className="flex items-center gap-1 font-bold col-span-2">
                        <FileText className="w-3 h-3" /> {record.offerNumber}
                    </div>
                )}
                {record.issueDate && (
                    <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3 h-3" /> {record.issueDate}
                    </div>
                )}
                {record.expiryDate && (
                    <div className="text-gray-500">Expires: {record.expiryDate}</div>
                )}
                {record.parentEmail && (
                    <div className="flex items-center gap-1 col-span-2 text-gray-500">
                        <Mail className="w-3 h-3" /> {record.parentEmail}
                    </div>
                )}
                {record.meritRank !== undefined && (
                    <div className="flex items-center gap-1 font-bold text-violet-600">
                        <Award className="w-3 h-3" /> Merit #{record.meritRank}
                    </div>
                )}
                {record.seatConfirmed !== undefined && (
                    <div className="font-bold">Seat: {record.seatConfirmed ? 'Confirmed' : 'Pending'}</div>
                )}
            </div>
        </button>
    );
}

export default OfferCard;
