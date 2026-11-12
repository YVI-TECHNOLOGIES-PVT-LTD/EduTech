import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderCheck,
  GraduationCap,
  Layers,
  MessageSquare,
  School,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setSelectedChildId } from '@/shared/store/parentPortalSlice';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageContainer } from '@/components/layout/PageLayout';
import { cn, getInitials } from '@/lib/utils';
import {
  ChildResourceDto,
  ParentChildDto,
  useGetParentDashboardOverviewQuery,
  useLazyGetChildResourceDownloadQuery,
  useLazyGetChildResourcePreviewQuery,
} from '@/shared/api/parentPortal.api';
import { useGetNotificationsQuery } from '@/shared/api/notification.api';
import {
  formatRelativeTime,
  getCategoryConfig,
  normalizeNotifications,
} from '@/features/notifications/utils/notification.utils';
import {
  ParentErrorState,
  ParentLoadingSkeleton,
  ParentNoChildrenState,
} from '@/modules/parent/components/ParentStates';
import {
  TodayScheduleWidget,
  WeeklyTimetableMatrix,
} from '@/modules/parent/components/ParentTimetableWidgets';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatReadableDate(isoOrDate?: Date | string): string {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const urlChildId = searchParams.get('childId');
  const reduxChildId = useAppSelector((state) => state.parentPortal.selectedChildId);
  const requestedChildId = urlChildId || reduxChildId || undefined;

  const {
    data: overview,
    isLoading,
    isError,
    refetch,
  } = useGetParentDashboardOverviewQuery(requestedChildId, {
    skip: !isAuthenticated,
  });

  const { data: notifRaw } = useGetNotificationsQuery({ limit: 5 }, { skip: !isAuthenticated });

  const [triggerPreview] = useLazyGetChildResourcePreviewQuery();
  const [triggerDownload] = useLazyGetChildResourceDownloadQuery();

  const recentNotifications = useMemo(
    () => normalizeNotifications(notifRaw).slice(0, 5),
    [notifRaw],
  );

  const effectiveChildId = overview?.selected_child_id || null;
  const children = overview?.children || [];
  const selectedAcademic = overview?.selected_child_academic || null;

  const handleSelectChild = (childId: string) => {
    dispatch(setSelectedChildId(childId));
    const next = new URLSearchParams(searchParams);
    next.set('childId', childId);
    setSearchParams(next, { replace: true });
  };

  const handlePreviewResource = async (resource: ChildResourceDto) => {
    if (!effectiveChildId) return;
    if (resource.resource_type === 'external_link' && resource.external_url) {
      window.open(resource.external_url, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      const res: any = await triggerPreview({
        childId: effectiveChildId,
        resourceId: resource.resource_id,
      }).unwrap();
      const targetUrl = res?.signedUrl || res?.signed_url || res?.url || res?.external_url;
      if (!targetUrl) {
        toast.error('Preview URL unavailable for this resource.');
        return;
      }
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Unable to preview resource.');
    }
  };

  const handleDownloadResource = async (resource: ChildResourceDto) => {
    if (!effectiveChildId) return;
    try {
      const res: any = await triggerDownload({
        childId: effectiveChildId,
        resourceId: resource.resource_id,
      }).unwrap();
      const targetUrl = res?.signedUrl || res?.signed_url || res?.url;
      if (!targetUrl) {
        toast.error('Download URL unavailable for this resource.');
        return;
      }
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Downloads are restricted for this resource.');
    }
  };

  if (isLoading) {
    return (
      <PageContainer data-testid="parent-dashboard-page">
        <ParentLoadingSkeleton cards={3} />
      </PageContainer>
    );
  }

  if (isError || !overview) {
    return (
      <PageContainer data-testid="parent-dashboard-page">
        <ParentErrorState
          title="Unable to Load Parent Dashboard"
          message="We could not retrieve your linked children and academic overview. Please retry."
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const parentDisplayName = user?.full_name?.trim() || user?.email?.split('@')[0] || 'Parent';
  const summary = overview.summary;

  return (
    <PageContainer data-testid="parent-dashboard-page">
      <div className="space-y-6">
        {/* 5.1 Dashboard Header */}
        <Card className="p-6 rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {overview.organization?.org_name && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                    <School className="w-3.5 h-3.5 text-primary" />
                    {overview.organization.org_name}
                  </span>
                )}
                {overview.current_academic_year?.academic_year_name && (
                  <Badge variant="info" className="text-[10px] font-bold">
                    AY {overview.current_academic_year.academic_year_name}
                  </Badge>
                )}
                {overview.organization?.board_affiliation && (
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {overview.organization.board_affiliation}
                  </Badge>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatReadableDate()}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {getTimeGreeting()}, {parentDisplayName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Here is your children&apos;s academic overview.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/parent/notifications')}
                className="rounded-xl gap-2"
              >
                <Bell className="w-4 h-4 text-primary" />
                <span>Notifications</span>
                {summary.unread_notifications_count > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                    {summary.unread_notifications_count}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/parent/profile')}
                className="rounded-xl gap-2"
              >
                <User className="w-4 h-4 text-primary" />
                <span>My Profile</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* 5.3 Academic Summary Cards (Strict Verified Data Only) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            {
              label: 'Linked Children',
              value: summary.total_children,
              icon: Users,
              accent: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400',
              to: '/app/parent/children',
            },
            {
              label: 'Active Enrollments',
              value: summary.active_enrollments,
              icon: GraduationCap,
              accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',
              to: '/app/parent/children',
            },
            {
              label: "Today's Classes",
              value: summary.today_classes_count,
              icon: Clock,
              accent: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400',
              to: '/app/parent/timetable',
            },
            {
              label: 'Upcoming Events',
              value: summary.upcoming_events_count,
              icon: CalendarDays,
              accent: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400',
              to: '/app/parent/academic-calendar',
            },
            {
              label: 'Learning Resources',
              value: summary.available_resources_count,
              icon: Layers,
              accent: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',
              to: '/app/parent/learning-resources',
            },
            {
              label: 'Unread Updates',
              value: summary.unread_notifications_count,
              icon: Bell,
              accent: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400',
              to: '/app/parent/notifications',
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.label}
                type="button"
                onClick={() => navigate(stat.to)}
                className="text-left p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center',
                      stat.accent,
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-2xl font-black text-foreground">{stat.value}</div>
                <div className="text-[11px] font-semibold text-muted-foreground mt-0.5 truncate">
                  {stat.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* 5.2 Children Overview Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-foreground">My Children</h2>
              <p className="text-xs text-muted-foreground">
                Select a child card to update timetable, subjects, curriculum, resources, and
                calendar views below.
              </p>
            </div>
            {children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/parent/children')}
                className="text-xs gap-1"
              >
                <span>All Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {children.length === 0 ? (
            <ParentNoChildrenState
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => navigate('/app/admissions/my')}>Admissions Desk</Button>
                  <Button variant="outline" onClick={() => navigate('/app/parent/documents')}>
                    Documents Centre
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {children.map((child: ParentChildDto) => {
                const isSelected = child.student_id === effectiveChildId;
                const enr = child.current_enrollment;
                return (
                  <Card
                    key={child.student_id}
                    onClick={() => handleSelectChild(child.student_id)}
                    className={cn(
                      'p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/15 bg-primary/[0.02]'
                        : 'border-border bg-card hover:border-primary/40',
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      <Avatar className="w-12 h-12 border border-border shrink-0">
                        {child.photo_url && (
                          <AvatarImage src={child.photo_url} alt={child.full_name} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                          {getInitials(child.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-extrabold text-foreground truncate">
                            {child.full_name}
                          </h3>
                          {isSelected && (
                            <Badge variant="info" className="text-[10px] font-bold shrink-0">
                              Active View
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          {child.admission_no && (
                            <span className="font-mono font-semibold text-foreground/80">
                              {child.admission_no}
                            </span>
                          )}
                          <Badge
                            variant={enr ? 'secondary' : 'outline'}
                            className="text-[10px] font-semibold capitalize"
                          >
                            {enr?.enrollment_status || 'Placement Pending'}
                          </Badge>
                        </div>

                        {enr ? (
                          <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                            <div className="font-semibold text-foreground">
                              {enr.grade_name}
                              {enr.section_name ? ` • Section ${enr.section_name}` : ''}
                            </div>
                            <div className="text-[11px]">{enr.academic_year_name}</div>
                            {enr.class_teacher && (
                              <div className="text-[11px] flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate">
                                  Class Teacher: {enr.class_teacher.name}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground pt-1">
                            Current grade placement pending.
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/app/parent/children?childId=${child.student_id}`)}
                        className="flex-1 text-xs rounded-xl"
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() =>
                          navigate(`/app/parent/timetable?childId=${child.student_id}`)
                        }
                        className="flex-1 text-xs rounded-xl"
                      >
                        View Timetable
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Child-Scoped Stage 2 Sections */}
        {selectedAcademic && (
          <>
            {/* 5.4 Today's Timetable & 5.6 Academic Overview */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">
                      Today&apos;s Timetable — {selectedAcademic.child.full_name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Published period schedule including current, upcoming, completed classes, and
                      breaks.
                    </p>
                  </div>
                </div>

                <TodayScheduleWidget
                  timetable={selectedAcademic.today_timetable}
                  compact
                  onViewFullTimetable={() =>
                    navigate(`/app/parent/timetable?childId=${selectedAcademic.child.student_id}`)
                  }
                />
              </div>

              {/* 5.6 Academic Overview */}
              <div className="space-y-3">
                <h2 className="text-base font-extrabold text-foreground">Academic Overview</h2>
                <Card className="p-5 rounded-2xl border-border bg-card space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Grade &amp; Section</span>
                      <span className="font-bold text-foreground">
                        {selectedAcademic.child.current_enrollment
                          ? `${selectedAcademic.child.current_enrollment.grade_name}${
                              selectedAcademic.child.current_enrollment.section_name
                                ? ` - ${selectedAcademic.child.current_enrollment.section_name}`
                                : ''
                            }`
                          : 'Placement Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Academic Year</span>
                      <span className="font-bold text-foreground">
                        {selectedAcademic.child.current_enrollment?.academic_year_name ||
                          overview.current_academic_year?.academic_year_name ||
                          'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Board Affiliation</span>
                      <span className="font-bold text-foreground">
                        {selectedAcademic.board_affiliation || 'Not Configured'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Class Teacher</span>
                      <span className="font-bold text-foreground">
                        {selectedAcademic.child.current_enrollment?.class_teacher?.name ||
                          'Not Assigned'}
                      </span>
                    </div>
                  </div>

                  {/* Published Curriculum Pacing */}
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-primary" />
                        Published Curriculum
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {selectedAcademic.curriculum_pacing.published_subjects_count} Plans
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded-lg bg-card border border-border/50">
                        <div className="text-sm font-black text-foreground">
                          {selectedAcademic.subjects.length}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Subjects</div>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border/50">
                        <div className="text-sm font-black text-foreground">
                          {selectedAcademic.curriculum_pacing.total_units}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Units</div>
                      </div>
                      <div className="p-2 rounded-lg bg-card border border-border/50">
                        <div className="text-sm font-black text-foreground">
                          {selectedAcademic.curriculum_pacing.total_outcomes}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Outcomes</div>
                      </div>
                    </div>
                  </div>

                  {/* Enrolled Subjects Chips */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Enrolled Subjects</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/app/parent/subjects?childId=${selectedAcademic.child.student_id}`,
                          )
                        }
                        className="h-7 px-2 text-[11px]"
                      >
                        View Curriculum
                      </Button>
                    </div>
                    {selectedAcademic.subjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No grade subjects assigned yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAcademic.subjects.slice(0, 8).map((subj) => (
                          <Badge
                            key={subj.academic_year_grade_subject_id}
                            variant="secondary"
                            className="text-[11px] font-semibold"
                          >
                            {subj.subject_name}
                          </Badge>
                        ))}
                        {selectedAcademic.subjects.length > 8 && (
                          <Badge variant="outline" className="text-[11px]">
                            +{selectedAcademic.subjects.length - 8} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* 5.5 Weekly Timetable Preview */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-foreground">
                    Weekly Timetable Preview
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Configured working days, period timings, faculty, classrooms, and breaks.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/app/parent/timetable?childId=${selectedAcademic.child.student_id}`)
                  }
                  className="rounded-xl text-xs gap-1.5"
                >
                  <span>Full Weekly Grid</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
              <WeeklyTimetableMatrix weekly={selectedAcademic.weekly_timetable} compact />
            </section>

            {/* 5.7 Learning Resources & 5.8 Academic Calendar Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Learning Resources Preview */}
              <Card className="p-5 rounded-2xl border-border bg-card space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <span>Learning Resources</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Published materials shared for your child&apos;s grade, section, or subjects.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/app/parent/learning-resources?childId=${selectedAcademic.child.student_id}`,
                      )
                    }
                    className="text-xs gap-1"
                  >
                    <span>Browse All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {selectedAcademic.recent_resources.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">
                    No published learning resources are available for this student yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedAcademic.recent_resources.slice(0, 4).map((res) => (
                      <div
                        key={res.resource_id}
                        className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground truncate">
                              {res.title}
                            </span>
                            {res.category_name && (
                              <Badge variant="outline" className="text-[10px]">
                                {res.category_name}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px]">
                              {res.resource_type === 'external_link' ? 'Link' : 'File'}
                            </Badge>
                          </div>
                          {res.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {res.description}
                            </p>
                          )}
                          {res.subjects.length > 0 && (
                            <div className="text-[10px] text-muted-foreground">
                              {res.subjects.map((s) => s.subject_name).join(', ')}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewResource(res)}
                            className="h-7 px-2 text-[11px] rounded-lg gap-1"
                          >
                            {res.resource_type === 'external_link' ? (
                              <ExternalLink className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                            <span>Open</span>
                          </Button>
                          {res.resource_type === 'file' && res.allow_download && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadResource(res)}
                              className="h-7 px-2 text-[11px] rounded-lg"
                              aria-label="Download resource"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Academic Calendar Preview */}
              <Card className="p-5 rounded-2xl border-border bg-card space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-primary" />
                      <span>Academic Calendar</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Upcoming holidays, terms, and school events applicable to your child.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/app/parent/academic-calendar?childId=${selectedAcademic.child.student_id}`,
                      )
                    }
                    className="text-xs gap-1"
                  >
                    <span>Full Calendar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {selectedAcademic.calendar_terms.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedAcademic.calendar_terms.map((t) => (
                      <Badge key={t.academic_term_id} variant="outline" className="text-[10px]">
                        {t.term_name}: {formatReadableDate(t.start_date)} –{' '}
                        {formatReadableDate(t.end_date)}
                      </Badge>
                    ))}
                  </div>
                )}

                {selectedAcademic.upcoming_calendar_entries.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">
                    No upcoming published calendar events found.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedAcademic.upcoming_calendar_entries.slice(0, 5).map((ev) => (
                      <div
                        key={ev.academic_calendar_entry_id}
                        className="p-3 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground truncate">
                              {ev.entry_name}
                            </span>
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {ev.entry_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          {ev.term_name && (
                            <div className="text-[10px] text-muted-foreground">{ev.term_name}</div>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-foreground shrink-0">
                          {new Date(ev.start_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}

        {/* 5.9 Notifications & 5.10 Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5 rounded-2xl border-border bg-card space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span>Recent Notifications</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Account alerts, school updates, and reminders.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/parent/notifications')}
                className="text-xs gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {recentNotifications.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">
                You have no recent notifications.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentNotifications.map((notif) => {
                  const cfg = getCategoryConfig(notif.category);
                  const CatIcon = cfg.icon;
                  return (
                    <div
                      key={notif.notification_id}
                      onClick={() => navigate('/app/parent/notifications')}
                      className={cn(
                        'p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors hover:border-primary/40',
                        !notif.is_read
                          ? 'bg-primary/[0.03] border-primary/30'
                          : 'bg-muted/30 border-border/70',
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0',
                          cfg.bgClass,
                        )}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground truncate">
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 5.10 Quick Actions */}
          <Card className="p-5 rounded-2xl border-border bg-card space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-foreground">Quick Actions</h2>
              <p className="text-xs text-muted-foreground">
                Navigate directly to student records, schedules, resources, and school services.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: 'My Children', icon: Users, path: '/app/parent/children' },
                { label: 'Full Timetable', icon: Clock, path: '/app/parent/timetable' },
                {
                  label: 'Academic Progress',
                  icon: TrendingUp,
                  path: '/app/parent/academic-progress',
                },
                { label: 'Subjects & Syllabus', icon: BookOpen, path: '/app/parent/subjects' },
                {
                  label: 'Learning Resources',
                  icon: FileText,
                  path: '/app/parent/learning-resources',
                },
                {
                  label: 'Academic Calendar',
                  icon: CalendarDays,
                  path: '/app/parent/academic-calendar',
                },
                { label: 'Documents Centre', icon: FolderCheck, path: '/app/parent/documents' },
                { label: 'Communication', icon: MessageSquare, path: '/app/parent/communication' },
                { label: 'Fees & Payments', icon: CreditCard, path: '/app/fees/my' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.path}
                    type="button"
                    onClick={() => navigate(action.path)}
                    className="p-3 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/70 hover:border-primary/40 transition-all text-left flex items-center gap-2.5 cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-foreground truncate">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default ParentDashboard;
