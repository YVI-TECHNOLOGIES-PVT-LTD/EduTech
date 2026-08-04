import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Link } from 'react-router-dom';
import {
    FileText,
    Bell,
    Clock,
    CheckCircle2,
    Circle,
    ArrowRight,
    CreditCard,
    Calendar,
    GraduationCap,
    BookOpen,
    ShieldCheck,
    Sparkles,
    Users,
    Activity,
    Award,
    TrendingUp,
    HelpCircle,
    ChevronRight,
    ClipboardList,
    DollarSign
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { PageWrapper } from '../../../components/layout/PageWrapper';

type FeeTrackerState = 'DUE' | 'VERIFYING' | 'VERIFIED' | 'HIDDEN';

// ─── Sparkline Graph Component ──────────────────────────────────────────────────
const Sparkline = ({ points, color = "text-primary" }: { points: number[], color?: string }) => {
    const width = 100;
    const height = 30;
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = maxVal - minVal || 1;
    
    const coordinates = points.map((p, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((p - minVal) / range) * height;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg className={`w-14 h-5 ${color}`} viewBox={`0 0 ${width} ${height}`}>
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={coordinates}
            />
        </svg>
    );
};

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

import { ParentDashboardService } from '../services/ParentDashboardService';
import { DashboardMapper } from '../utils/dashboard.mapper';

export const ParentDashboard = () => {
    return (
        <DashboardProvider>
            <ParentDashboardInner />
        </DashboardProvider>
    );
};

const ParentDashboardInner = () => {
    const [children, setChildren] = useState<any[]>([]);
    const [admissions, setAdmissions] = useState<any[]>([]);
    const [feeData, setFeeData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [childData, feeDataRes] = await Promise.all([
                    ParentDashboardService.getOverview(),
                    ParentDashboardService.getMyFees()
                ]);
                setChildren(childData.children || []);
                setAdmissions(childData.admissions || []);
                setFeeData(feeDataRes || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const getStatusMessage = (status: string) => {
        switch (status) {
            case 'draft': return 'Application draft is initiated and in progress.';
            case 'submitted': return 'Your application has been received and is waiting for initial review.';
            case 'under_review': return 'An Admission Officer is currently reviewing your documents.';
            case 'docs_verified': return 'Documents verified! The school will soon enable the fee payment option for you.';
            case 'payment_pending': return 'ACTION REQUIRED: Please submit your admission fee to proceed.';
            case 'payment_submitted': return 'Payment details received. Our finance team is verifying your transaction.';
            case 'payment_verified': return 'Payment verified! Your application is now moving for final school approval.';
            case 'recommended': return 'Recommended for admission! Waiting for final approval from the Head of Institution.';
            case 'approved': return 'CONGRATULATIONS! Your admission is approved. You will be enrolled soon.';
            case 'enrolled': return 'Enrolled successfully. Welcome to the student master registry!';
            default: return 'Monitoring your application progress...';
        }
    };

    const getFeeBalance = (studentId: string) => {
        const record = feeData.find(f => f.student?.id === studentId);
        return record?.summary?.balance || 0;
    };

    // Tracker State Derivation
    const getTrackerState = (app: any): FeeTrackerState => {
        if (!app?.payment_enabled) return 'HIDDEN';
        if (app.payment_reference && app.status !== 'payment_verified' && !['recommended', 'approved', 'enrolled'].includes(app.status)) {
            return 'VERIFYING';
        }
        if (['payment_verified', 'recommended', 'approved', 'enrolled'].includes(app.status)) {
            return 'VERIFIED';
        }
        return 'DUE';
    };

    const { kpis: engineKPIs } = useDashboard();

    const getKPIValue = (id: string, fallback: number) => {
        const item = engineKPIs.find((k: any) => k.id === id);
        return item ? DashboardMapper.safeNumber(item.value) : fallback;
    };

    const trackerContext = useMemo(() => {
        const activeApps = (admissions || []).filter(a => getTrackerState(a) !== 'HIDDEN');
        const hasDue = activeApps.some(a => getTrackerState(a) === 'DUE');
        const isVerifying = activeApps.some(a => getTrackerState(a) === 'VERIFYING');
        const totalAmount = activeApps.reduce((sum, a) => sum + Number(a.payment_amount), 0);
        const stateKey = activeApps.map(a => getTrackerState(a)).join('-');

        return { activeApps, hasDue, isVerifying, totalAmount, stateKey };
    }, [admissions]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Parent Portal...</p>
        </div>
    );

    const totalStudents = children.length;
    // Dynamic admission fee due calculation based on whether fee payment is active
    const totalAdmissionFeesPending = admissions
        .filter(a => a.payment_enabled && a.status === 'payment_pending')
        .reduce((sum, a) => sum + Number(a.payment_amount || 0), 0);
    const calculatedDue = feeData.reduce((sum, f) => sum + (f.summary?.balance || 0), 0) + totalAdmissionFeesPending;
    const totalDue = getKPIValue('student.kpi.fees_due', calculatedDue);

    // Dynamically calculate the active admissions status tag
    const activeAdmissionsCount = admissions.filter(a => a.status !== 'enrolled' && a.status !== 'rejected').length;
    const admissionSubLabel = activeAdmissionsCount > 0 
        ? `${activeAdmissionsCount} In Progress` 
        : 'All Clear';

    const kpis = [
        { 
            label: 'My Children', 
            value: totalStudents, 
            icon: GraduationCap, 
            color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', 
            sub: 'Active profiles', 
            points: [0, 1, totalStudents] 
        },
        {
            label: 'Admissions Progress',
            value: activeAdmissionsCount,
            icon: ClipboardList,
            color: activeAdmissionsCount > 0 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
            sub: admissionSubLabel,
            points: [0, activeAdmissionsCount]
        },
        { 
            label: 'Fees Pending', 
            value: totalDue, 
            icon: DollarSign, 
            color: totalDue > 0 ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', 
            format: '₹', 
            sub: totalDue > 0 ? 'Payment Required' : 'All Clear', 
            points: [0, totalDue] 
        }
    ];

    const kpiElements = kpis.map((c, i) => (
        <div key={i} className="group relative bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 card-hover-lift flex flex-col justify-between">
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${c.color}`}>
                    <c.icon className="w-6 h-6" />
                </div>
                <Sparkline points={c.points} color={c.color.split(' ')[0]} />
            </div>

            <div className="mt-5 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                    {c.label}
                </p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-navy dark:text-white tracking-tight">
                        {c.format}
                        <AnimatedNumber value={c.value} />
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground ml-1">{c.sub}</span>
                </div>
            </div>
        </div>
    ));

    return (
        <PageWrapper
            title="Parent Dashboard"
            description="Track your child's academic cycles, grade logs, and fee ledger obligations."
            icon={Sparkles}
            kpis={<>{kpiElements}</>}
            timeline={
                <div className="space-y-6 lg:space-y-8">
                    {/* Quick actions links */}
                    <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                        <h3 className="text-xs font-black text-navy dark:text-white mb-6 uppercase tracking-wider pb-4 border-b border-border/45 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            Shortcut Actions
                        </h3>
                        <div className="space-y-2 font-bold">
                            <Link to="/app/fees/my" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 group transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs text-muted-foreground group-hover:text-foreground">Pay Fees Portal</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-0.5 transition-transform" />
                            </Link>

                            <Link to="/app/student/exams/dashboard" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 group transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs text-muted-foreground group-hover:text-foreground">Marksheet Tracker</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-0.5 transition-transform" />
                            </Link>

                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-navy via-blue-900 to-indigo-950 p-6 rounded-3xl text-white shadow-premium-lg relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                        <h3 className="font-black text-sm mb-1 text-gold">Portal Assistance</h3>
                        <p className="text-white/80 text-xs mb-4">Need help regarding admissions, document processing, or fees? Contact school desk.</p>
                        <button className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-sm transition-all">
                            Submit Inquiry
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-6 lg:space-y-8">
                {/* Visual Cover Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-navy via-blue-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl border border-white/10">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                    <span className="bg-gold text-navy text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Parent Dashboard
                    </span>
                    <h1 className="text-3xl font-black mt-2 tracking-tight">Welcome Back</h1>
                    <p className="text-white/70 text-xs mt-1 max-w-md leading-relaxed">
                        Easily monitor and check your child's academic grades, notice bulletins, and pending administrative balances.
                    </p>
                </div>

                {/* Active Fee Obligations Tracker Roadmap */}
                <AnimatePresence mode="wait">
                    {trackerContext.activeApps.length > 0 && (
                        <motion.div
                            key={trackerContext.stateKey}
                            className="bg-white dark:bg-card p-6 rounded-3xl border border-border/40 shadow-premium-sm relative overflow-hidden"
                        >
                            <h3 className="text-xs font-black text-navy dark:text-white uppercase tracking-wider mb-6 pb-4 border-b border-border/45">
                                Financial Roadmap Tracker
                            </h3>

                            <div className="space-y-4">
                                {trackerContext.activeApps.map(a => {
                                    const state = getTrackerState(a);
                                    const isDue = state === 'DUE';
                                    const isVerifying = state === 'VERIFYING';

                                    return (
                                        <div key={a.id} className="p-5 rounded-2xl border border-border/40 bg-gray-50/20 dark:bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">{a.student_name}</span>
                                                <div className="text-2xl font-black text-navy dark:text-white">₹{Number(a.payment_amount).toLocaleString()}</div>
                                            </div>

                                            <div className="flex gap-4 items-center">
                                                <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${
                                                    isDue ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    isVerifying ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                }`}>
                                                    {isDue ? 'Due' : isVerifying ? 'Verifying' : 'Complete'}
                                                </div>
                                                <Link to={`/app/admissions/${a.id}`} className="text-[10px] font-black text-indigo-500 uppercase hover:underline">
                                                    Manage →
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Active Admission Applications Timelines */}
                {admissions.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-black text-navy dark:text-white uppercase tracking-wider flex items-center gap-2">
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
                                            <h3 className="font-black text-sm text-navy dark:text-white mt-0.5">
                                                Grade Applied: {app.grade_applied_for}
                                            </h3>
                                            <p className="text-[10px] text-gray-500 font-medium mt-1">
                                                {getStatusMessage(app.status)}
                                            </p>
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-gold/15 text-gold-dark border border-gold/30">
                                            Stage {currentIdx + 1}: {app.status?.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {/* Stepper block wrapper */}
                                    <div className="relative flex justify-between items-center gap-2 pt-2 overflow-x-auto pb-4 scrollbar-hide">
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

                {/* Kids Overview / Profiles Section */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-navy dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Family Academic Registry
                    </h2>

                    {children.length === 0 && admissions.length === 0 ? (
                        <div className="bg-white dark:bg-card p-12 rounded-3xl border border-dashed border-border/60 text-center">
                            <GraduationCap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3 animate-bounce" />
                            <h3 className="text-sm font-black text-gray-900 dark:text-white">No active profiles mapped</h3>
                            <p className="text-xs text-muted-foreground mt-1.5">Contact school administrators to link student registries.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Render Enrolled Children */}
                            {children.map((child) => {
                                const s = child.student;
                                const attendancePercent = s.attendance?.[0]?.attendance_percentage ?? 95;
                                const examPercent = s.exam_stats?.[0]?.percentage ?? 88;

                                return (
                                    <div key={child.student_id} className="bg-white dark:bg-card border border-border/40 rounded-3xl overflow-hidden shadow-premium-sm hover:shadow-premium-md transition-all duration-300 card-hover-lift">
                                        <div className="p-6 bg-gray-50/50 dark:bg-muted/10 border-b border-border/45 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-navy to-blue-900 text-white flex items-center justify-center text-sm font-black shadow-sm">
                                                    {s.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-sm text-navy dark:text-white">{s.full_name}</h3>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">ID: {s.student_code} • ENROLLED STUDENT</p>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                Active
                                            </span>
                                        </div>
                                        <div className="p-6 space-y-6">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-500 border border-gray-50">
                                                        <Activity className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase">Attendance</p>
                                                        <p className="text-xs font-bold text-navy">{attendancePercent}%</p>
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-xl shadow-sm text-blue-500 border border-gray-50">
                                                        <Award className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase">Exam Score</p>
                                                        <p className="text-xs font-bold text-navy">{examPercent}%</p>
                                                    </div>
                                                </div>

                                                <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-3 col-span-2 md:col-span-1">
                                                    <div className="p-2 bg-white rounded-xl shadow-sm text-purple-500 border border-gray-50">
                                                        <CreditCard className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase">Current Term Balance</p>
                                                        <p className="text-xs font-bold text-navy">₹{getFeeBalance(child.student_id).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100">
                                                <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-4">Assigned Academic Guides</h4>
                                                <div className="flex flex-wrap gap-3">
                                                    {s.faculty_assignments?.length > 0 ? (
                                                        s.faculty_assignments.map((fa: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-2.5 bg-gray-50/40 dark:bg-muted/5 border border-border/40 px-3.5 py-2 rounded-xl">
                                                                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                                                                    {fa.faculty?.full_name?.charAt(0)}
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{fa.faculty?.full_name}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-gray-400 font-semibold italic">No advisors assigned yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Render Active Admission Applicants */}
                            {admissions.map((app) => (
                                <div key={app.id} className="bg-white dark:bg-card border border-border/40 rounded-3xl overflow-hidden shadow-premium-sm hover:shadow-premium-md transition-all duration-300 card-hover-lift">
                                    <div className="p-6 bg-amber-500/5 dark:bg-amber-500/10 border-b border-border/45 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center text-sm font-black shadow-sm">
                                                {app.student_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-sm text-navy dark:text-white">{app.student_name}</h3>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Applied Grade: {app.grade_applied_for} • ADMISSION APPLICANT</p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 border border-amber-500/30">
                                            {app.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl shadow-sm text-amber-500 border border-gray-50">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase">Application Stage</p>
                                                    <p className="text-xs font-bold text-navy truncate capitalize">{app.status?.replace('_', ' ')}</p>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl shadow-sm text-primary border border-gray-50">
                                                    <DollarSign className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase">Admission Fee</p>
                                                    <p className="text-xs font-bold text-navy">₹{Number(app.payment_amount || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <Link to={`/app/admissions/${app.id}`} className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                                                View Application Timeline <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};
