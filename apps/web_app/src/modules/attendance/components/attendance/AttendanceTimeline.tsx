import { Calendar, User, ShieldAlert } from 'lucide-react';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

export interface TimelineRecord {
    id: string;
    date: string;
    status: string;
    remarks?: string;
    updated_by_name?: string;
}

export interface AttendanceTimelineProps {
    records: TimelineRecord[];
}

export function AttendanceTimeline({ records }: AttendanceTimelineProps) {
    return (
        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
            {records.map(rec => (
                <div key={rec.id} className="flex gap-4 relative pl-7 first:pt-0 last:pb-0">
                    {/* Bullet marker */}
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white"></div>
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex-1 space-y-2">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                {new Date(rec.date).toLocaleDateString()}
                            </span>
                            <AttendanceStatusBadge status={rec.status} />
                        </div>
                        {rec.remarks && (
                            <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                                "{rec.remarks}"
                            </p>
                        )}
                        {rec.updated_by_name && (
                            <div className="flex items-center gap-1 text-[9px] text-gray-400 font-black uppercase tracking-wider pt-1.5 border-t border-slate-100/50">
                                <User className="w-3 h-3" />
                                <span>Recorded by: {rec.updated_by_name}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {records.length === 0 && (
                <div className="text-center py-8 text-xs font-bold text-gray-400 italic">
                    No timeline logs found.
                </div>
            )}
        </div>
    );
}

export default AttendanceTimeline;
