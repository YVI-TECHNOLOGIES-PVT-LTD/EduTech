import React, { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  ShieldAlert,
  Building2,
  Calendar,
  Layers,
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  Sparkles,
  FolderCheck,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Sliders,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  DashboardPageHeader,
  DashboardKpiCard,
  DashboardSection,
  DashboardChartCard,
  DashboardErrorState,
  DashboardQuickActions,
  QuickActionItem,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface SuperAdminOverview {
  academic_years_count: number;
  active_academic_year: {
    academic_year_id: string;
    academic_year_name: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
  grades_count: number;
  sections_count: number;
  faculty_assignments_count: number;
  curriculum_plans_count: number;
  lesson_plans_count: number;
  timetable_entries_count: number;
  learning_resources_count: number;
  published_timetable_versions_count: number;
}

export const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<SuperAdminOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/v1/academic/superadmin/overview');
      setData(res.data?.data || res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load enterprise academic overview',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Curricula', count: data.curriculum_plans_count || 0, color: '#6366f1' },
      { name: 'Lesson Plans', count: data.lesson_plans_count || 0, color: '#ec4899' },
      { name: 'Timetable Slots', count: data.timetable_entries_count || 0, color: '#06b6d4' },
      { name: 'Digital Assets', count: data.learning_resources_count || 0, color: '#10b981' },
      { name: 'Faculty Maps', count: data.faculty_assignments_count || 0, color: '#f59e0b' },
    ];
  }, [data]);

  const quickActions: QuickActionItem[] = [
    {
      title: 'Academic Readiness Engine',
      description: 'Audit configuration completeness across 12 institutional academic domains.',
      icon: CheckCircle2,
      to: '/app/academic/readiness',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Academic Structure & Hierarchy',
      description: 'Manage institutional sessions, grade tiers, subjects, and classroom divisions.',
      icon: Calendar,
      to: '/app/academic/structure',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'School Administrative Portal',
      description: 'Access daily operational administration, staff directories, and student desks.',
      icon: ShieldAlert,
      to: '/app/admin/dashboard',
      iconBg: 'bg-purple-50 dark:bg-purple-950/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Admissions Operations Desk',
      description: 'Executive front-office inquiries, student intake pipelines, and verification.',
      icon: UserCheck,
      to: '/app/front-office/dashboard',
      iconBg: 'bg-sky-50 dark:bg-sky-950/50',
      iconColor: 'text-sky-600 dark:text-sky-400',
    },
    {
      title: 'Financial Governance & Fees',
      description: 'Fee collection registries, receivables audit, reconciliation, and demands.',
      icon: DollarSign,
      to: '/app/finance/dashboard',
      iconBg: 'bg-amber-50 dark:bg-amber-950/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Bulk Data Operations',
      description: 'Batch importing, verification audits, and historical log inspection.',
      icon: Sliders,
      to: '/app/admin/bulk',
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconColor: 'text-slate-700 dark:text-slate-300',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <DashboardPageHeader
        title="Super Administrator Dashboard"
        description="Cross-organizational oversight, academic lifecycle health, tenant governance, and high-level institutional telemetry."
        badge={{
          text: 'Enterprise Governance',
          variant: 'purple',
          icon: Building2,
        }}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={loading}
            className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        }
      />

      {/* Error Banner */}
      {error && <DashboardErrorState message={error} onRetry={fetchOverview} />}

      {/* 2. Active Session Overview Banner */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Current Active Session
              </div>
              <div className="text-lg sm:text-xl font-black text-foreground">
                {loading ? (
                  <Skeleton className="h-6 w-48 mt-1" />
                ) : data?.active_academic_year ? (
                  data.active_academic_year.academic_year_name
                ) : (
                  'No Active Academic Session'
                )}
              </div>
              {data?.active_academic_year && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Term Period:{' '}
                  <span className="font-semibold text-foreground">
                    {new Date(data.active_academic_year.start_date).toLocaleDateString()}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-foreground">
                    {new Date(data.active_academic_year.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          {data?.active_academic_year && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                {data.active_academic_year.status}
              </span>
              <Link
                to="/app/academic/structure"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 ml-2"
              >
                Structure <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 3. Primary KPI Metric Cards */}
      <DashboardSection
        title="Institutional Core Metrics"
        description="High-level operational stats aggregated across current organizational records."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            title="Academic Years"
            value={data?.academic_years_count ?? 0}
            subtitle="Configured institutional sessions"
            icon={Calendar}
            variant="primary"
            loading={loading}
          />
          <DashboardKpiCard
            title="Offered Grades"
            value={data?.grades_count ?? 0}
            subtitle="Configured academic levels"
            icon={GraduationCap}
            variant="info"
            loading={loading}
          />
          <DashboardKpiCard
            title="Active Sections"
            value={data?.sections_count ?? 0}
            subtitle="Classroom section divisions"
            icon={Layers}
            variant="success"
            loading={loading}
          />
          <DashboardKpiCard
            title="Faculty Assignments"
            value={data?.faculty_assignments_count ?? 0}
            subtitle="Teacher-to-subject mappings"
            icon={Users}
            variant="warning"
            loading={loading}
          />
          <DashboardKpiCard
            title="Curriculum Frameworks"
            value={data?.curriculum_plans_count ?? 0}
            subtitle="Active subject curricula"
            icon={BookOpen}
            variant="purple"
            loading={loading}
          />
          <DashboardKpiCard
            title="Structured Lesson Plans"
            value={data?.lesson_plans_count ?? 0}
            subtitle="AI & instructor unit plans"
            icon={Sparkles}
            variant="danger"
            loading={loading}
          />
          <DashboardKpiCard
            title="Timetable Slots"
            value={data?.timetable_entries_count ?? 0}
            subtitle={`${data?.published_timetable_versions_count ?? 0} published timetables`}
            icon={Clock}
            variant="info"
            loading={loading}
          />
          <DashboardKpiCard
            title="Digital Learning Assets"
            value={data?.learning_resources_count ?? 0}
            subtitle="Cataloged learning materials"
            icon={FolderCheck}
            variant="success"
            loading={loading}
          />
        </div>
      </DashboardSection>

      {/* 4. Analytics & Operational Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardChartCard
            title="Academic Resource Allocation"
            subtitle="Volume comparison of academic plans, timetable slots, and learning assets"
            icon={BarChart3}
            loading={loading}
            isEmpty={!chartData.length || chartData.every((d) => d.count === 0)}
            minHeight={260}
          >
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      color: 'hsl(var(--card-foreground))',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardChartCard>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-foreground">Governance Health</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Academic structures and curriculum components are actively validated through the
              Academic Readiness framework.
            </p>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active Academic Term</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {data?.active_academic_year ? 'Operational' : 'Needs Config'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Published Timetables</span>
                <span className="font-semibold text-foreground">
                  {data?.published_timetable_versions_count ?? 0} Active
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Faculty Allocation</span>
                <span className="font-semibold text-foreground">
                  {data?.faculty_assignments_count ?? 0} Assigned
                </span>
              </div>
            </div>
            <Link
              to="/app/academic/readiness"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-colors mt-2"
            >
              Run Readiness Audit <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Strategic Quick Actions */}
      <DashboardSection
        title="Strategic Administrative Portals"
        description="Direct navigation to cross-departmental operations and governance workspaces."
      >
        <DashboardQuickActions actions={quickActions} columns={3} />
      </DashboardSection>
    </div>
  );
};

export default SuperAdminDashboard;
