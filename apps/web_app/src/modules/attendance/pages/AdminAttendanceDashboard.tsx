import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Users, UserCheck, UserX, AlertCircle, BarChart2 } from 'lucide-react';

export const AdminAttendanceDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [classStats, setClassStats] = useState<any[]>([]);
    const [defaulters, setDefaulters] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [sumRes, classRes, defRes] = await Promise.all([
                    apiClient.get('/attendance/admin/summary'),
                    apiClient.get('/attendance/admin/class-summary'),
                    apiClient.get('/attendance/admin/defaulters')
                ]);
                setSummary(sumRes.data);
                setClassStats(classRes.data);
                setDefaulters(defRes.data);
            } catch (err) {
                console.error("Failed to load attendance stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Intelligence</h1>
                    <p className="text-gray-500">Real-time daily tracking & defaulter analysis</p>
                </div>
                <a
                    href="/app/attendance/admin/bridge"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2"
                >
                    <Users className="w-4 h-4" />
                    Exam Eligibility Override
                </a>
            </div>

            {/* Daily Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-400 uppercase">Total Students</div>
                            <div className="text-2xl font-black text-gray-900">{summary?.totalStudents}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-400 uppercase">Present Today</div>
                            <div className="text-2xl font-black text-gray-900">{summary?.presentToday}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <UserX className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-400 uppercase">Absent Today</div>
                            <div className="text-2xl font-black text-gray-900">{summary?.absentToday}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <BarChart2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-400 uppercase">Daily Rate</div>
                            <div className="text-2xl font-black text-gray-900">{summary?.attendanceRateToday}%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Class-wise Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">Today's Class Performance</h3>
                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {summary?.sessionsMarked} Sessions Marked
                        </span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Class</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Present</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {classStats.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">No attendance marked today yet.</td></tr>
                                ) : (
                                    classStats.map((s, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-900">{s.class_name} - {s.section_name}</td>
                                            <td className="p-4 text-emerald-600 font-bold text-right">{s.present_count}</td>
                                            <td className="p-4 text-gray-500 text-right">{s.total_students}</td>
                                            <td className="p-4 text-right">
                                                <span className={`font-bold ${Number(s.attendance_rate) < 75 ? 'text-red-500' : 'text-emerald-600'
                                                    }`}>
                                                    {s.attendance_rate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Critical Defaulters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Critical Defaulters (&lt; 75%)
                        </h3>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-red-50 sticky top-0">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-red-800 uppercase">Student</th>
                                    <th className="p-4 text-xs font-bold text-red-800 uppercase">Class</th>
                                    <th className="p-4 text-xs font-bold text-red-800 uppercase text-right">Attendance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {defaulters.length === 0 ? (
                                    <tr><td colSpan={3} className="p-8 text-center text-gray-400">No critical defaulters found. Good job!</td></tr>
                                ) : (
                                    defaulters.map((d, i) => (
                                        <tr key={i} className="hover:bg-red-50/30">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900">{d.name}</div>
                                                <div className="text-xs text-gray-400">{d.code}</div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">{d.class_name} - {d.section_name}</td>
                                            <td className="p-4 text-right font-black text-red-600">
                                                {d.percent.toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
