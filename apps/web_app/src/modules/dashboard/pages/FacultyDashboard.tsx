import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/api-client';
import {
    Calendar,
    Users,
    BookOpen,
    Award,
    Clock,
    UserCheck,
    ArrowRight,
    LayoutDashboard,
    Bell,
    Settings,
    Search,
    Sparkles
} from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ActivityTimeline } from '../../../components/ActivityTimeline';
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
import { QuickActions } from '../components/actions/QuickActions';
import { RoleDashboardInsights } from '../components/analytics/RoleDashboardInsights';
import { HealthPanel } from '../components/health/HealthPanel';

export const FacultyDashboard = () => {
    return (
        <DashboardProvider>
            <FacultyDashboardInner />
        </DashboardProvider>
    );
};

const FacultyDashboardInner = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/dashboard/faculty/overview')
            .then(res => setStats(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const { kpis: engineKPIs } = useDashboard();

    const getKPIValue = (id: string, fallback: number) => {
        const item = engineKPIs.find(k => k.id === id);
        return item ? DashboardMapper.safeNumber(item.value) : fallback;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Faculty Workspace...</p>
        </div>
    );

    const kpis = [
        { label: 'Classes Today', value: getKPIValue('faculty.kpi.classes_today', stats?.classes_today || 0), icon: Clock, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
        { label: 'My Sections', value: getKPIValue('faculty.kpi.my_sections', stats?.sections_count || 0), icon: Users, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
        { label: 'Pending Works', value: getKPIValue('faculty.kpi.pending_works', stats?.pending_assignments || 0), icon: BookOpen, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
        { label: 'Avg Attendance', value: 98, icon: UserCheck, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', format: '%' },
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
                </div>
            </div>
        </div>
    ));

    const operations = [
        { label: 'My Students', icon: Users, link: '/app/academic/my-students', desc: 'Roster & profiles', color: 'bg-blue-500/10 text-blue-500' },
        { label: 'Enter Marks', icon: Award, link: '/app/faculty/exams/marks-entry', desc: 'Exam grading lists', color: 'bg-emerald-500/10 text-emerald-500' },
        { label: 'Class Work', icon: BookOpen, link: '/app/academic/assignments', desc: 'Assignment tracking', color: 'bg-violet-500/10 text-violet-500' },
    ];

    return (
        <PageWrapper
            title="Faculty Workspace"
            description="Welcome back! Manage classes, student performance sheets, and lesson schedules."
            icon={Sparkles}
            kpis={<>{kpiElements}</>}
            timeline={
                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/40 shadow-premium-sm">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-4">
                        <Bell className="w-4.5 h-4.5 text-primary" />
                        Campus Updates Feed
                    </h3>
                    <ActivityTimeline />
                </div>
            }
        >
            <div className="space-y-6 lg:space-y-8">
                {/* Action center */}
                <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider pb-4 border-b border-border/40">
                        Workspace Actions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {operations.map((action, i) => (
                            <Link
                                key={i}
                                to={action.link}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-border/40 bg-gray-50/20 dark:bg-muted/5 transition-all duration-200 group hover:bg-white dark:hover:bg-card hover:border-primary/20 hover:shadow-premium-md hover:scale-[1.01]"
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-border/40 shadow-premium-sm ${action.color} group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-colors`}>
                                    <action.icon className="w-5 h-5 transition-colors" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-xs text-gray-900 dark:text-white truncate">{action.label}</div>
                                    <div className="text-[10px] text-muted-foreground font-semibold truncate mt-0.5">{action.desc}</div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Today's Session list */}
                <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider pb-4 border-b border-border/40 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Today's Sessions Summary
                    </h3>
                    <div className="text-center py-10 border border-dashed border-border/60 rounded-2xl bg-gray-50/30 dark:bg-muted/5">
                        <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-xs font-bold text-muted-foreground italic">Contact your section coordinator for active class details.</p>
                    </div>
                </div>
            </div>

            {/* ─── Phase 3.3 Enterprise Workspace Panels ───────────────────── */}
            <RoleDashboardInsights />
            <WorkQueue />
            <QuickActions />
            <HealthPanel />
        </PageWrapper>
    );
};
