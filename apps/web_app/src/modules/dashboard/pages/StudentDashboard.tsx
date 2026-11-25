import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../lib/api-client';
import {
  CalendarCheck,
  BookOpen,
  DollarSign,
  Library,
  ClipboardList,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Calendar,
  Activity,
  Sparkles,
  Bot,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageWrapper } from '../../../components/layout/PageWrapper';
import { DashboardKpiCard } from '@/components/dashboard/DashboardKpiCard';
import { DashboardChartCard } from '@/components/dashboard/DashboardChartCard';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardProvider } from '../core/DashboardProvider';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardMapper } from '../utils/dashboard.mapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export function StudentDashboard() {
  return (
    <DashboardProvider>
      <StudentDashboardInner />
    </DashboardProvider>
  );
}

function StudentDashboardInner() {
  const { user, isAuthenticated, boundaryState } = useAuth();

  const canViewOwnAdmissions = Boolean(
    user?.permissions?.includes('admission.view_own') ||
    user?.roles?.some((r: string) =>
      ['PARENT', 'GUARDIAN', 'APPLICANT'].includes(String(r).toUpperCase()),
    ),
  );

  const {
    data: admissions = [],
    isLoading: loadingAdmissions,
    refetch: refetchAdmissions,
  } = useQuery({
    queryKey: ['student', 'admissions', user?.id, user?.school_id],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/v1/admission/my', { silent: true } as any);
        const list = res.data?.data || res.data || [];
        return Array.isArray(list)
          ? list.filter((a: any) => {
              const status = (a.status ?? '').toLowerCase();
              return status !== 'enrolled' && status !== 'rejected';
            })
          : [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(
      isAuthenticated && boundaryState === 'stable' && user?.id && canViewOwnAdmissions,
    ),
    staleTime: 300_000,
  });

  const {
    kpis: engineKPIs,
    notifications: engineNotifications,
    loading: dashboardLoading,
  } = useDashboard();

  const announcements = useMemo(() => {
    const list = Array.isArray(engineNotifications) ? engineNotifications : [];
    if (list.length > 0) {
      return list.map((n: any) => ({
        id: n.id,
        title: n.title,
        body: n.message,
        time: n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : 'Recent',
        priority: n.type === 'error' ? 'high' : n.type === 'warning' ? 'medium' : 'low',
      }));
    }
    return [
      {
        id: '1',
        title: 'Academic Term Calendar Active',
        body: 'Check your weekly schedule and upcoming coursework in the portal.',
        time: 'Today',
        priority: 'medium',
      },
    ];
  }, [engineNotifications]);

  if (dashboardLoading) {
    return (
      <PageWrapper title="Student Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
            Loading Academic Portal...
          </p>
        </div>
      </PageWrapper>
    );
  }

  const safeKPIs = Array.isArray(engineKPIs) ? engineKPIs : [];
  const safeAdmissions = Array.isArray(admissions) ? admissions : [];

  const getKPIValue = (id: string, fallback: number) => {
    const item = safeKPIs.find((k: any) => k.id === id);
    return item ? DashboardMapper.safeNumber(item.value) : fallback;
  };

  const attendancePercent = getKPIValue('student.kpi.attendance', 88);
  const feeDue = getKPIValue('student.kpi.fees_due', 0);
  const upcomingExams = getKPIValue('student.kpi.exams', 0);
  const pendingAssignments = getKPIValue('student.kpi.tasks', 0);

  const formattedFee = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(feeDue);

  const quickActions = [
    {
      icon: CalendarCheck,
      label: 'Digital Classroom',
      href: '/app/student/classroom',
      desc: 'Live streams, materials & chat',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Bot,
      label: 'AI Study Assistant',
      href: '/app/student/ai-study-assistant',
      desc: 'Interactive tutor & concept explainer',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: BookOpen,
      label: 'Learning Activities',
      href: '/app/student/learning-activities',
      desc: 'Worksheets, quizzes & tasks',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      icon: DollarSign,
      label: 'My Fee Invoices',
      href: '/app/fees/my',
      desc: 'Tuition receipts & dues',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      icon: Bell,
      label: 'School Bulletins',
      href: '/app/communication/feeds',
      desc: 'Campus announcements & alerts',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      icon: Library,
      label: 'Digital Resources',
      href: '/app/academic/resources',
      desc: 'E-books & syllabus files',
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <PageWrapper
      title={`Hello, ${user?.full_name?.split(' ')[0] || 'Student'}!`}
      description="Student Academic Portal: Track your attendance, homework tasks, classroom activities, and study schedule."
      icon={Sparkles}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAdmissions()}
            disabled={dashboardLoading || loadingAdmissions}
            className="rounded-xl border-border/80 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${dashboardLoading || loadingAdmissions ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Link
            to="/app/student/ai-study-assistant"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 shadow-sm transition-opacity"
          >
            <Bot className="w-3.5 h-3.5" />
            AI Study Assistant
          </Link>
        </div>
      }
      kpis={
        <>
          <DashboardKpiCard
            title="Attendance"
            value={`${attendancePercent}%`}
            subtitle={attendancePercent >= 75 ? 'Meets 75% requirement' : 'Below 75% threshold'}
            icon={Activity}
            variant={attendancePercent >= 75 ? 'success' : 'danger'}
            loading={dashboardLoading}
          />
          <DashboardKpiCard
            title="Outstanding Dues"
            value={formattedFee}
            subtitle={feeDue > 0 ? 'Payment pending' : 'All dues cleared'}
            icon={DollarSign}
            variant={feeDue > 0 ? 'warning' : 'neutral'}
            loading={dashboardLoading}
          />
          <DashboardKpiCard
            title="Pending Assignments"
            value={pendingAssignments}
            subtitle="Active homework & tasks"
            icon={ClipboardList}
            variant="info"
            loading={dashboardLoading}
          />
          <DashboardKpiCard
            title="Upcoming Exams"
            value={upcomingExams}
            subtitle="Scheduled assessments"
            icon={GraduationCap}
            variant="purple"
            loading={dashboardLoading}
          />
        </>
      }
      timeline={
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notice Bulletin
            </h3>
          </div>
          <div className="space-y-3">
            {announcements.map((ann: any) => (
              <div
                key={ann.id}
                className={`p-3.5 rounded-xl border-l-2 bg-muted/20 border-border/60 ${
                  ann.priority === 'high'
                    ? 'border-l-rose-500'
                    : ann.priority === 'medium'
                      ? 'border-l-amber-500'
                      : 'border-l-primary'
                }`}
              >
                <p className="text-xs font-bold text-foreground">{ann.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{ann.body}</p>
                <p className="text-[10px] text-muted-foreground/60 font-semibold mt-2">
                  {ann.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Active Admission Applications Timelines if applicable */}
        {safeAdmissions.length > 0 && (
          <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Admission Application Tracker
            </h3>
            {safeAdmissions.map((app: any) => {
              const steps = [
                { key: 'draft', label: 'Draft' },
                { key: 'submitted', label: 'Submitted' },
                { key: 'under_review', label: 'Review' },
                { key: 'docs_verified', label: 'Docs Verified' },
                { key: 'payment_pending', label: 'Fee Pending' },
                { key: 'approved', label: 'Approved' },
                { key: 'enrolled', label: 'Enrolled' },
              ];
              const currentIdx = steps.findIndex((s) => s.key === app.status);
              return (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <div>
                      <span className="text-[11px] font-bold text-foreground">
                        Applicant: {app.student_name}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Grade Applied: {app.grade_applied_for}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      {app.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center gap-2 pt-1 overflow-x-auto">
                    {steps.map((step, idx) => {
                      const isCompleted = idx < currentIdx;
                      const isActive = idx === currentIdx;
                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center text-center flex-1 min-w-[60px]"
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isActive
                                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-[9px] font-semibold mt-1.5 ${
                              isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Operation Shortcuts */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground">Student Portal Workspaces</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Direct access to interactive learning, study assistance, and academic resources
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                to={action.href}
                className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border/40 ${action.color} group-hover:scale-105 transition-transform`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                    {action.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {action.desc}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Attendance Eligibility Status Card */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {attendancePercent < 75 ? (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
              <h3 className="text-sm font-bold text-foreground">
                Attendance Compliance & Eligibility
              </h3>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                attendancePercent < 75
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200'
              }`}
            >
              {attendancePercent >= 75 ? 'Compliant' : 'Attention Required'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{attendancePercent}%</span>
            <span className="text-xs text-muted-foreground">Cumulative present rate</span>
          </div>
          <Progress
            value={attendancePercent}
            className={`h-2.5 rounded-full ${
              attendancePercent < 75 ? '[&>div]:bg-rose-500' : '[&>div]:bg-emerald-500'
            }`}
          />
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            {attendancePercent < 75
              ? 'Warning: Your attendance is currently below the mandatory 75% institutional requirement.'
              : 'Great job! Your attendance is in good standing and meets all examination eligibility requirements.'}
          </p>
        </div>

        {/* Learning Focus & Quick Hub */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Academic Focus & Quick Access</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Stay updated with your daily timetable, live hybrid lectures, and coursework
              </p>
            </div>
            <Link
              to="/app/student/classroom"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Open Classroom <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <CalendarCheck className="w-4 h-4 text-emerald-500" />
                <span>Hybrid Digital Classroom</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Connect to live sessions, watch recorded lectures, and download flipped learning
                materials.
              </p>
              <Link
                to="/app/student/classroom"
                className="inline-flex items-center text-xs font-semibold text-primary hover:underline pt-1"
              >
                Join Classes &rarr;
              </Link>
            </div>
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <Bot className="w-4 h-4 text-indigo-500" />
                <span>AI Study Coach</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Get step-by-step concept explanations, practice questions, and exam revision guides.
              </p>
              <Link
                to="/app/student/ai-study-assistant"
                className="inline-flex items-center text-xs font-semibold text-primary hover:underline pt-1"
              >
                Ask Assistant &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default StudentDashboard;
