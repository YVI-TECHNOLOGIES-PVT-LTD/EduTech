import React, { useMemo } from 'react';
import {
  Users,
  FileText,
  Clock,
  AlertTriangle,
  Bell,
  ClipboardList,
  TrendingUp,
  XCircle,
  CheckCircle2,
  FileCheck,
  Coins,
  Award,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { AdmissionAnalyticsService } from '../../../services/AdmissionAnalyticsService';
import { AdmissionNotificationService } from '../../../services/AdmissionNotificationService';
import {
  DashboardKpiCard,
  DashboardSection,
  DashboardChartCard,
  DashboardEmptyState,
} from '@/components/dashboard';

interface DashboardWorkspaceProps {
  applications: any[];
  stats?: any;
  onNavigate: (workspaceId: string) => void;
  isLoading?: boolean;
}

export function DashboardWorkspace({
  applications,
  onNavigate,
  isLoading = false,
}: DashboardWorkspaceProps) {
  const metrics = useMemo(() => {
    return AdmissionAnalyticsService.computeMetrics(applications);
  }, [applications]);

  const alerts = useMemo(() => {
    return AdmissionNotificationService.generateAlerts(applications);
  }, [applications]);

  const quickActions = [
    {
      label: 'Review Applications',
      target: 'APPLICATIONS',
      desc: 'Audit submitted forms',
      icon: FileCheck,
      color:
        'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/60',
    },
    {
      label: 'Document Queue',
      target: 'DOCUMENTS',
      desc: 'Verify certificates',
      icon: FileText,
      color:
        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/60',
    },
    {
      label: 'Finance Workspace',
      target: 'FINANCE',
      desc: 'Process fee deposits',
      icon: Coins,
      color:
        'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/60',
    },
    {
      label: 'Merit Compiler',
      target: 'MERIT',
      desc: 'Generate rank lists',
      icon: Award,
      color:
        'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/60',
    },
  ];

  const recentActivities = useMemo(() => {
    return applications.slice(0, 5).map((a) => ({
      time: a.updated_at
        ? new Date(a.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Just now',
      student: a.student_name || 'Candidate',
      action:
        a.status === 'enrolled'
          ? 'Provisioned to SIS'
          : `Moved to status ${String(a.status || '').replace(/_/g, ' ')}`,
      grade: a.grade_applied_for || 'Grade Applied',
    }));
  }, [applications]);

  return (
    <div className="space-y-6">
      {/* 1. KPIs Grid */}
      <DashboardSection
        title="Intake Pipeline Metrics"
        description="Live application counts and SLA compliance status."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <DashboardKpiCard
            title="Applications Received"
            value={metrics.totalReceived}
            subtitle="Total candidate forms filed"
            icon={FileText}
            variant="primary"
            loading={isLoading}
          />
          <DashboardKpiCard
            title="In Review Pipeline"
            value={metrics.inProgress}
            subtitle="Processing & verification"
            icon={Clock}
            variant="info"
            loading={isLoading}
          />
          <DashboardKpiCard
            title="Enrolled Students"
            value={metrics.enrolledCount}
            subtitle="Active admissions confirmed"
            icon={Users}
            variant="success"
            loading={isLoading}
          />
          <DashboardKpiCard
            title="Rejected Applications"
            value={metrics.rejectedCount}
            subtitle="Decisions issued"
            icon={XCircle}
            variant="neutral"
            loading={isLoading}
          />
          <DashboardKpiCard
            title="SLA Breaches"
            value={metrics.slaBreaches}
            subtitle="Resolution window overdue"
            icon={AlertTriangle}
            variant={metrics.slaBreaches > 0 ? 'danger' : 'neutral'}
            loading={isLoading}
          />
        </div>
      </DashboardSection>

      {/* 2. Analytical Chart & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardChartCard
            title="Admissions Funnel & Velocity"
            subtitle="Stage-by-stage progression from inquiry to finalized enrollment"
            icon={TrendingUp}
            loading={isLoading}
            isEmpty={!metrics.funnel || metrics.funnel.length === 0}
            minHeight={280}
          >
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={metrics.funnel}
                  margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      color: 'hsl(var(--card-foreground))',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardChartCard>
        </div>

        {/* Sidebar: Quick Actions & Live Feed */}
        <div className="space-y-6">
          <div className="bg-card p-5 sm:p-6 border border-border/80 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Workstation Direct Actions
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map((act, idx) => {
                const Icon = act.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onNavigate(act.target)}
                    className={`p-3 rounded-xl border text-left transition-all hover:shadow-xs flex flex-col justify-between ${act.color}`}
                  >
                    <Icon className="w-4 h-4 mb-1.5" />
                    <div>
                      <div className="text-xs font-bold leading-tight">{act.label}</div>
                      <div className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{act.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-card p-5 sm:p-6 border border-border/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-primary" /> Recent Pipeline Activity
              </h3>
            </div>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No recent activities logged.</p>
              ) : (
                recentActivities.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start text-xs border-b border-border/40 pb-2.5 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-foreground truncate">{act.student}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {act.action} ({act.grade})
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                      {act.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Operational Notification Center */}
      <div className="bg-card p-5 sm:p-6 border border-border/80 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" /> Operational Alert Center
          </h3>
          <span className="text-xs text-muted-foreground font-semibold">
            {alerts.length} Pending Actions
          </span>
        </div>
        {alerts.length === 0 ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground font-medium">
              All queues are healthy. No bottleneck alerts detected.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {alerts.map((note, idx) => (
              <div
                key={idx}
                className={`p-4 border rounded-xl flex flex-col justify-between ${
                  note.type === 'critical'
                    ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                    : note.type === 'warning'
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
                      : 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-900/60 text-indigo-800 dark:text-indigo-300'
                }`}
              >
                <p className="text-xs font-semibold leading-relaxed mb-3">{note.message}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate(note.target)}
                  className="w-full text-xs font-bold rounded-lg border-current bg-background/80 hover:bg-background text-foreground"
                >
                  {note.actionLabel}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardWorkspace;
