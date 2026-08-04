import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { QUERY_KEYS } from '../../../lib/queryKeys';
import {
    CalendarCheck, BookOpen, DollarSign, Bus, Library, ClipboardList,
    Bell, TrendingUp, Clock, CheckCircle2, AlertCircle, ArrowRight,
    GraduationCap, Calendar, Activity, FileText, Wifi, Sparkles
} from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import { PageWrapper } from '../../../components/layout/PageWrapper';

const AnimatedNumber = ({ value }: { value: number }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() => {
        const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' });
        return rounded.on("change", (latest) => setDisplayVal(latest));
    }, [value]);

    return <span>{displayVal.toLocaleString()}</span>;
};

import { DashboardProvider } from '../core/DashboardProvider';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardMapper } from '../utils/dashboard.mapper';
// Phase 3.3 Enterprise Workspace imports
import { WorkQueue } from '../components/workqueue/WorkQueue';
import { RoleDashboardInsights } from '../components/analytics/RoleDashboardInsights';
import { HealthPanel } from '../components/health/HealthPanel';

export function StudentDashboard() {
    return (
        <DashboardProvider>
            <StudentDashboardInner />
        </DashboardProvider>
    );
}

function StudentDashboardInner() {
    const { user } = useAuth();
    const [admissions, setAdmissions] = useState<any[]>([]);

    useEffect(() => {
        const fetchAdmissions = async () => {
            try {
                const res = await apiClient.get('/v1/admission/my');
                const list = res.data?.data || res.data || [];
                const active = list.filter((a: any) => {
                    const status = (a.status ?? '').toLowerCase();
                    return status !== 'enrolled' && status !== 'rejected';
                });
                setAdmissions(active);
            } catch (err) {
                console.error("Failed to load admissions", err);
            }
        };
        fetchAdmissions();
    }, []);

    const { kpis: engineKPIs, notifications: engineNotifications, loading: dashboardLoading } = useDashboard();

    const getKPIValue = (id: string, fallback: number) => {
        const item = engineKPIs.find(k => k.id === id);
        return item ? DashboardMapper.safeNumber(item.value) : fallback;
    };

    if (dashboardLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Academic Portal...</p>
        </div>
    );

    const attendancePercent = getKPIValue('student.kpi.attendance', 87);
    const feeDue = getKPIValue('student.kpi.fees_due', 12500);
    const upcomingExams = getKPIValue('student.kpi.exams', 3);
    const pendingAssignments = getKPIValue('student.kpi.tasks', 2);

    const todaySchedule = [
        { time: '9:00 AM', subject: 'Mathematics', teacher: 'Mr. Ramesh', room: 'Room 101', status: 'done' as const },
        { time: '10:00 AM', subject: 'Physics', teacher: 'Mrs. Lakshmi', room: 'Lab 3', status: 'ongoing' as const },
        { time: '11:00 AM', subject: 'English Literature', teacher: 'Ms. Priya', room: 'Room 204', status: 'upcoming' as const },
        { time: '12:00 PM', subject: 'Chemistry', teacher: 'Mr. Venkat', room: 'Lab 1', status: 'upcoming' as const },
    ];

    const announcements = engineNotifications && engineNotifications.length > 0 ? engineNotifications.map(n => ({
        id: n.id,
        title: n.title,
        body: n.message,
        time: n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : 'Just now',
        priority: n.type === 'error' ? 'high' : n.type === 'warning' ? 'medium' : 'low'
    })) : [
        { id: '1', title: 'Annual Day Practice', body: 'All students must report to auditorium by 3 PM today.', time: '2h ago', priority: 'high' },
        { id: '2', title: 'Library Book Return', body: 'Books issued in April must be returned by this Friday.', time: '1d ago', priority: 'medium' },
        { id: '3', title: 'Sports Day Registration', body: 'Register for track and field events before June 30.', time: '2d ago', priority: 'low' },
    ];

    const quickActions = [
        { icon: CalendarCheck, label: 'My Attendance', href: '/app/attendance/my', color: 'bg-green-500/10 text-green-500 border border-green-500/20' },
        { icon: DollarSign, label: 'Pay Fees', href: '/app/fees/my', color: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
        { icon: GraduationCap, label: 'My Results', href: '/app/student/exams/dashboard', color: 'bg-purple-500/10 text-purple-500 border border-purple-500/20' },
        { icon: BookOpen, label: 'Assignments', href: '/app/student/assignments', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' },
        { icon: Library, label: 'Library', href: '/app/library', color: 'bg-teal-500/10 text-teal-500 border border-teal-500/20' },
        { icon: ClipboardList, label: 'Leave Logs', href: '/app/attendance/my', color: 'bg-rose-500/10 text-rose-500 border border-rose-500/20' },
    ];

    const kpis = [
        { label: 'Attendance', value: attendancePercent, icon: Activity, color: 'text-green-500 bg-green-500/10 border-green-500/20', format: '%', sub: 'Required 75%+' },
        { label: 'Outstanding Fees', value: feeDue, icon: DollarSign, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', format: '₹', sub: 'Pay online' },
        { label: 'Upcoming Exams', value: upcomingExams, icon: GraduationCap, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', sub: 'Starts next week' },
        { label: 'Pending tasks', value: pendingAssignments, icon: ClipboardList, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', sub: 'Grades active' }
    ];

    const kpiElements = kpis.map((c, i) => (
        <div key={i} className="group relative bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 card-hover-lift flex flex-col justify-between">
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${c.color}`}>
                    <c.icon className="w-6 h-6" />
                </div>
            </div>

            <div className="mt-5 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                    {c.label}
                </p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        {c.format !== '%' && c.format}
                        <AnimatedNumber value={c.value} />
                        {c.format === '%' && c.format}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground ml-1">{c.sub}</span>
                </div>
            </div>
        </div>
    ));

    return (
        <PageWrapper
            title={`Good Morning, ${user?.full_name?.split(' ')[0] || 'Student'}`}
            description={`Academic Year 2026–27 | Section A | Standard Grade Portal`}
            icon={Sparkles}
            kpis={<>{kpiElements}</>}
            timeline={
                <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                        <h2 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                            <Bell className="w-4.5 h-4.5 text-primary" />
                            Notice Bulletin
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {announcements.map((ann: any) => (
                            <div key={ann.id} className={`p-4 rounded-2xl border-l-2 bg-gray-50/50 dark:bg-muted/10 ${
                                ann.priority === 'high' ? 'border-red-500' :
                                ann.priority === 'medium' ? 'border-amber-500' :
                                'border-blue-400'
                            }`}>
                                <p className="text-xs font-black text-gray-900 dark:text-white">{ann.title}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold mt-1 leading-relaxed">{ann.body}</p>
                                <p className="text-[9px] text-muted-foreground/60 font-black uppercase mt-2">{ann.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            }
        >
            <div className="space-y-6 lg:space-y-8">
                {/* Active Admission Applications Timelines */}
                {admissions.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            Admission Status Timeline
                        </h2>
                        {admissions.map(app => {
                            const steps = [
                                { key: 'draft', label: 'Draft Started' },
                                { key: 'submitted', label: 'Submitted' },
                                { key: 'under_review', label: 'Under Review' },
                                { key: 'docs_verified', label: 'Docs Verified' },
                                { key: 'payment_pending', label: 'Payment Pending' },
                                { key: 'payment_submitted', label: 'Payment Submitted' },
                                { key: 'payment_verified', label: 'Payment Verified' },
                                { key: 'recommended', label: 'Recommended' },
                                { key: 'approved', label: 'Approved' },
                                { key: 'enrolled', label: 'Enrolled' },
                            ];
                            const currentIdx = steps.findIndex(s => s.key === app.status);
                            return (
                                <div key={app.id} className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-border/45">
                                        <div>
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                                Applicant: {app.student_name}
                                            </span>
                                            <h3 className="font-black text-sm text-gray-900 dark:text-white mt-0.5">
                                                Grade Applied: {app.grade_applied_for}
                                            </h3>
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                            Stage: {app.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="relative flex justify-between items-center gap-2 pt-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {steps.map((step, idx) => {
                                            const isCompleted = idx < currentIdx;
                                            const isActive = idx === currentIdx;
                                            return (
                                                <div key={idx} className="flex flex-col items-center text-center flex-1 min-w-[70px] relative z-10">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                                                        isCompleted ? 'bg-emerald-500 text-white shadow-sm' :
                                                        isActive ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse' :
                                                        'bg-gray-200 text-gray-400 dark:bg-muted/20'
                                                    }`}>
                                                        {isCompleted ? '✓' : idx + 1}
                                                    </div>
                                                    <p className={`text-[8px] font-black mt-2 leading-tight ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {step.label}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}


                {/* Quick actions row */}
                <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider pb-4 border-b border-border/40 flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-primary" />
                        Operation Shortcuts
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {quickActions.map((action, i) => (
                            <a
                                key={i}
                                href={action.href}
                                className="flex flex-col items-center justify-center p-5 bg-gray-50/50 dark:bg-muted/10 border border-border/40 rounded-2xl transition-all duration-200 group hover:bg-white dark:hover:bg-card hover:border-primary/20 hover:shadow-premium-md hover:scale-[1.01]"
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform mb-3`}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-black text-gray-800 dark:text-gray-200">{action.label}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Bottom details grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {/* Attendance stats alert */}
                    <div className={`p-6 rounded-3xl border ${attendancePercent < 75 ? 'bg-red-500/5 border-red-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            {attendancePercent < 75 ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Attendance Eligibility</h3>
                        </div>
                        <div className="text-4xl font-black text-gray-900 dark:text-white">{attendancePercent}%</div>
                        <p className={`text-xs font-semibold mt-2 ${attendancePercent < 75 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {attendancePercent < 75 ? '⚠️ Attendance is below the mandatory 75% threshold.' : '✓ Your attendance criteria is fully matched.'}
                        </p>
                        <div className="mt-4 h-2 bg-gray-200/50 dark:bg-muted/20 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${attendancePercent < 75 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${attendancePercent}%` }} />
                        </div>
                    </div>

                </div>
            </div>

            {/* ─── Phase 3.3 Enterprise Workspace Panels ───────────────────── */}
            <RoleDashboardInsights />
            <WorkQueue />
            <HealthPanel />
        </PageWrapper>
    );
}

export default StudentDashboard;
