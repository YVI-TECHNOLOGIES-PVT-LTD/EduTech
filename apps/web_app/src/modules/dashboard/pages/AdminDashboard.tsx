import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  FileCheck,
  Calendar,
  Settings,
  Bell,
  CheckCircle,
  ClipboardList,
  TrendingUp,
  Coins,
  CreditCard,
  Database,
  UserCheck,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { LandingResolver } from '../../../services/LandingResolver';
import { useGetAdminOverviewQuery } from '@/shared/api/dashboard.api';
import { useMasterData } from '../../admission/context/MasterDataContext';
import { ActivityTimeline } from '../../../components/ActivityTimeline';
import { PageWrapper } from '../../../components/layout/PageWrapper';
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
  Legend,
} from 'recharts';

import { DashboardKpiCard } from '@/components/dashboard/DashboardKpiCard';
import { DashboardChartCard } from '@/components/dashboard/DashboardChartCard';
import { DashboardProvider } from '../core/DashboardProvider';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardMapper } from '../utils/dashboard.mapper';
// Phase 3.3 Enterprise Workspace imports
import { WorkQueue } from '../components/workqueue/WorkQueue';
import { QuickActions } from '../components/actions/QuickActions';
import { AdminCrossModulePanel } from '../components/widgets/CrossModulePanels';
import { RoleDashboardInsights } from '../components/analytics/RoleDashboardInsights';
import { HealthPanel } from '../components/health/HealthPanel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminDashboard = () => {
  return (
    <DashboardProvider>
      <AdminDashboardInner />
    </DashboardProvider>
  );
};

const AdminDashboardInner = () => {
  const navigate = useNavigate();
  const { user, hasPermission, isAuthenticated } = useAuth();
  const { activeSchool, activeAcademicYear } = useMasterData();
  const [currentTime, setCurrentTime] = useState(new Date());

  const canViewAdminDashboard =
    hasPermission('DASHBOARD_VIEW_ADMIN') || hasPermission('admin.dashboard.view');

  const {
    data: stats,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useGetAdminOverviewQuery(undefined, {
    skip: !isAuthenticated || !user || !canViewAdminDashboard,
    refetchOnMountOrArgChange: false,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { kpis, charts } = useDashboard();

  const overviewStatus = (overviewError as any)?.status;
  const isForbidden = !canViewAdminDashboard || overviewStatus === 403;

  const getKPIValue = (id: string, fallback: number) => {
    const item = kpis.find((k: any) => k.id === id);
    return item ? DashboardMapper.safeNumber(item.value) : fallback;
  };

  // Greeting Message based on local time
  const getGreeting = () => {
    const hr = currentTime.getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (isForbidden) {
    const fallbackRoute = LandingResolver.resolveLandingRoute(user?.roles || [], [], user);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-lg font-black text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            Your account does not have permission to view the Admin Dashboard overview.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => navigate(fallbackRoute, { replace: true })}
          className="rounded-xl font-bold text-xs"
        >
          Go to My Workspace
        </Button>
      </div>
    );
  }

  if (overviewError && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-lg font-black text-foreground">Unable to Load Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">
            {(overviewError as any)?.mapped?.message ||
              (overviewError as any)?.data?.message ||
              'Could not load institutional overview metrics. Please retry.'}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void refetchOverview()}
          className="inline-flex items-center gap-2 rounded-xl font-bold text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  const totalApps = stats?.totalApplications ?? 0;
  const funnelChart = charts.find((c: any) => c.id === 'admin.chart.funnel');
  const admissionsFunnelData = funnelChart?.data || [
    { name: 'Submitted', value: totalApps },
    { name: 'Pending Review', value: stats?.pendingAdmissions ?? 0 },
    { name: 'Enrolled', value: stats?.students ?? 0 },
  ];

  const revenueChart = charts.find((c: any) => c.id === 'admin.chart.revenue');
  const revenueTrendData = revenueChart?.data || [
    { month: 'Jan', collected: 120000, target: 150000 },
    { month: 'Feb', collected: 145000, target: 150000 },
    { month: 'Mar', collected: 180000, target: 160000 },
    { month: 'Apr', collected: 210000, target: 180000 },
    { month: 'May', collected: 230000, target: 200000 },
    { month: 'Jun', collected: 245000, target: 220000 },
  ];

  const classesChart = charts.find((c: any) => c.id === 'admin.chart.classes');
  const classColors = ['#3B82F6', '#8B5CF6', '#10B981'];
  const classDistributionData = classesChart?.data.map((d: any, i: number) => ({
    name: d.name,
    value: d.value,
    color: classColors[i % classColors.length],
  })) || [
    { name: 'Primary (Grade 1-5)', value: 240, color: '#3B82F6' },
    { name: 'Middle (Grade 6-8)', value: 160, color: '#8B5CF6' },
    { name: 'Secondary (Grade 9-10)', value: 100, color: '#10B981' },
  ];

  const quickActionsList = [
    {
      label: 'Review Admissions',
      icon: FileCheck,
      link: '/app/admissions/review',
      desc: `${stats?.pendingAdmissions || 0} applications pending review`,
    },
    {
      label: 'Admissions Desk',
      icon: GraduationCap,
      link: '/app/admissions/applications',
      desc: 'Applicant Workspace & Pipeline',
    },
    {
      label: 'Admission Fees',
      icon: Coins,
      link: '/app/front-office/fees',
      desc: 'Fee Billing & Collections',
    },
    {
      label: 'Bulk Operations',
      icon: Database,
      link: '/app/admin/bulk',
      desc: 'System Batch Operations',
    },
    {
      label: 'Import History',
      icon: Database,
      link: '/app/import/history',
      desc: 'Data Upload Logs & Audit',
    },
    {
      label: 'System Settings',
      icon: Settings,
      link: '/app/settings',
      desc: 'Global School Configuration',
    },
  ];

  const formattedFee = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(stats?.feeCollection ?? getKPIValue('admin.kpi.outstanding_fees', 0)));

  return (
    <PageWrapper
      title={`${getGreeting()}, ${user?.full_name || 'Administrator'}`}
      description={`Academic Year: ${activeAcademicYear?.year_label || 'Current Session'} | Campus: ${activeSchool?.name || 'Main Campus'} | Administrative Operations`}
      icon={Sparkles}
      actions={
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetchOverview()}
            disabled={overviewLoading}
            className="rounded-xl border-border/80 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${overviewLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/app/admissions/review')}
            className="rounded-xl font-bold text-xs gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            Admissions Desk
          </Button>
        </div>
      }
      kpis={
        <>
          <DashboardKpiCard
            title="Total Students"
            value={stats?.students ?? getKPIValue('admin.kpi.students', 0)}
            subtitle="Active student enrollment"
            icon={Users}
            variant="info"
            loading={overviewLoading}
          />
          <DashboardKpiCard
            title="Pending Admissions"
            value={stats?.pendingAdmissions ?? getKPIValue('admin.kpi.admissions', 0)}
            subtitle="Applications awaiting review"
            icon={ClipboardList}
            variant="warning"
            loading={overviewLoading}
            onClick={() => navigate('/app/admissions/review')}
          />
          <DashboardKpiCard
            title="Total Applications"
            value={stats?.totalApplications ?? getKPIValue('admin.kpi.exams', 0)}
            subtitle="Intake applications submitted"
            icon={BookOpen}
            variant="purple"
            loading={overviewLoading}
          />
          <DashboardKpiCard
            title="Fee Collection"
            value={formattedFee}
            subtitle="Total collections recorded"
            icon={Coins}
            variant="success"
            loading={overviewLoading}
          />
        </>
      }
      timeline={
        <div className="space-y-6">
          {/* Live timeline activities feed */}
          <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/80 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="text-primary w-4 h-4" />
                Live School Activities
              </h3>
            </div>
            <ActivityTimeline />
          </div>

          {/* System Vitality Panel */}
          <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle className="text-emerald-500 w-4 h-4" />
                System Health & Status
              </h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    API Gateway
                  </span>
                  <p className="text-xs font-bold text-foreground">Cluster Status: Healthy</p>
                </div>
                <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full">
                  Online
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    Database Connections
                  </span>
                  <p className="text-xs font-bold text-foreground">Primary Connection Pool</p>
                </div>
                <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-full">
                  Optimal
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/settings')}
                className="w-full rounded-xl text-xs font-semibold"
              >
                Manage System Parameters
              </Button>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Visual Analytics Charts Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admissions Conversion Funnel */}
          <DashboardChartCard
            title="Admissions Funnel"
            subtitle={`Pipeline volume as of ${formattedDate}`}
            icon={TrendingUp}
            loading={overviewLoading}
            minHeight={260}
          >
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={admissionsFunnelData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorFunnel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
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
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFunnel)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardChartCard>

          {/* Revenue Collection Trend */}
          <DashboardChartCard
            title="Revenue Collection Forecast"
            subtitle="Monthly collection vs target milestones"
            icon={Coins}
            loading={overviewLoading}
            minHeight={260}
          >
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueTrendData as any}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="month"
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
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar
                    dataKey="collected"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Collected"
                  />
                  <Bar dataKey="target" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardChartCard>
        </div>

        {/* Lower Grid: Class Distribution & Operations Toolkit */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class Distribution Donut */}
          <DashboardChartCard
            title="Class Distribution"
            subtitle="Students grouped by educational tier"
            icon={GraduationCap}
            loading={overviewLoading}
            minHeight={260}
          >
            <div className="flex flex-col items-center justify-between">
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {classDistributionData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '0.75rem',
                        color: 'hsl(var(--card-foreground))',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-1.5 pt-2 border-t border-border/60">
                {classDistributionData.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-muted-foreground font-medium">{d.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </DashboardChartCard>

          {/* Quick actions panel */}
          <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="text-primary w-4 h-4" />
                Administrative Operations Toolkit
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {quickActionsList.map((action, i) => (
                <Link
                  key={i}
                  to={action.link}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <action.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                      {action.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {action.desc}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Phase 3.3 Enterprise Workspace Panels ───────────────────── */}
      {/* Operational Insights */}
      <RoleDashboardInsights />

      {/* Cross-Module Workspace */}
      <AdminCrossModulePanel />

      {/* Universal Work Queue */}
      <WorkQueue />

      {/* Quick Actions Engine */}
      <QuickActions />

      {/* Health Panel */}
      <HealthPanel />
    </PageWrapper>
  );
};

export default AdminDashboard;
