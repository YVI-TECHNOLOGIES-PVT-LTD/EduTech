import { useState } from 'react';
import { UserCheck, UserX, Clock, AlertTriangle, Search } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

export interface StudentRecord {
    id: string;
    full_name: string;
    student_code: string;
    roll_number?: string;
}

export interface AttendanceGridProps {
    students: StudentRecord[];
    attendanceMap: Record<string, string>;
    onChange: (studentId: string, status: string) => void;
    onBulkChange: (status: string) => void;
}

export function AttendanceGrid({ students, attendanceMap, onChange, onBulkChange }: AttendanceGridProps) {
    const [search, setSearch] = useState('');

    const filtered = students.filter(s =>
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or code..."
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onBulkChange('present')}
                        className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-black uppercase"
                    >
                        Mark All Present
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onBulkChange('absent')}
                        className="flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-black uppercase"
                    >
                        Mark All Absent
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100">
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider sticky left-0 bg-slate-50/70 z-10">Roll No</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider sticky left-14 bg-slate-50/70 z-10">Student</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((s, idx) => {
                                const status = attendanceMap[s.id] || 'present';
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-black text-gray-400 sticky left-0 bg-white hover:bg-slate-50/50">
                                            {s.roll_number || idx + 1}
                                        </td>
                                        <td className="px-6 py-4 sticky left-14 bg-white hover:bg-slate-50/50">
                                            <p className="text-xs font-black text-gray-900">{s.full_name}</p>
                                            <p className="text-[9px] font-black text-gray-400 uppercase mt-0.5">{s.student_code}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-1.5">
                                                {[
                                                    { id: 'present', label: 'P', color: 'emerald', icon: UserCheck },
                                                    { id: 'absent', label: 'A', color: 'rose', icon: UserX },
                                                    { id: 'late', label: 'L', color: 'amber', icon: Clock },
                                                    { id: 'excused', label: 'E', color: 'blue', icon: AlertTriangle }
                                                ].map(btn => (
                                                    <button
                                                        key={btn.id}
                                                        type="button"
                                                        onClick={() => onChange(s.id, btn.id)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                            status === btn.id
                                                                ? `bg-${btn.color}-600 text-white shadow-sm`
                                                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                        }`}
                                                        title={btn.label}
                                                    >
                                                        <btn.icon className="w-4 h-4" />
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
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

export default AttendanceGrid;
