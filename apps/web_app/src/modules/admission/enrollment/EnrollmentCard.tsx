import type { EnrollmentRecord } from '../utils/enrollment.mapper';
import { GraduationCap } from 'lucide-react';

interface EnrollmentCardProps {
    record: EnrollmentRecord;
    selected?: boolean;
}

const PHASE_COLORS: Record<string, string> = {
    awaiting_confirmation: 'bg-amber-50 text-amber-700 border-amber-100',
    ready_to_enroll: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    enrolled: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    failed: 'bg-rose-50 text-rose-700 border-rose-100',
};

export function EnrollmentCard({ record, selected }: EnrollmentCardProps) {
    return (
        <div className={`border rounded-2xl p-5 space-y-3 ${selected ? 'border-indigo-300 bg-indigo-50/30' : 'bg-white dark:bg-card'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <div>
                        <h3 className="text-sm font-black text-gray-900">{record.candidate}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{record.applicationNo} · {record.program}</p>
                    </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${PHASE_COLORS[record.phase] ?? ''}`}>
                    {record.phase.replace(/_/g, ' ')}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div><span className="text-gray-400 font-bold">Admission No</span><p className="font-black">{record.admissionNumber ?? '—'}</p></div>
                <div><span className="text-gray-400 font-bold">Student ID</span><p className="font-black truncate">{record.studentId ?? '—'}</p></div>
            </div>
        </div>
    );
}

export default EnrollmentCard;
