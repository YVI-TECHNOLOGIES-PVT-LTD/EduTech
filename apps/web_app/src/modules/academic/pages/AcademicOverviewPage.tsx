import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  BookOpen,
  UserCheck,
  Clock,
  FileText,
  Sparkles,
  FolderCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AcademicManagementService,
  AcademicOverviewMetrics,
  AcademicDashboardMetrics,
  CurriculumOverview,
  TimetableOverview,
  ReadinessTenantYearItem,
  extractAcademicApiError,
} from '../services/academic.service';
import { formatShortDate, getAcademicStatusBadgeClass } from '../components/AcademicPageHeader';
import {
  DashboardPageHeader,
  DashboardKpiCard,
  DashboardSection,
  DashboardErrorState,
} from '@/components/dashboard';

export const AcademicOverviewPage: React.FC = () => {
  const [overview, setOverview] = useState<AcademicOverviewMetrics | null>(null);
  const [metrics, setMetrics] = useState<AcademicDashboardMetrics | null>(null);
  const [curriculumOverview, setCurriculumOverview] = useState<CurriculumOverview | null>(null);
  const [timetableOverview, setTimetableOverview] = useState<TimetableOverview | null>(null);
  const [readinessYears, setReadinessYears] = useState<ReadinessTenantYearItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        AcademicManagementService.getOverview(),
        AcademicManagementService.getDashboardMetrics(),
        AcademicManagementService.getCurriculumOverview(),
        AcademicManagementService.getTimetableOverview(),
        AcademicManagementService.getReadinessOverview(),
      ]);

      if (results[0].status === 'fulfilled') setOverview(results[0].value);
      if (results[1].status === 'fulfilled') setMetrics(results[1].value);
      if (results[2].status === 'fulfilled') setCurriculumOverview(results[2].value);
      if (results[3].status === 'fulfilled') setTimetableOverview(results[3].value);
      if (results[4].status === 'fulfilled') setReadinessYears(results[4].value);

      const firstFailure = results.find((r) => r.status === 'rejected') as
        PromiseRejectedResult | undefined;
      if (firstFailure && results.every((r) => r.status === 'rejected')) {
        setError(extractAcademicApiError(firstFailure.reason, 'Failed to load academic overview'));
      }
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load academic overview'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentYear = overview?.academic_years?.current;
  const readinessChecks = [
    {
      label: 'Academic Year Configured',
      done: Boolean(overview?.readiness?.academic_year_configured),
      href: '/app/academic/structure',
      cta: 'Manage Years',
    },
    {
      label: 'Grades Master Catalog',
      done: Boolean(overview?.readiness?.grades_configured),
      href: '/app/academic/classes',
      cta: 'Configure Grades',
    },
    {
      label: 'Year Grade Offerings Mapped',
      done: Boolean(overview?.readiness?.grade_offerings_configured),
      href: '/app/academic/classes',
      cta: 'Map Offerings',
    },
    {
      label: 'Sections Allocated',
      done: Boolean(overview?.readiness?.sections_configured),
      href: '/app/academic/classes',
      cta: 'Manage Sections',
    },
    {
      label: 'Class Teachers Assigned',
      done: Boolean(overview?.readiness?.class_teachers_assigned),
      href: '/app/academic/classes',
      cta: 'Assign Teachers',
    },
  ];

  const moduleShortcuts = [
    {
      title: 'Years & Structure',
      href: '/app/academic/structure',
      icon: Calendar,
      desc: 'Academic sessions, boards & hierarchy',
    },
    {
      title: 'Grades & Sections',
      href: '/app/academic/classes',
      icon: Layers,
      desc: 'Master grades, offerings & sections',
    },
    {
      title: 'Subjects & Catalog',
      href: '/app/academic/subjects',
      icon: BookOpen,
      desc: 'Subject catalog & syllabus units',
    },
    {
      title: 'Faculty Workload',
      href: '/app/academic/faculty',
      icon: UserCheck,
      desc: 'Period allocation & workload balance',
    },
    {
      title: 'Timetable Master',
      href: '/app/academic/timetable',
      icon: Clock,
      desc: 'Versions, room allocations & matrices',
    },
    {
      title: 'Academic Calendar',
      href: '/app/academic/calendar',
      icon: Calendar,
      desc: 'Terms, working days & schedules',
    },
    {
      title: 'Curriculum Plans',
      href: '/app/academic/curriculum',
      icon: FileText,
      desc: 'Curricula, units & coverage tracking',
    },
    {
      title: 'AI Lesson Planning',
      href: '/app/academic/lesson-planning',
      icon: Sparkles,
      desc: 'Structured plans & lesson generator',
    },
    {
      title: 'Digital Resources',
      href: '/app/academic/resources',
      icon: FolderCheck,
      desc: 'Uploaded assets & grade bindings',
    },
    {
      title: 'Readiness Audit',
      href: '/app/academic/readiness',
      icon: CheckCircle2,
      desc: '12-domain validation scorecard',
    },
  ];

  return (
    <div
      data-testid="academic-overview-page"
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* 1. Header Banner */}
      <DashboardPageHeader
        title="Academic Operations Overview"
        description="Institutional academic hierarchy, curriculum milestones, faculty workload distribution, and readiness scorecard."
        badge={{
          text: currentYear ? `Session: ${currentYear.academic_year_name}` : 'Academic Operations',
          variant: 'primary',
          icon: BookOpen,
        }}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Overview
          </Button>
        }
      />

      {error && <DashboardErrorState message={error} onRetry={loadData} />}

      {/* 2. Primary KPI Overview */}
      <DashboardSection
        title="Institutional Academic KPIs"
        description="Live aggregate metrics across current academic configurations."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            title="Academic Years"
            value={overview?.academic_years?.total ?? metrics?.total_academic_years ?? 0}
            subtitle={
              currentYear
                ? `Active: ${currentYear.academic_year_name}`
                : 'No active session configured'
            }
            icon={Calendar}
            variant="primary"
            loading={loading}
          />
          <DashboardKpiCard
            title="Grades & Offerings"
            value={overview?.grades?.total ?? metrics?.total_grades ?? 0}
            subtitle={`${overview?.grade_offerings?.total ?? metrics?.total_academic_year_grades ?? 0} year-grade offerings`}
            icon={Layers}
            variant="info"
            loading={loading}
          />
          <DashboardKpiCard
            title="Sections & Classes"
            value={overview?.sections?.total ?? metrics?.total_sections ?? 0}
            subtitle={`${overview?.teacher_assignments?.assigned ?? 0} teachers assigned`}
            icon={UserCheck}
            variant="success"
            loading={loading}
          />
          <DashboardKpiCard
            title="Subjects & Curriculum"
            value={curriculumOverview?.subjects?.total ?? 0}
            subtitle={`${curriculumOverview?.curriculum?.published_plans ?? 0} published plans`}
            icon={BookOpen}
            variant="purple"
            loading={loading}
          />
        </div>
      </DashboardSection>

      {/* 3. Readiness Checklist & Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Core Structure Readiness Checklist
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Prerequisites verified from academic years, grade tiers, sections, and class
                mentorship.
              </p>
            </div>
            <Link
              to="/app/academic/readiness"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              Full Audit <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {readinessChecks.map((check) => (
              <div
                key={check.label}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {check.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    {check.label}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      check.done
                        ? getAcademicStatusBadgeClass('ready')
                        : getAcademicStatusBadgeClass('warning')
                    }`}
                  >
                    {check.done ? 'Configured' : 'Pending'}
                  </Badge>
                  <Link
                    to={check.href}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    {check.cta}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timetable & Session Snapshot Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-border/60 pb-3">
              <h3 className="text-sm font-bold text-foreground">Timetable & Session Snapshot</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time scheduling and academic status
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Timetable Coverage</span>
                  <span className="font-bold text-foreground">
                    {timetableOverview?.coverage_percentage ?? 0}%
                  </span>
                </div>
                <Progress
                  value={timetableOverview?.coverage_percentage ?? 0}
                  className="h-2 rounded-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    Published Versions
                  </div>
                  <div className="text-lg font-black text-foreground mt-0.5">
                    {timetableOverview?.published_timetables ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="text-[11px] text-muted-foreground font-medium">Active Terms</div>
                  <div className="text-lg font-black text-foreground mt-0.5">
                    {curriculumOverview?.terms?.active ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    Scheduled Teachers
                  </div>
                  <div className="text-lg font-black text-foreground mt-0.5">
                    {timetableOverview?.total_teachers_scheduled ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    Published Plans
                  </div>
                  <div className="text-lg font-black text-foreground mt-0.5">
                    {curriculumOverview?.curriculum?.published_plans ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {readinessYears.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-border/60">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Configured Academic Years
              </div>
              <div className="space-y-1.5">
                {readinessYears.slice(0, 3).map((yr) => (
                  <Link
                    key={yr.academic_year_id}
                    to={`/app/academic/readiness/${yr.academic_year_id}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 text-xs transition border border-transparent hover:border-border/60"
                  >
                    <span className="font-semibold text-foreground truncate">
                      {yr.academic_year_name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${getAcademicStatusBadgeClass(yr.status)}`}
                    >
                      {yr.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Quick Module Directory */}
      <DashboardSection
        title="Academic Workspaces"
        description="Direct navigation into instructional workflows, syllabus management, and timetable matrices."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {moduleShortcuts.map((mod) => {
            const ModIcon = mod.icon;
            return (
              <Link
                key={mod.href}
                to={mod.href}
                className="group p-4 rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-sm transition-all duration-200 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ModIcon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {mod.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    {mod.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </DashboardSection>
    </div>
  );
};

export default AcademicOverviewPage;
