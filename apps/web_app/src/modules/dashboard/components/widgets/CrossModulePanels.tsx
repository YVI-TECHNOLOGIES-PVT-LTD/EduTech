import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { 
    CreditCard, 
    BookOpen, 
    Users, 
    TrendingUp, 
    ArrowRight,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { LoadingSkeleton } from '../feedback/LoadingSkeleton';

interface CrossModuleTileProps {
    label: string;
    value: string | number;
    subtext: string;
    icon: React.ElementType;
    link: string;
    accentClass: string;
    alertCount?: number;
}

const CrossModuleTile = memo<CrossModuleTileProps>(({ 
    label, value, subtext, icon: Icon, link, accentClass, alertCount 
}) => (
    <Link
        to={link}
        className="group relative flex items-start gap-4 p-4 bg-white dark:bg-card border border-border/40 rounded-2xl hover:shadow-premium-md transition-all duration-300 hover:border-primary/30 hover:scale-[1.01]"
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${accentClass}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
                {alertCount != null && alertCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                        {alertCount}
                    </span>
                )}
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white leading-tight mt-0.5">{value}</p>
            <p className="text-[11px] text-muted-foreground font-semibold mt-1 truncate">{subtext}</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all self-center shrink-0" />
    </Link>
));

// ─── Admin Cross-Module Panel ────────────────────────────────────────────────

export const AdminCrossModulePanel = memo(() => {
    const { kpis, tasks, loading } = useDashboard();

    const getKPI = (idFragment: string, fallback: number | string) => {
        const found = kpis.find((k: any) => k.id?.includes(idFragment));
        return found?.value ?? fallback;
    };

    const pendingFinance = tasks.filter(t => t.entityType?.toLowerCase() === 'fee' && t.status === 'pending').length;
    const pendingAdmissions = tasks.filter(t => t.entityType?.toLowerCase() === 'admission' && t.status === 'pending').length;

    if (loading) return <LoadingSkeleton type="list" />;

    const tiles: CrossModuleTileProps[] = [
        {
            label: 'Active Students',
            value: getKPI('students', '—'),
            subtext: 'Enrolled this session',
            icon: Users,
            link: '/app/students',
            accentClass: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20',
        },
        {
            label: 'Pending Admissions',
            value: getKPI('admissions', pendingAdmissions),
            subtext: 'Applications awaiting review',
            icon: TrendingUp,
            link: '/app/admissions/review',
            accentClass: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/20',
            alertCount: pendingAdmissions,
        },
        {
            label: 'Fee Collections',
            value: getKPI('revenue', '—'),
            subtext: 'Outstanding dues this month',
            icon: CreditCard,
            link: '/app/fees/payments',
            accentClass: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20',
            alertCount: pendingFinance,
        },
        {
            label: 'Upcoming Exams',
            value: getKPI('exams', '—'),
            subtext: 'Scheduled this week',
            icon: BookOpen,
            link: '/app/exam-admin/manage',
            accentClass: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/10 dark:text-indigo-400 dark:border-indigo-900/20',
        },
        {
            label: 'Pending Tasks',
            value: tasks.filter(t => t.status === 'pending').length,
            subtext: `${tasks.filter(t => t.priority === 'urgent').length} urgent`,
            icon: AlertCircle,
            link: '/app/settings',
            accentClass: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-900/20',
            alertCount: tasks.filter(t => t.priority === 'urgent').length,
        },
    ];

    return (
        <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Cross-Module Overview
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                        Live data from all active ERP modules
                    </p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Live
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {tiles.map((tile, idx) => (
                    <CrossModuleTile key={idx} {...tile} />
                ))}
            </div>
        </div>
    );
});

// ─── Principal Cross-Module Panel ─────────────────────────────────────────────

export const PrincipalCrossModulePanel = memo(() => {
    const { kpis, tasks, loading } = useDashboard();

    const getKPI = (idFragment: string, fallback: number | string) => {
        const found = kpis.find((k: any) => k.id?.includes(idFragment));
        return found?.value ?? fallback;
    };

    if (loading) return <LoadingSkeleton type="list" />;

    const pendingApprovals = tasks.filter(t => t.status === 'pending' && t.priority !== 'low').length;

    const tiles: CrossModuleTileProps[] = [
        {
            label: 'Admissions Funnel',
            value: getKPI('admissions', '—'),
            subtext: 'Active applications in pipeline',
            icon: TrendingUp,
            link: '/app/admissions/review',
            accentClass: 'bg-blue-50 text-blue-600 border-blue-100',
            alertCount: pendingApprovals,
        },
        {
            label: 'Revenue Summary',
            value: getKPI('revenue', '—'),
            subtext: 'Collections this period',
            icon: CreditCard,
            link: '/app/fees/payments',
            accentClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        },
        {
            label: 'Exam Progress',
            value: getKPI('exams', '—'),
            subtext: 'Scheduled / Completed this month',
            icon: BookOpen,
            link: '/app/exam-admin/manage',
            accentClass: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        },
        {
            label: 'Pending Approvals',
            value: pendingApprovals,
            subtext: 'Merit & offer sign-offs',
            icon: AlertCircle,
            link: '/app/admissions/review',
            accentClass: 'bg-amber-50 text-amber-600 border-amber-100',
            alertCount: pendingApprovals,
        },
    ];

    return (
        <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm space-y-4">
            <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Institutional Overview
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                    Key indicators across all departments
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {tiles.map((tile, idx) => (
                    <CrossModuleTile key={idx} {...tile} />
                ))}
            </div>
        </div>
    );
});

// ─── Admissions Cross-Module Panel ────────────────────────────────────────────

export const AdmissionsCrossModulePanel = memo(() => {
    const { kpis, tasks, loading } = useDashboard();

    const getKPI = (idFragment: string, fallback: number | string) => {
        const found = kpis.find((k: any) => k.id?.includes(idFragment));
        return found?.value ?? fallback;
    };

    if (loading) return <LoadingSkeleton type="list" />;

    const pendingFees = tasks.filter(t => t.entityType?.toLowerCase() === 'fee' && t.status === 'pending').length;

    const tiles: CrossModuleTileProps[] = [
        {
            label: 'Fee Verifications Pending',
            value: pendingFees || getKPI('pending_fees', '—'),
            subtext: 'Awaiting finance confirmation',
            icon: CreditCard,
            link: '/app/fees/payments',
            accentClass: 'bg-amber-50 text-amber-600 border-amber-100',
            alertCount: pendingFees,
        },
        {
            label: 'Upcoming Exams',
            value: getKPI('exams', '—'),
            subtext: 'Entrance tests this week',
            icon: BookOpen,
            link: '/app/exam-admin/manage',
            accentClass: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        },
        {
            label: 'Students Provisioned',
            value: getKPI('students', '—'),
            subtext: 'Admitted this cycle',
            icon: Users,
            link: '/app/students',
            accentClass: 'bg-blue-50 text-blue-600 border-blue-100',
        },
    ];

    return (
        <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm space-y-4">
            <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Cross-Module Indicators
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                    Finance, Exams, and Student data linked to admissions pipeline
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tiles.map((tile, idx) => (
                    <CrossModuleTile key={idx} {...tile} />
                ))}
            </div>
        </div>
    );
});

export default AdminCrossModulePanel;
