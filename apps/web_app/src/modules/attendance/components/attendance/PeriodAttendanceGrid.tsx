import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Calendar, Layers, CheckSquare } from 'lucide-react';

export interface StudentRow {
    id: string;
    full_name: string;
    student_code: string;
}

export interface PeriodAttendanceGridProps {
    students: StudentRow[];
    periods: number[]; // e.g. [1,2,3,4,5,6,7,8]
    periodMap: Record<string, Record<number, string>>; // studentId -> periodNumber -> status
    onCellChange: (studentId: string, period: number, status: string) => void;
}

export function PeriodAttendanceGrid({ students, periods, periodMap, onCellChange }: PeriodAttendanceGridProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<number>(1);

    const markAllForPeriod = (status: string) => {
        students.forEach(s => onCellChange(s.id, selectedPeriod, status));
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Active Period:</span>
                    <div className="flex gap-1.5 overflow-x-auto">
                        {periods.map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setSelectedPeriod(p)}
                                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                                    selectedPeriod === p
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-white text-gray-600 border border-gray-150'
                                }`}
                            >
                                P{p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={() => markAllForPeriod('present')}
                        className="bg-emerald-600 text-white text-[10px] font-black uppercase"
                    >
                        Mark P{selectedPeriod} Present
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => markAllForPeriod('absent')}
                        className="bg-rose-600 text-white text-[10px] font-black uppercase"
                    >
                        Mark P{selectedPeriod} Absent
                    </Button>
                </div>
            </div>

            {/* Grid Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100">
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider sticky left-0 bg-slate-50/70 z-10">Student</th>
                                {periods.map(p => (
                                    <th key={p} className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Period {p}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {students.map(s => {
                                const rowMap = periodMap[s.id] || {};
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 sticky left-0 bg-white hover:bg-slate-50/50">
                                            <p className="text-xs font-black text-gray-900">{s.full_name}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mt-0.5">{s.student_code}</p>
                                        </td>
                                        {periods.map(p => {
                                            const status = rowMap[p] || 'present';
                                            return (
                                                <td key={p} className="px-4 py-4 text-center">
                                                    <select
                                                        id={`select-${s.id}-${p}`}
                                                        value={status}
                                                        onChange={e => onCellChange(s.id, p, e.target.value)}
                                                        className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border outline-none transition-all ${
                                                            status === 'present'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : status === 'absent'
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}
                                                    >
                                                        <option value="present">Present</option>
                                                        <option value="absent">Absent</option>
                                                        <option value="late">Late</option>
                                                    </select>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default PeriodAttendanceGrid;
