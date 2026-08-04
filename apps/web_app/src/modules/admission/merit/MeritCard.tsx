import type { MeritRecord } from '../utils/merit.mapper';
import { Award, Hash, Tag, Trophy, User } from 'lucide-react';

interface MeritCardProps {
    record: MeritRecord;
    selected?: boolean;
    onSelect?: () => void;
}

const SEAT_STYLE: Record<string, string> = {
    SELECTED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    WAITLISTED: 'bg-amber-50 text-amber-700 border-amber-100',
    RESERVED: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
    PENDING: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function MeritCard({ record, selected, onSelect }: MeritCardProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full text-left rounded-2xl border p-4 space-y-3 transition-all ${
                selected ? 'border-violet-400 bg-violet-50/30' : 'border-gray-150 bg-white dark:bg-card hover:border-violet-200'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-xs font-black text-gray-900 dark:text-gray-100">{record.candidate}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        {record.applicationNo} · {record.program}
                    </p>
                </div>
                <span
                    className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${
                        SEAT_STYLE[record.seatStatus] ?? SEAT_STYLE.PENDING
                    }`}
                >
                    {record.seatStatus}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
                {record.rank !== undefined && (
                    <div className="flex items-center gap-1 font-bold text-violet-600">
                        <Hash className="w-3 h-3" /> Rank {record.rank}
                    </div>
                )}
                {record.finalMeritScore !== undefined && (
                    <div className="flex items-center gap-1 font-bold text-gray-800">
                        <Trophy className="w-3 h-3" /> {record.finalMeritScore}
                    </div>
                )}
                {record.entranceScore !== undefined && (
                    <div className="flex items-center gap-1 text-gray-600">
                        <Award className="w-3 h-3" /> Exam: {record.entranceScore}
                    </div>
                )}
                {record.interviewScore !== undefined && (
                    <div className="flex items-center gap-1 text-gray-600">
                        <User className="w-3 h-3" /> Interview: {record.interviewScore}
                    </div>
                )}
                {record.category && (
                    <div className="flex items-center gap-1 col-span-2 text-gray-500">
                        <Tag className="w-3 h-3" /> {record.category}
                    </div>
                )}
                {record.recommendation && (
                    <div className="col-span-2 font-bold uppercase text-[9px]">{record.recommendation}</div>
                )}
                {record.remarks && (
                    <div className="col-span-2 text-gray-500 italic">{record.remarks}</div>
                )}
            </div>
        </button>
    );
}

export default MeritCard;
