import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    Users,
    GraduationCap,
    BookOpen,
    FileCheck,
    ArrowUpRight,
    Calendar,
    Settings,
    Bell,
    CheckCircle,
    ClipboardList,
    TrendingUp,
    Coins,
    CreditCard,
    Database,
    HelpCircle,
    UserCheck,
    FileText,
    Percent,
    Sparkles,
    CalendarDays,
    ShieldCheck
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useMasterData } from '../../admission/context/MasterDataContext';
import { ActivityTimeline } from '../../../components/ActivityTimeline';
import { PageWrapper } from '../../../components/layout/PageWrapper';
import { useSettingsStore } from '../../../store/settings.store';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

// Custom CountUp Component using Framer Motion
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

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
import { QuickActions } from '../components/actions/QuickActions';
import { AdminCrossModulePanel } from '../components/widgets/CrossModulePanels';
import { RoleDashboardInsights } from '../components/analytics/RoleDashboardInsights';
import { HealthPanel } from '../components/health/HealthPanel';

export const AdminDashboard = () => {
    return (
        <DashboardProvider>
            <AdminDashboardInner />
        </DashboardProvider>
    );
};

const AdminDashboardInner = () => {
    const { user, hasPermission } = useAuth();
    const { activeSchool, activeAcademicYear } = useMasterData();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        let isMounted = true;
        apiClient.get('/dashboard/admin/overview')
            .then(res => {
                if (isMounted) setStats(res.data);
            })
            .catch(err => {
                if (isMounted) console.error('Dashboard load failed', err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        // Set timer for greeting context
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, []);

    const isExamAdmin = hasPermission('exam.dashboard.view');
    const isFullAdmin = hasPermission('admin.dashboard.view');

    // If the user is ONLY an exam admin (not a full school admin), redirect them to
    // the dedicated exam-admin dashboard so they don't see school-wide KPIs.
    if (isExamAdmin && !isFullAdmin) {
        return <Navigate to="/app/exam-admin/dashboard" replace />;
    }

    const { kpis, charts, loading: dashboardLoading, error: dashboardError } = useDashboard();

    const getKPIValue = (id: string, fallback: number) => {
        const item = kpis.find((k: any) => k.id === id);
        return item ? DashboardMapper.safeNumber(item.value) : fallback;
    };

    // Greeting Message based on local time
    const getGreeting = () => {
        const hr = currentTime.getHours();
        if (hr < 12) return "Good Morning";
        if (hr < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Institutional Intelligence...</p>
        </div>
    );

    // Modern sparkline trend data
    const sparklineData = [
        { name: 'W1', value: 30 },
        { name: 'W2', value: 45 },
        { name: 'W3', value: 35 },
        { name: 'W4', value: 60 },
        { name: 'W5', value: 50 },
        { name: 'W6', value: 75 }
    ];

    const cards = [
        { label: 'Total Students', value: getKPIValue('admin.kpi.students', stats?.students || 0), icon: Users, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', trend: '+12% this term', sparkColor: '#3B82F6' },
        { label: 'Pending Admissions', value: getKPIValue('admin.kpi.admissions', stats?.pendingAdmissions || 0), icon: ClipboardList, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', trend: '14 actions required', link: '/app/admissions/review', sparkColor: '#F59E0B' },
        { label: 'Exams Scheduled', value: getKPIValue('admin.kpi.exams', stats?.exams || 0), icon: BookOpen, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', trend: 'Next scheduled in 4d', sparkColor: '#8B5CF6' },
        { label: 'Outstanding Fees', value: getKPIValue('admin.kpi.outstanding_fees', stats?.feeCollection ? parseInt(stats.feeCollection) : 230000), icon: Coins, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', trend: '96% collection rate', format: '₹', sparkColor: '#10B981' },
    ];

    const quickActions = [
        { label: 'Review Admissions', icon: FileCheck, link: '/app/admissions/review', desc: `${stats?.pendingAdmissions || 0} applications pending` },
        { label: 'Academic Setup', icon: GraduationCap, link: '/app/academic/classes', desc: 'Classes & Sections' },
        { label: 'Academic Governance', icon: Calendar, link: '/app/academic/years', desc: 'Session Lifecycle' },
        { label: 'Bulk Operations', icon: Database, link: '/app/admin/bulk', desc: 'Mass Assignment/Promotion' },
        ...(isExamAdmin ? [{
            label: 'Exam Management',
            icon: BookOpen,
            link: '/app/exam-admin/manage',
            desc: 'Planning & Results',
        }] : []),
        { label: 'Fee Structures', icon: Coins, link: '/app/fees/structures', desc: 'Manage Fees' },
        { label: 'Assign Fees', icon: FileCheck, link: '/app/fees/assign', desc: 'Student Billing' },
        { label: 'Record Payment', icon: CreditCard, link: '/app/fees/payments', desc: 'Cash/Cheque Entry' },
        { label: 'System Settings', icon: Settings, link: '/app/settings', desc: 'Global configuration' },
    ];

    const funnelChart = charts.find((c: any) => c.id === 'admin.chart.funnel');
    const admissionsFunnelData = funnelChart?.data || [
        { name: 'Submitted', value: stats?.totalApplications || 150 },
        { name: 'Reviewed', value: Math.round((stats?.totalApplications || 150) * 0.8) },
        { name: 'Invited', value: Math.round((stats?.totalApplications || 150) * 0.6) },
        { name: 'Enrolled', value: Math.round((stats?.totalApplications || 150) * 0.45) },
    ];

    const revenueChart = charts.find((c: any) => c.id === 'admin.chart.revenue');
    const revenueTrendData = revenueChart?.data || [
        { month: 'Jan', collected: 120000, target: 150000 },
        { month: 'Feb', collected: 145000, target: 150000 },
        { month: 'Mar', collected: 180000, target: 160000 },
        { month: 'Apr', collected: 210000, target: 180000 },
        { month: 'May', collected: 230000, target: 200000 },
        { month: 'Jun', collected: 245000, target: 220000 }
    ];

    const classesChart = charts.find((c: any) => c.id === 'admin.chart.classes');
    const classColors = ['#3B82F6', '#8B5CF6', '#10B981'];
    const classDistributionData = classesChart?.data.map((d: any, i: number) => ({
        name: d.name,
        value: d.value,
        color: classColors[i % classColors.length]
    })) || [
        { name: 'Primary (Grade 1-5)', value: 240, color: '#3B82F6' },
        { name: 'Middle (Grade 6-8)', value: 160, color: '#8B5CF6' },
        { name: 'Secondary (Grade 9-10)', value: 100, color: '#10B981' }
    ];

    // Layout customizer KPI cards
    const kpiElements = cards.map((c, i) => (
        <div key={i} className="group relative bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 card-hover-lift flex flex-col justify-between">
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${c.color}`}>
                    <c.icon className="w-6 h-6" />
                </div>
                {/* Mini Sparkline Chart utilizing Recharts */}
                <div className="w-20 h-10 overflow-hidden opacity-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData}>
                            <Area type="monotone" dataKey="value" stroke={c.sparkColor} strokeWidth={1.5} fill={c.sparkColor} fillOpacity={0.05} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-5 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                    {c.label}
                </p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        {c.format}
                        <AnimatedNumber value={c.value} />
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 ml-1">{c.trend}</span>
                </div>
            </div>

            {c.link && (
                <Link to={c.link} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-muted/60 hover:bg-primary hover:text-white rounded-lg text-muted-foreground">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
            )}
        </div>
    ));

    return (
        <PageWrapper
            title={`${getGreeting()}, Sathish`}
            description={`Academic Year ${activeAcademicYear?.year_label || 'No Academic Year'} | Active Campus: ${activeSchool?.name || 'No Campus'} | Dashboard overview`}
            icon={Sparkles}
            actions={
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 p-2.5 bg-white dark:bg-card border border-border/40 rounded-xl hover:bg-gray-50 text-muted-foreground hover:text-primary transition-all shadow-premium-sm">
                        <Bell className="w-4 h-4" />
                    </button>
                    <Link to="/app/admissions/review" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold transition-all shadow-premium-md shadow-glow hover:scale-[1.01] text-xs">
                        <ShieldCheck className="w-4.5 h-4.5" />
                        Admin Panel Actions
                    </Link>
                </div>
            }
            kpis={
                <>{kpiElements}</>
            }
            timeline={
                <div className="space-y-6 lg:space-y-8">
                    {/* Live timeline activities feed */}
                    <div className="bg-white dark:bg-card rounded-3xl p-6 border border-border/40 shadow-premium-sm">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                                <TrendingUp className="text-primary w-4.5 h-4.5" />
                                Live School Activities
                            </h3>
                        </div>
                        <ActivityTimeline />
                    </div>

                    {/* System Vitality Panel */}
                    <div className="bg-gradient-to-br from-gray-950 to-slate-900 rounded-3xl p-6 text-white shadow-premium-xl border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-bl-full filter blur-xl"></div>
                        <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-wider">
                            <CheckCircle className="text-primary w-4.5 h-4.5" />
                            Security & Health
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Server Response</span>
                                    <p className="text-xs font-black">API Gateway Active</p>
                                </div>
                                <span className="text-[9px] font-black uppercase py-0.5 px-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">Healthy</span>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Active Database Connections</span>
                                    <p className="text-xs font-black">Postgres Pool Stable</p>
                                </div>
                                <span className="text-[9px] font-black uppercase py-0.5 px-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg">Optimal</span>
                            </div>

                            <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all shadow-premium-md hover:scale-[1.01] text-xs">
                                Manage System Parameters
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="space-y-6 lg:space-y-8">
                {/* Visual Analytics Charts Panel */}
                <div className="bg-white dark:bg-card rounded-3xl p-6 border border-border/40 shadow-premium-sm grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Recharts Area Chart: Admissions Funnel Trend */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Admissions Conversion Funnel</h4>
                            <span className="text-[10px] font-bold text-muted-foreground">{formattedDate}</span>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={admissionsFunnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorFunnel" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.3)" />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }} labelClassName="font-bold text-xs" />
                                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorFunnel)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recharts Bar Chart: Fee Collections Ledger */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Revenue Collection Forecast</h4>
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Active collection session
                            </span>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueTrendData as any} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.3)" />
                                    <XAxis dataKey="month" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }} labelClassName="font-bold text-xs" />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    <Bar dataKey="collected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Collected (₹)" />
                                    <Bar dataKey="target" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Target (₹)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Dashboard layout lower grid: quick actions and category chart */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {/* Recharts Pie Chart: Students Division distribution */}
                    <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-3 border-b border-border/40">
                            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Class Distribution</h4>
                        </div>
                        <div className="h-44 flex items-center justify-center mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={classDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                                        {classDistributionData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-4">
                            {classDistributionData.map((d: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                                        <span className="font-semibold text-muted-foreground">{d.name}</span>
                                    </div>
                                    <span className="font-black text-gray-900 dark:text-white">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick actions panel */}
                    <div className="md:col-span-2 bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                                <ClipboardList className="text-primary w-4.5 h-4.5" />
                                Operations Toolkit
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {quickActions.map((action, i) => (
                                <Link
                                    key={i}
                                    to={action.link}
                                    className="flex items-center gap-4 p-4 rounded-2xl border border-border/40 bg-gray-50/20 dark:bg-muted/5 transition-all duration-200 group hover:bg-white dark:hover:bg-card hover:border-primary/20 hover:shadow-premium-md hover:scale-[1.01]"
                                >
                                    <div className="w-10 h-10 bg-white dark:bg-muted/15 rounded-xl flex items-center justify-center border border-border/40 shadow-premium-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-colors">
                                        <action.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-xs text-gray-900 dark:text-white truncate">{action.label}</div>
                                        <div className="text-[10px] text-muted-foreground font-semibold truncate mt-0.5">{action.desc}</div>
                                    </div>
                                    <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Phase 3.3 Enterprise Workspace Panels ───────────────────── */}
            {/* Sprint 3.3.7 — Operational Insights */}
            <RoleDashboardInsights />

            {/* Sprint 3.3.10 — Cross-Module Workspace */}
            <AdminCrossModulePanel />

            {/* Sprint 3.3.1 — Universal Work Queue */}
            <WorkQueue />

            {/* Sprint 3.3.2 — Quick Actions Engine */}
            <QuickActions />

            {/* Sprint 3.3.5 — Health Panel */}
            <HealthPanel />
        </PageWrapper>
    );
};
