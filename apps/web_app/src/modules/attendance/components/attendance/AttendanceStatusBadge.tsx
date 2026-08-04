export interface AttendanceStatusBadgeProps {
    status: string;
}

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
    const key = status?.toLowerCase() || 'unknown';

    const styles: Record<string, string> = {
        present: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        absent: 'bg-rose-50 text-rose-700 border border-rose-200',
        late: 'bg-amber-50 text-amber-700 border border-amber-200',
        excused: 'bg-blue-50 text-blue-700 border border-blue-200',
        leave: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        holiday: 'bg-slate-50 text-slate-700 border border-slate-200',
    };

    const labelMap: Record<string, string> = {
        present: 'Present',
        absent: 'Absent',
        late: 'Late',
        excused: 'Excused',
        leave: 'Leave',
        holiday: 'Holiday',
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${styles[key] || 'bg-gray-100 text-gray-500'}`}>
            {labelMap[key] || status}
        </span>
    );
}

export default AttendanceStatusBadge;
