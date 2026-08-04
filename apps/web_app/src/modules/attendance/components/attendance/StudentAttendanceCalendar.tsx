import { useMemo } from 'react';
import { Calendar as CalendarIcon, ArrowLeft, ArrowRight } from 'lucide-react';

export interface CalendarDayRecord {
    date: string; // YYYY-MM-DD
    status: 'present' | 'absent' | 'late' | 'excused' | 'holiday' | 'none';
}

export interface StudentAttendanceCalendarProps {
    year: number;
    month: number; // 1-indexed (1=Jan)
    records: CalendarDayRecord[];
    onPrevMonth?: () => void;
    onNextMonth?: () => void;
}

export function StudentAttendanceCalendar({ year, month, records, onPrevMonth, onNextMonth }: StudentAttendanceCalendarProps) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysInMonth = useMemo(() => {
        return new Date(year, month, 0).getDate();
    }, [year, month]);

    const firstDayIndex = useMemo(() => {
        // day of week for the 1st of that month (0=Sun, 6=Sat)
        const day = new Date(year, month - 1, 1).getDay();
        return day === 0 ? 6 : day - 1; // map so 0 is Mon, 6 is Sun
    }, [year, month]);

    const calendarCells = useMemo(() => {
        const cells = [];
        // Add empty cells for padding
        for (let i = 0; i < firstDayIndex; i++) {
            cells.push(null);
        }

        // Add calendar records
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const record = records.find(r => r.date === dateStr);
            cells.push({
                day: d,
                dateStr,
                status: record ? record.status : 'none'
            });
        }
        return cells;
    }, [year, month, daysInMonth, firstDayIndex, records]);

    const statusColors: Record<string, string> = {
        present: 'bg-emerald-500 text-white',
        absent: 'bg-rose-500 text-white',
        late: 'bg-amber-500 text-white',
        excused: 'bg-blue-500 text-white',
        holiday: 'bg-slate-400 text-white',
        none: 'bg-slate-50 text-slate-400 hover:bg-slate-100'
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-black text-gray-900">{monthNames[month - 1]} {year}</h3>
                </div>
                <div className="flex gap-1">
                    <button onClick={onPrevMonth} className="p-1.5 hover:bg-gray-50 border border-gray-150 rounded-lg">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button onClick={onNextMonth} className="p-1.5 hover:bg-gray-50 border border-gray-150 rounded-lg">
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {calendarCells.map((cell, idx) => {
                    if (cell === null) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                    return (
                        <div
                            key={cell.dateStr}
                            className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-black transition-all ${statusColors[cell.status]}`}
                            title={`Date: ${cell.dateStr} Status: ${cell.status}`}
                        >
                            <span>{cell.day}</span>
                            {cell.status !== 'none' && (
                                <span className="w-1 h-1 rounded-full bg-white/60 mt-0.5"></span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default StudentAttendanceCalendar;
