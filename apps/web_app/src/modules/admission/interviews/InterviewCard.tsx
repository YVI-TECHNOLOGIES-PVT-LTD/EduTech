import type { InterviewRecord } from '../utils/interview.mapper';
import { Calendar, MapPin, Users, Clock, Award, MessageSquare } from 'lucide-react';

interface InterviewCardProps {
    record: InterviewRecord;
    selected?: boolean;
    onSelect?: () => void;
}

const STATUS_STYLE: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
    evaluated: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    recommended: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

export function InterviewCard({ record, selected, onSelect }: InterviewCardProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full text-left rounded-2xl border p-4 space-y-3 transition-all ${
                selected ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-150 bg-white dark:bg-card hover:border-indigo-200'
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
                        STATUS_STYLE[record.status] ?? STATUS_STYLE.pending
                    }`}
                >
                    {record.status.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
                {record.interviewDate && (
                    <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3 h-3" /> {record.interviewDate}
                    </div>
                )}
                {record.interviewSlot && (
                    <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-3 h-3" /> {record.interviewSlot}
                    </div>
                )}
                {record.panelMembers && (
                    <div className="flex items-center gap-1 text-gray-500 col-span-2">
                        <Users className="w-3 h-3" /> {record.panelMembers}
                    </div>
                )}
                {record.room && (
                    <div className="flex items-center gap-1 text-gray-500">
                        <MapPin className="w-3 h-3" /> {record.room}
                    </div>
                )}
                <div className="font-bold text-gray-700">Attendance: {record.attendance}</div>
                {record.panelScore !== undefined && (
                    <div className="flex items-center gap-1 font-bold text-indigo-600">
                        <Award className="w-3 h-3" /> Score: {record.panelScore}
                    </div>
                )}
                {record.recommendation && record.recommendation !== 'PENDING' && (
                    <div className="col-span-2 font-bold uppercase text-[9px]">{record.recommendation}</div>
                )}
                {record.remarks && (
                    <div className="col-span-2 flex items-start gap-1 text-gray-500 italic">
                        <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" /> {record.remarks}
                    </div>
                )}
            </div>
        </button>
    );
}

export default InterviewCard;
