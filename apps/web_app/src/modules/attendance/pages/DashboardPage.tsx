import { useAttendanceDashboard } from '../hooks/useAttendanceDashboard';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Users, UserCheck, UserX, Clock, Calendar, CheckSquare } from 'lucide-react';
import { AttendancePieChart, AttendanceGauge, AttendanceTrendChart } from '../components/analytics/AttendanceWidgets';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
    const navigate = useNavigate();
    const { summary, classSummaries, defaulters, isLoadingSummary } = useAttendanceDashboard();

    return (
        <div className="space-y-6 pb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Attendance Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Review school-wide statistics, active registries, and low-attendance alerts.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => navigate('/app/attendance/mark')} className="bg-primary text-white text-xs font-bold">
                        Mark Daily Attendance
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 border-0 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Total Active Students</span>
                        <h3 className="text-xl font-black text-gray-900 mt-1">{summary.totalStudents}</h3>
                    </div>
                    <Users className="w-8 h-8 text-slate-300" />
                </Card>

                <Card className="p-5 border-0 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Present Today</span>
                        <h3 className="text-xl font-black text-emerald-600 mt-1">{summary.presentToday}</h3>
                    </div>
                    <UserCheck className="w-8 h-8 text-emerald-200" />
                </Card>

                <Card className="p-5 border-0 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Absent Today</span>
                        <h3 className="text-xl font-black text-rose-600 mt-1">{summary.absentToday}</h3>
                    </div>
                    <UserX className="w-8 h-8 text-rose-200" />
                </Card>

                <Card className="p-5 border-0 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Daily Attendance Rate</span>
                        <h3 className="text-xl font-black text-indigo-600 mt-1">{summary.attendanceRateToday}%</h3>
                    </div>
                    <Clock className="w-8 h-8 text-indigo-200" />
                </Card>
            </div>

            {/* Main breakdown analytics */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <AttendanceTrendChart />
                </div>
                <div>
                    <AttendancePieChart />
                </div>
            </div>

            {/* Risk defaulters and Class summaries lists */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Risk list */}
                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-rose-500" /> Students At-Risk (&lt;75% Attendance)
                    </h3>
                    <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                        {defaulters.map((def: any) => (
                            <div key={def.id} className="py-2.5 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-black text-gray-900">{def.name}</p>
                                    <p className="text-[9px] text-gray-400 font-bold mt-0.5">Code: {def.code} · Class: {def.class_name} - {def.section_name}</p>
                                </div>
                                <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                                    {def.percent}%
                                </span>
                            </div>
                        ))}
                        {defaulters.length === 0 && (
                            <p className="text-center py-6 text-xs text-gray-400 font-bold italic">No students at risk.</p>
                        )}
                    </div>
                </Card>

                {/* Class summaries list */}
                <Card className="p-6 border-0 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-emerald-500" /> Class-wise Attendance Summary
                    </h3>
                    <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                        {classSummaries.map((cls: any, idx: number) => (
                            <div key={idx} className="py-2.5 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-black text-gray-900">{cls.class_name} - {cls.section_name}</p>
                                    <p className="text-[9px] text-gray-400 font-bold mt-0.5">Present: {cls.present_count} / {cls.total_students} students</p>
                                </div>
                                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                    {cls.attendance_rate}%
                                </span>
                            </div>
                        ))}
                        {classSummaries.length === 0 && (
                            <p className="text-center py-6 text-xs text-gray-400 font-bold italic">No summaries recorded today.</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default DashboardPage;
