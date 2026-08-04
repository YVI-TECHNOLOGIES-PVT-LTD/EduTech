import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Sparkles, ClipboardList, ShieldAlert, Award, FileText, CheckCircle, 
    ArrowUpRight, Clock, Users, Activity, BarChart2, ShieldCheck, RefreshCw, Calendar
} from 'lucide-react';
import { useAttendance } from '../hooks/useAttendance';

export const AttendanceDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { sessions, loading, createSession, markStudent, transitionWorkflow } = useAttendance();

    const handleCreateSession = async () => {
        const campusId = prompt("Enter Campus UUID:");
        const branchId = prompt("Enter Branch UUID:");
        const yearId = prompt("Enter Academic Year UUID:");
        const date = prompt("Enter Session Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
        const slotId = prompt("Enter Timetable Slot UUID:");

        if (!campusId || !branchId || !yearId || !date || !slotId) return;

        try {
            await createSession(campusId, branchId, yearId, date, slotId);
            alert("Attendance session successfully created!");
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleMark = async (sessionId: string) => {
        const studentId = prompt("Enter Student UUID:");
        const status = prompt("Enter Status (PRESENT, ABSENT, LATE, MEDICAL):", "PRESENT");

        if (!studentId || !status) return;

        try {
            await markStudent(sessionId, studentId, status, 'MANUAL');
            alert("Attendance marked successfully!");
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleWorkflow = async (sessionId: string, decision: 'SUBMITTED' | 'APPROVED') => {
        try {
            await transitionWorkflow(sessionId, decision, 'Workflow checklist verified.');
            alert(`Workflow decision updated: ${decision}`);
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                        <Sparkles className="w-4.5 h-4.5 text-primary" />
                        Phase 15 Attendance
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        Attendance & Engagement Dashboard
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Manage active classes schedules capture checkins, HOD workflow approvals, and biometric sync logs.
                    </p>
                </div>

                <button 
                    onClick={handleCreateSession}
                    className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-premium-md text-xs hover:scale-[1.01]"
                >
                    Create Attendance Session
                </button>
            </div>

            {/* Quick KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Today's Attendance
                    </div>
                    <div className="text-2xl font-black text-primary mt-2">
                        94.20%
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Present roster average
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Defaulters warning
                    </div>
                    <div className="text-2xl font-black text-rose-500 mt-2">
                        5 Students
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        Attendance below 75%
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Connected scanners
                    </div>
                    <div className="text-2xl font-black text-emerald-500 mt-2">
                        12 / 12 Online
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Hardware device health
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Pending NOC clearances
                    </div>
                    <div className="text-2xl font-black text-violet-500 mt-2">
                        2 Requests
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-violet-500" />
                        Leaves exemptions approvals
                    </div>
                </div>
            </div>

            {/* Session grids splits */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Active sessions list */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Daily Classes Session queue
                        </h3>

                        {loading ? (
                            <div className="text-center py-12 text-xs text-gray-400 font-bold">
                                Loading attendance sessions...
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-12 text-xs text-gray-400 font-bold">
                                No sessions scheduled.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {sessions.map(s => (
                                    <div key={s.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">Slot UUID: {s.timetable_slot_id.substring(0, 8)}</span>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                                    s.status === 'LOCKED' ? 'bg-gray-950 text-white border-gray-950/20' :
                                                    s.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                Date: {new Date(s.session_date).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {s.status === 'DRAFT' && (
                                                <>
                                                    <button
                                                        onClick={() => handleMark(s.id)}
                                                        className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-xl"
                                                    >
                                                        Mark attendance
                                                    </button>
                                                    <button
                                                        onClick={() => handleWorkflow(s.id, 'SUBMITTED')}
                                                        className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl"
                                                    >
                                                        Submit to HOD
                                                    </button>
                                                </>
                                            )}

                                            {s.status === 'SUBMITTED' && (
                                                <button
                                                    onClick={() => handleWorkflow(s.id, 'APPROVED')}
                                                    className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-xl"
                                                >
                                                    Approve NOC & Lock
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Operations tools */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                            Operational Tools
                        </h3>
                        <div className="space-y-3 text-xs">
                            <Link to="/app/attendance/calendar" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Calendar & Makeup Classes
                            </Link>
                            <Link to="/app/attendance/exceptions" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Exception Approvals NOC
                            </Link>
                            <Link to="/app/attendance/leaves" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Student Leave request manager
                            </Link>
                            <Link to="/app/attendance/defaulters" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Defaulters & Warning alerts
                            </Link>
                            <Link to="/app/attendance/analytics" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Engagement Heatmaps trends
                            </Link>
                            <Link to="/app/attendance/devices" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Biometric devices status
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AttendanceDashboard;
