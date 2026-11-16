import React, { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  Users,
  BookOpen,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  FolderCheck,
  BarChart3,
  Bot,
  GraduationCap,
  MapPin,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
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
  DashboardEmptyState,
  DashboardErrorState,
  DashboardQuickActions,
  QuickActionItem,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TodayScheduleEntry {
  entry_id: string;
  weekday: number;
  period_name: string;
  start_time: string;
  end_time: string;
  section_name: string;
  grade_name: string;
  subject_name: string;
  subject_code: string;
  classroom: string | null;
  lesson_type: string;
  topic: string | null;
}

interface TeacherDashboardData {
  teacher_staff_id: string;
  current_weekday: number;
  assigned_sections_count: number;
  assigned_subjects_count: number;
  total_weekly_periods: number;
  today_periods_count: number;
  authored_lesson_plans_count: number;
  today_schedule: TodayScheduleEntry[];
  sections_summary: Array<{
    section_id: string;
    section_name: string;
    grade_name: string;
    assignment_role: string;
    subjects: Array<{ subject_name: string }>;
  }>;
  workload_summary: {
    total_weekly_periods: number;
    daily_average_periods: number;
    weekday_distribution: Record<number, number>;
  };
}

const WEEKDAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TeacherDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get('staff_id');
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/v1/academic/teacher/dashboard', {
        params: staffId ? { staff_id: staffId } : undefined,
      });
      setData(res.data?.data || res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Failed to load teacher workspace data',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const weekdayName = data?.current_weekday ? WEEKDAYS[data.current_weekday] : 'Today';

  // Workload distribution chart data
  const workloadChartData = useMemo(() => {
    if (!data?.workload_summary?.weekday_distribution) return [];
    const dist = data.workload_summary.weekday_distribution;
    const days = [
      { name: 'Mon', dayNum: 1 },
      { name: 'Tue', dayNum: 2 },
      { name: 'Wed', dayNum: 3 },
      { name: 'Thu', dayNum: 4 },
      { name: 'Fri', dayNum: 5 },
    ];
    return days.map((d) => ({
      name: d.name,
      periods: dist[d.dayNum] ?? 0,
      isToday: data.current_weekday === d.dayNum,
    }));
  }, [data]);

  const quickActions: QuickActionItem[] = [
    {
      title: 'AI Teacher Copilot',
      description: 'Generate instructional content, quiz questions, and automated rubrics.',
      icon: Bot,
      to: '/app/teacher/ai-copilot',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Lesson Planning Studio',
      description: 'Structured unit plans, curriculum goals, and lesson progress.',
      icon: Sparkles,
      to: '/app/teacher/lesson-plans',
      iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/50',
      iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    },
    {
      title: 'Classroom Management',
      description: 'Mark attendance, check student roster, and record class notes.',
      icon: GraduationCap,
      to: '/app/teacher/classroom',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Timetable & Class Schedule',
      description: 'View full weekly matrix, room assignments, and period slots.',
      icon: Clock,
      to: '/app/teacher/timetable',
      iconBg: 'bg-sky-50 dark:bg-sky-950/50',
      iconColor: 'text-sky-600 dark:text-sky-400',
    },
    {
      title: 'Teaching Workload Analysis',
      description: 'Audit instructional hours and period allocation per weekday.',
      icon: BarChart3,
      to: '/app/teacher/workload',
      iconBg: 'bg-amber-50 dark:bg-amber-950/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Digital Resource Library',
      description: 'Uploaded subject materials, presentations, and study assets.',
      icon: FolderCheck,
      to: '/app/academic/resources',
      iconBg: 'bg-purple-50 dark:bg-purple-950/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <DashboardPageHeader
        title="Teacher Dashboard"
        description="Daily teaching timetable, assigned classrooms, curriculum lesson preparation, and AI teaching tools."
        badge={{
          text: `Schedule: ${weekdayName}`,
          variant: 'info',
          icon: Clock,
        }}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboard}
            disabled={loading}
            className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Schedule
          </Button>
        }
      />

      {error && <DashboardErrorState message={error} onRetry={fetchDashboard} />}

      {/* 2. KPI Cards */}
      <DashboardSection
        title="Instructional Metrics"
        description="Daily period schedule, active classroom sections, and prepared lesson plans."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            title="Today's Periods"
            value={data?.today_periods_count ?? 0}
            subtitle={`${weekdayName}'s scheduled classes`}
            icon={Clock}
            variant="info"
            loading={loading}
          />
          <DashboardKpiCard
            title="Assigned Sections"
            value={data?.assigned_sections_count ?? 0}
            subtitle="Classroom section divisions"
            icon={Layers}
            variant="primary"
            loading={loading}
          />
          <DashboardKpiCard
            title="Assigned Subjects"
            value={data?.assigned_subjects_count ?? 0}
            subtitle="Curriculum subjects taught"
            icon={BookOpen}
            variant="purple"
            loading={loading}
          />
          <DashboardKpiCard
            title="Lesson Plans"
            value={data?.authored_lesson_plans_count ?? 0}
            subtitle="Prepared & AI structured plans"
            icon={Sparkles}
            variant="success"
            loading={loading}
          />
        </div>
      </DashboardSection>

      {/* 3. Schedule & My Classes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Column */}
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Today's Class Schedule ({weekdayName})
              </h3>
            </div>
            <Link
              to="/app/teacher/timetable"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Full Timetable <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-border/40 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          ) : !data?.today_schedule || data.today_schedule.length === 0 ? (
            <DashboardEmptyState
              icon={Calendar}
              title="No Teaching Periods Today"
              message={`No classroom periods scheduled for ${weekdayName}. You can utilize this time for lesson prep and curriculum planning.`}
              action={{
                label: 'View Weekly Timetable',
                onClick: () => (window.location.href = '/app/teacher/timetable'),
              }}
              compact
            />
          ) : (
            <div className="space-y-3">
              {data.today_schedule.map((entry) => (
                <div
                  key={entry.entry_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/20 border border-border/60 rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all duration-200"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-16 text-center shrink-0 bg-background/80 p-2 rounded-lg border border-border/40">
                      <div className="text-xs font-bold text-foreground">{entry.period_name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {entry.start_time ? entry.start_time.substring(0, 5) : ''}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-foreground text-sm truncate">
                        {entry.subject_name}
                        {entry.subject_code && (
                          <span className="text-xs font-normal text-muted-foreground ml-1.5">
                            ({entry.subject_code})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>
                          {entry.grade_name} • Section {entry.section_name}
                        </span>
                        {entry.classroom && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                            <MapPin className="w-3 h-3 text-primary" />
                            Room {entry.classroom}
                          </span>
                        )}
                      </div>
                      {entry.topic && (
                        <div className="text-xs text-primary font-medium mt-1">
                          Topic: {entry.topic}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="self-start sm:self-center px-2.5 py-1 bg-background border border-border/80 text-foreground text-[10px] rounded-lg font-bold uppercase tracking-wider shrink-0">
                    {entry.lesson_type || 'LECTURE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Assigned Classes & Weekly Workload */}
        <div className="space-y-6">
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">My Assigned Classes</h3>
              </div>
              <Link
                to="/app/teacher/classes"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : !data?.sections_summary || data.sections_summary.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No classes assigned yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.sections_summary.map((sec) => (
                  <div
                    key={sec.section_id}
                    className="p-3 bg-muted/20 border border-border/60 rounded-xl flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-foreground text-xs">
                        {sec.grade_name} - {sec.section_name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {sec.subjects?.map((s) => s.subject_name).join(', ') || 'No subject'}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold shrink-0 uppercase">
                      {sec.assignment_role.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Workload Distribution Mini-Chart */}
          {workloadChartData.length > 0 && (
            <DashboardChartCard
              title="Weekly Workload"
              subtitle={`Total: ${data?.workload_summary?.total_weekly_periods ?? 0} periods / week`}
              icon={BarChart3}
              loading={loading}
              minHeight={180}
            >
              <div className="h-36 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workloadChartData}
                    margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'currentColor' }}
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
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="periods" radius={[4, 4, 0, 0]}>
                      {workloadChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isToday ? 'hsl(var(--primary))' : '#94a3b8'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DashboardChartCard>
          )}
        </div>
      </div>

      {/* 4. Strategic Teaching Actions */}
      <DashboardSection
        title="Teaching & Classroom Toolkit"
        description="Quick access to AI lesson authoring, timetable matrices, and student activity logs."
      >
        <DashboardQuickActions actions={quickActions} columns={3} />
      </DashboardSection>
    </div>
  );
};

export default TeacherDashboard;
