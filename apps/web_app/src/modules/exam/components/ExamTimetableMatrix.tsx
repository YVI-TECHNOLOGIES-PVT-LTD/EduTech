import React, { useMemo } from 'react';
import { Download } from 'lucide-react';

interface ExamTimetableMatrixProps {
    exam: any;
    classes: any[];
    schedules: any[];
    onEditSchedule?: (schedule: any) => void;
}

export const ExamTimetableMatrix: React.FC<ExamTimetableMatrixProps> = ({ exam, classes, schedules, onEditSchedule }) => {

    // 1. Get Applicable Classes (Columns)
    // Filter classes to only those applicable to this exam
    const applicableClasses = useMemo(() => {
        if (!exam?.applicable_classes?.length) return classes;
        return classes
            .filter(c => exam.applicable_classes.includes(c.id))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }, [classes, exam]);

    // 2. Get Unique Dates (Rows)
    const uniqueDates = useMemo(() => {
        const dates = new Set(schedules.map(s => s.exam_date));
        return Array.from(dates).sort();
    }, [schedules]);

    // 3. Create a Map for O(1) Lookup: "Date|ClassID" -> Schedule[]
    const scheduleMap = useMemo(() => {
        const map = new Map<string, any[]>();
        schedules.forEach(s => {
            const key = `${s.exam_date}|${s.subject?.class_id}`;
            const existing = map.get(key) || [];
            map.set(key, [...existing, s]);
        });
        return map;
    }, [schedules]);

    // Helper to format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            full: date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            day: date.toLocaleDateString(undefined, { weekday: 'long' }),
            date: date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })
        };
    };

    if (applicableClasses.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No applicable classes found for this exam.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header / Actions */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{exam?.name || 'Exam Timetable'}</h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">
                        Consolidated Matrix View • {uniqueDates.length} Days • {applicableClasses.length} Classes
                    </p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm print:hidden"
                >
                    <Download className="w-4 h-4" /> Print / PDF
                </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr>
                            {/* Corner Header */}
                            <th className="bg-gray-100 border-b-2 border-r border-gray-200 p-4 text-left min-w-[150px] sticky left-0 z-10">
                                <span className="block text-xs font-black text-gray-400 uppercase">Date & Day</span>
                            </th>

                            {/* Class Headers */}
                            {applicableClasses.map(cls => (
                                <th key={cls.id} className="bg-gray-50 border-b-2 border-r border-gray-100 p-4 min-w-[180px] text-center">
                                    <div className="font-black text-gray-800 text-base">{cls.name}</div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Class</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {uniqueDates.length > 0 ? (
                            uniqueDates.map(date => {
                                const { date: dateNum, day } = formatDate(date);
                                return (
                                    <tr key={date} className="hover:bg-gray-50/30 transition-colors">
                                        {/* Date Column */}
                                        <td className="bg-white border-r border-gray-100 p-4 sticky left-0 z-10 font-medium text-gray-900 whitespace-nowrap group-hover:bg-gray-50/30">
                                            <div className="font-bold text-indigo-900">{dateNum}</div>
                                            <div className="text-xs font-bold text-gray-400 uppercase">{day}</div>
                                        </td>

                                        {/* Class Schedule Cells */}
                                        {applicableClasses.map(cls => {
                                            const key = `${date}|${cls.id}`;
                                            const cellSchedules = scheduleMap.get(key) || [];

                                            return (
                                                <td key={key} className="p-0 border-r border-gray-100 align-top relative h-full">
                                                    {cellSchedules.length > 0 ? (
                                                        <div className="flex flex-col h-full">
                                                            {cellSchedules.map((sch, idx) => (
                                                                <div
                                                                    key={sch.id}
                                                                    onClick={() => onEditSchedule?.(sch)}
                                                                    className={`
                                                                        p-3 flex-1 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-indigo-50 transition-colors group
                                                                        ${idx > 0 ? 'border-t border-dashed border-gray-100' : ''}
                                                                        ${sch.status === 'COMPLETED' ? 'opacity-60 bg-gray-50' : ''}
                                                                    `}
                                                                >
                                                                    <div className="font-black text-gray-800 text-sm group-hover:text-indigo-700 transition-colors">
                                                                        {sch.subject?.name || 'Unknown Subject'}
                                                                    </div>
                                                                    <div className="text-[11px] font-bold text-gray-500 mt-1 bg-white px-2 py-0.5 rounded border border-gray-100 group-hover:border-indigo-100">
                                                                        {sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 h-full flex items-center justify-center">
                                                            <span className="text-gray-200 font-bold text-lg select-none">-</span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={applicableClasses.length + 1} className="p-12 text-center text-gray-400 font-bold italic">
                                    No schedules found for this exam window.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
