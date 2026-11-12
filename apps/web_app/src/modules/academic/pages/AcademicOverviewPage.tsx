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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AcademicManagementService,
  AcademicOverviewMetrics,
  AcademicDashboardMetrics,
  CurriculumOverview,
  TimetableOverview,
  ReadinessTenantYearItem,
  extractAcademicApiError,
} from '../services/academic.service';
import {
  AcademicPageHeader,
  AcademicStatusBanner,
  formatShortDate,
  getAcademicStatusBadgeClass,
} from '../components/AcademicPageHeader';

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
      desc: 'Academic sessions, boards & full hierarchy',
    },
    {
      title: 'Grades & Sections',
      href: '/app/academic/classes',
      icon: Layers,
      desc: 'Master grades, intakes & section teachers',
    },
    {
      title: 'Subjects & Catalog',
      href: '/app/academic/subjects',
      icon: BookOpen,
      desc: 'Institutional subject catalog & allocations',
    },
    {
      title: 'Faculty Scheduling & Workload',
      href: '/app/academic/faculty',
      icon: UserCheck,
      desc: 'Weekly periods, load balance & daily grid',
    },
    {
      title: 'Timetable Master',
      href: '/app/academic/timetable',
      icon: Clock,
      desc: 'Versions, section matrices, rooms & conflicts',
    },
    {
      title: 'Academic Calendar & Terms',
      href: '/app/academic/calendar',
      icon: Calendar,
      desc: 'Terms, working days & event schedule',
    },
    {
      title: 'Curriculum & Syllabus',
      href: '/app/academic/curriculum',
      icon: FileText,
      desc: 'Plans, units, outcomes & coverage tracking',
    },
    {
      title: 'AI Lesson Planning',
      href: '/app/academic/lesson-planning',
      icon: Sparkles,
      desc: 'AI plan generator, refinement & library',
    },
    {
      title: 'Digital Resource Library',
      href: '/app/academic/resources',
      icon: FolderCheck,
      desc: 'Uploaded files, links & grade bindings',
    },
    {
      title: 'Readiness & Publishing',
      href: '/app/academic/readiness',
      icon: CheckCircle2,
      desc: '12-domain validation scorecard & dependencies',
    },
  ];

  return (
    <div data-testid="academic-overview-page" className="p-6 max-w-7xl mx-auto space-y-6">
      <AcademicPageHeader
        title="Academic Overview"
        subtitle="Institutional academic structure, curriculum progress, scheduling coverage, and readiness telemetry."
        icon={LayoutDashboard}
        onRefresh={loadData}
        loading={loading}
        badgeText={currentYear ? `Active: ${currentYear.academic_year_name}` : undefined}
      />

      <AcademicStatusBanner error={error} />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Academic Years</CardDescription>
            <CardTitle className="text-3xl font-black">
              {overview?.academic_years?.total ?? metrics?.total_academic_years ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {currentYear
              ? `Current: ${currentYear.academic_year_name} (${formatShortDate(currentYear.start_date)} – ${formatShortDate(currentYear.end_date)})`
              : 'No active teaching academic year selected'}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Grades & Offerings</CardDescription>
            <CardTitle className="text-3xl font-black">
              {overview?.grades?.total ?? metrics?.total_grades ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {overview?.grade_offerings?.total ?? metrics?.total_academic_year_grades ?? 0} active
            year-grade offerings
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sections & Mentorship</CardDescription>
            <CardTitle className="text-3xl font-black">
              {overview?.sections?.total ?? metrics?.total_sections ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {overview?.teacher_assignments?.assigned ?? 0} assigned ·{' '}
            {overview?.teacher_assignments?.unassigned ?? 0} unassigned class teachers
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Subjects & Curriculum</CardDescription>
            <CardTitle className="text-3xl font-black">
              {curriculumOverview?.subjects?.total ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {curriculumOverview?.curriculum?.published_plans ?? 0} published /{' '}
            {curriculumOverview?.curriculum?.total_plans ?? 0} total plans
          </CardContent>
        </Card>
      </div>

      {/* Setup Readiness Checklist + Timetable & Year Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Core Structure Readiness Checklist
            </CardTitle>
            <CardDescription>
              Live structural prerequisites derived from academic years, grades, sections, and
              faculty assignments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {readinessChecks.map((check) => (
              <div
                key={check.label}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/20"
              >
                <div className="flex items-center gap-2.5">
                  {check.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className="text-sm font-semibold">{check.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      check.done
                        ? getAcademicStatusBadgeClass('ready')
                        : getAcademicStatusBadgeClass('warning')
                    }
                  >
                    {check.done ? 'Configured' : 'Pending'}
                  </Badge>
                  <Link
                    to={check.href}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    {check.cta}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Timetable & Session Snapshot</CardTitle>
            <CardDescription>Live scheduling and academic year statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="text-xs text-muted-foreground">Timetable Coverage</div>
                <div className="text-xl font-black mt-0.5">
                  {timetableOverview?.coverage_percentage ?? 0}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="text-xs text-muted-foreground">Published Versions</div>
                <div className="text-xl font-black mt-0.5">
                  {timetableOverview?.published_timetables ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="text-xs text-muted-foreground">Active Terms</div>
                <div className="text-xl font-black mt-0.5">
                  {curriculumOverview?.terms?.active ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                <div className="text-xs text-muted-foreground">Scheduled Teachers</div>
                <div className="text-xl font-black mt-0.5">
                  {timetableOverview?.total_teachers_scheduled ?? 0}
                </div>
              </div>
            </div>

            {readinessYears.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Academic Sessions
                </div>
                {readinessYears.slice(0, 3).map((yr) => (
                  <Link
                    key={yr.academic_year_id}
                    to={`/app/academic/readiness/${yr.academic_year_id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 text-xs transition"
                  >
                    <span className="font-semibold truncate">{yr.academic_year_name}</span>
                    <Badge variant="outline" className={getAcademicStatusBadgeClass(yr.status)}>
                      {yr.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Module Directory */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Academic Management Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {moduleShortcuts.map((mod) => {
            const ModIcon = mod.icon;
            return (
              <Link
                key={mod.href}
                to={mod.href}
                className="group p-4 rounded-xl border border-border/70 bg-card hover:border-indigo-500/60 hover:shadow-sm transition flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <ModIcon className="w-4 h-4 text-indigo-600" />
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">{mod.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    {mod.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AcademicOverviewPage;
