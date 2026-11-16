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
  Sparkles,
  RefreshCw,
  FolderCheck,
} from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper';
import { ActivityTimeline } from '../../../components/ActivityTimeline';
import { DashboardKpiCard } from '@/components/dashboard/DashboardKpiCard';
import { DashboardProvider } from '../core/DashboardProvider';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardMapper } from '../utils/dashboard.mapper';
import { useAuth } from '../../../context/AuthContext';
import { getCurrentSessionGeneration } from '../../../lib/auth/sessionReset';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFacultyStats = () => {
    if (!isAuthenticated || !user) {
      setStats(null);
      setLoading(false);
      return;
    }

    const requestGen = getCurrentSessionGeneration();
    setLoading(true);

    apiClient
      .get('/dashboard/faculty/overview')
      .then((res) => {
        if (requestGen === getCurrentSessionGeneration()) setStats(res.data);
      })
      .catch((err) => {
        if (requestGen === getCurrentSessionGeneration()) console.error(err);
      })
      .finally(() => {
        if (requestGen === getCurrentSessionGeneration()) setLoading(false);
      });
  };

  useEffect(() => {
    fetchFacultyStats();
  }, [user?.id, user?.school_id, isAuthenticated]);

  const { kpis: engineKPIs } = useDashboard();

  const getKPIValue = (id: string, fallback: number) => {
    const item = engineKPIs.find((k: any) => k.id === id);
    return item ? DashboardMapper.safeNumber(item.value) : fallback;
  };

  const operations = [
    {
      label: 'My Students & Classroom',
      icon: Users,
      link: '/app/teacher/classroom',
      desc: 'Active roster, attendance & student profiles',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Teacher Lesson Plans',
      icon: Sparkles,
      link: '/app/teacher/lesson-plans',
      desc: 'AI unit planner & curriculum objectives',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Weekly Timetable',
      icon: Clock,
      link: '/app/teacher/timetable',
      desc: 'Class schedule & room allocations',
      color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <PageWrapper
      title={`Welcome back, ${user?.full_name || 'Faculty Member'}`}
      description="Instructional workspace: daily classes, section allocations, student performance, and curriculum preparation."
      icon={Sparkles}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={fetchFacultyStats}
          disabled={loading}
          className="rounded-xl border-border/80 gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
      kpis={
        <>
          <DashboardKpiCard
            title="Classes Today"
            value={getKPIValue('faculty.kpi.classes_today', stats?.classes_today || 0)}
            subtitle="Scheduled periods today"
            icon={Clock}
            variant="info"
            loading={loading}
          />
          <DashboardKpiCard
            title="My Sections"
            value={getKPIValue('faculty.kpi.my_sections', stats?.sections_count || 0)}
            subtitle="Assigned classroom divisions"
            icon={Users}
            variant="success"
            loading={loading}
          />
          <DashboardKpiCard
            title="Pending Works"
            value={getKPIValue('faculty.kpi.pending_works', stats?.pending_assignments || 0)}
            subtitle="Assignments to evaluate"
            icon={BookOpen}
            variant="warning"
            loading={loading}
          />
          <DashboardKpiCard
            title="Total Subjects"
            value={stats?.subjects_count ?? 1}
            subtitle="Instructional subjects mapped"
            icon={Award}
            variant="purple"
            loading={loading}
          />
        </>
      }
      timeline={
        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Campus Updates Feed
            </h3>
          </div>
          <ActivityTimeline />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Action center */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground">Teaching Operations Shortcuts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Direct links to daily classroom activities and lesson management
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {operations.map((action, i) => (
              <Link
                key={i}
                to={action.link}
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

        {/* ─── Phase 3.3 Enterprise Workspace Panels ───────────────────── */}
        <RoleDashboardInsights />
        <WorkQueue />
        <QuickActions />
        <HealthPanel />
      </div>
    </PageWrapper>
  );
};

export default FacultyDashboard;
