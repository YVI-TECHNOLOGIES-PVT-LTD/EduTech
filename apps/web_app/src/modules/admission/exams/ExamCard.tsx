import type { ExamRecord } from '../utils/exam.mapper';
import { Calendar, MapPin, Award, User, FileText } from 'lucide-react';

interface ExamCardProps {
    record: ExamRecord;
    selected?: boolean;
    onSelect?: () => void;
}

const PASS_STYLE: Record<string, string> = {
    PASS: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    FAIL: 'bg-rose-50 text-rose-700 border-rose-100',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
    ABSENT: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function ExamCard({ record, selected, onSelect }: ExamCardProps) {
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
                    <p className="text-xs font-black text-gray-900 dark:text-gray-100">{record.examName}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{record.subject}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${PASS_STYLE[record.passFail] ?? PASS_STYLE.PENDING}`}>
                    {record.passFail}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
                {record.examDate && (
                    <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3 h-3" /> {new Date(record.examDate).toLocaleDateString()}
                    </div>
                )}
                {record.center && (
                    <div className="flex items-center gap-1 text-gray-500">
                        <MapPin className="w-3 h-3" /> {record.center}
                    </div>
                )}
                {record.obtainedMarks !== undefined && (
                    <div className="flex items-center gap-1 text-gray-700 font-bold">
                        <Award className="w-3 h-3" /> {record.obtainedMarks}
                        {record.totalMarks !== undefined ? ` / ${record.totalMarks}` : ''}
                    </div>
                )}
                {record.percentage !== undefined && (
                    <div className="font-bold text-indigo-600">{record.percentage.toFixed(1)}%</div>
                )}
                {record.grade && (
                    <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-gray-400" /> Grade: {record.grade}
                    </div>
                )}
                {record.evaluator && (
                    <div className="flex items-center gap-1 col-span-2">
                        <User className="w-3 h-3 text-gray-400" /> {record.evaluator}
                    </div>
                )}
                {record.evaluationDate && (
                    <div className="col-span-2 text-gray-400">
                        Evaluated: {new Date(record.evaluationDate).toLocaleString()}
                    </div>
                )}
                {record.remarks && (
                    <div className="col-span-2 text-gray-500 italic">{record.remarks}</div>
                )}
            </div>
        </button>
    );
}

export default ExamCard;
