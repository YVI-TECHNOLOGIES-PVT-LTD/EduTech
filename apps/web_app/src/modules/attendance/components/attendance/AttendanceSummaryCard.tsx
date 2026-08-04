import { Card } from '../../../../components/ui/card';
import { UserCheck, UserX, Clock, AlertCircle } from 'lucide-react';

export interface AttendanceSummaryCardProps {
    present: number;
    absent: number;
    late: number;
    excused: number;
}

export function AttendanceSummaryCard({ present, absent, late, excused }: AttendanceSummaryCardProps) {
    const total = present + absent + late + excused;
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

    return (
        <Card className="p-6 border-0 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
            {/* Main % Gauge */}
            <div className="flex flex-col items-center justify-center border-r border-gray-100 pr-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Attendance Rate</p>
                <div className="text-3xl font-black text-primary mt-2">{rate}%</div>
                <p className="text-[9px] font-bold text-gray-400 mt-1">out of {total} sessions</p>
            </div>

            {/* Stats list */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Present</p>
                    <p className="text-lg font-black text-gray-900">{present}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                    <UserX className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Absent</p>
                    <p className="text-lg font-black text-gray-900">{absent}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Late</p>
                    <p className="text-lg font-black text-gray-900">{late}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Excused</p>
                    <p className="text-lg font-black text-gray-900">{excused}</p>
                </div>
            </div>
        </Card>
    );
}

export default AttendanceSummaryCard;
