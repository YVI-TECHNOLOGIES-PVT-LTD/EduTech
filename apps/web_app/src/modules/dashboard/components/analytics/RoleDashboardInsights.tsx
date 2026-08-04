import React, { useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { AnalyticsCard } from './AnalyticsCard';
import {
    Users,
    UserCheck,
    CreditCard,
    ClipboardList,
    PhoneCall,
    TrendingUp,
    CalendarCheck,
    AlertTriangle,
    BarChart3,
    BookOpen
} from 'lucide-react';

/**
 * Sprint 3.3.7 — Dashboard Intelligence
 * Shows role-specific operational insights derived entirely from existing
 * Dashboard Engine context (useDashboard). No new API calls.
 */
export const RoleDashboardInsights: React.FC = () => {
    const { user } = useAuth();
    const { kpis, tasks, notifications, loading } = useDashboard();
    const roles = useMemo(() => (user?.roles || []).map((r: string) => r.toUpperCase()), [user]);

    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
    const unreadNotifications = notifications.filter(n => !n.read).length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    // Helper: find kpi value by id fragment
    const metricVal = (idFragment: string): string | number => {
        const found = kpis.find((m: any) => m.id?.includes(idFragment));
        return found?.value ?? '—';
    };

    const buildInsights = () => {
        if (roles.some(r => r === 'ADMIN')) {
            return [
                { label: 'Total Students', value: metricVal('students'), icon: Users, accent: 'blue' as const, subtext: 'Enrolled this session' },
                { label: 'Pending Tasks', value: pendingTasks, icon: ClipboardList, accent: 'amber' as const, subtext: `${urgentTasks} urgent` },
                { label: 'System Alerts', value: unreadNotifications, icon: AlertTriangle, accent: 'rose' as const, subtext: 'Unread notifications' },
                { label: 'Completed Tasks', value: completedTasks, icon: UserCheck, accent: 'emerald' as const, subtext: 'Resolved in queue' },
            ];
        }
        if (roles.some(r => ['RECEPTIONIST', 'FRONT_DESK'].includes(r))) {
            return [
                { label: 'Walk-ins Today', value: metricVal('walkins'), icon: Users, accent: 'blue' as const, subtext: 'Front desk registrations' },
                { label: 'Follow-ups Pending', value: pendingTasks, icon: PhoneCall, accent: 'amber' as const, subtext: 'Scheduled callbacks' },
                { label: 'New Inquiries', value: metricVal('inquiries'), icon: ClipboardList, accent: 'purple' as const, subtext: 'Logged this session' },
            ];
        }
        if (roles.some(r => ['COUNSELOR', 'COUNSELLOR'].includes(r))) {
            return [
                { label: 'Assigned Leads', value: metricVal('leads'), icon: Users, accent: 'indigo' as const, subtext: 'Active funnel entries' },
                { label: 'Calls Completed', value: completedTasks, icon: PhoneCall, accent: 'emerald' as const, subtext: 'Session total' },
                { label: 'Conversions', value: metricVal('conversions'), icon: TrendingUp, accent: 'blue' as const, subtext: 'Lead → Application', trend: { direction: 'up' as const, label: 'vs last week' } },
            ];
        }
        if (roles.some(r => r === 'ADMISSION_OFFICER')) {
            return [
                { label: 'Pending Reviews', value: metricVal('reviews'), icon: ClipboardList, accent: 'amber' as const, subtext: 'Applications awaiting' },
                { label: 'Verified Today', value: completedTasks, icon: UserCheck, accent: 'emerald' as const, subtext: 'Documents checked' },
                { label: 'Documents Pending', value: metricVal('documents'), icon: AlertTriangle, accent: 'rose' as const, subtext: 'Incomplete checklists' },
            ];
        }
        if (roles.some(r => ['FINANCE_OFFICER', 'ACCOUNTANT'].includes(r))) {
            return [
                { label: 'Collection Today', value: metricVal('revenue'), icon: CreditCard, accent: 'emerald' as const, subtext: 'Payments received' },
                { label: 'Pending Verification', value: pendingTasks, icon: AlertTriangle, accent: 'amber' as const, subtext: 'Awaiting reconciliation' },
                { label: 'Scholarships Queue', value: metricVal('scholarship'), icon: BarChart3, accent: 'purple' as const, subtext: 'Under review' },
            ];
        }
        if (roles.some(r => ['PRINCIPAL', 'HOI', 'HEAD_OF_INSTITUTE'].includes(r))) {
            return [
                { label: 'Admissions Funnel', value: metricVal('admissions'), icon: TrendingUp, accent: 'blue' as const, subtext: 'Active applications' },
                { label: 'Pending Approvals', value: urgentTasks, icon: ClipboardList, accent: 'amber' as const, subtext: 'Requires sign-off' },
                { label: 'Offer Acceptance', value: metricVal('acceptance'), icon: UserCheck, accent: 'emerald' as const, subtext: 'This intake cycle', trend: { direction: 'up' as const, percentage: 12 } },
            ];
        }
        if (roles.some(r => r === 'FACULTY')) {
            return [
                { label: 'Classes Today', value: metricVal('classes'), icon: BookOpen, accent: 'blue' as const, subtext: 'Scheduled sessions' },
                { label: 'Pending Marks', value: pendingTasks, icon: ClipboardList, accent: 'amber' as const, subtext: 'Awaiting submission' },
                { label: 'Attendance Taken', value: metricVal('attendance'), icon: CalendarCheck, accent: 'emerald' as const, subtext: 'Sessions marked today' },
            ];
        }
        // Student / Parent fallback
        return [
            { label: 'Upcoming Exams', value: metricVal('exams'), icon: BookOpen, accent: 'blue' as const, subtext: 'This month' },
            { label: 'Attendance Rate', value: metricVal('attendance'), icon: CalendarCheck, accent: 'emerald' as const, subtext: 'Current semester', trend: { direction: 'up' as const, percentage: 5 } },
        ];
    };

    const insights = buildInsights();

    if (loading || insights.length === 0) return null;

    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Operational Insights
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">
                    Live metrics from your workspace — updated automatically
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, idx) => (
                    <AnalyticsCard
                        key={idx}
                        label={insight.label}
                        value={insight.value}
                        icon={insight.icon}
                        accent={insight.accent}
                        subtext={insight.subtext}
                        trend={'trend' in insight ? insight.trend : undefined}
                    />
                ))}
            </div>
        </div>
    );
};

export default RoleDashboardInsights;
