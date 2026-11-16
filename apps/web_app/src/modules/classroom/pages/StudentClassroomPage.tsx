import React, { useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClassroomSessionDto,
  SessionListQuery,
  useGetStudentClassroomAttendanceQuery,
  useGetStudentClassroomOverviewQuery,
  useGetStudentClassroomSessionsQuery,
  useGetStudentFlippedPreparationsQuery,
  useJoinStudentClassroomSessionMutation,
} from '@/shared/api/classroom.api';
import {
  AttendanceStatusBadge,
  AttendanceSummaryCards,
  DeliveryModeBadge,
  SessionStatusBadge,
  TeachingApproachBadge,
} from '../components/ClassroomBadges';
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  HelpCircle,
  ListChecks,
  MapPin,
  Radio,
  RefreshCw,
  Sparkles,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TabKey = 'sessions' | 'flipped' | 'attendance' | 'classes';

export const StudentClassroomPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('sessions');
  const [viewFilter, setViewFilter] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');
  const [modeFilter, setModeFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview,
  } = useGetStudentClassroomOverviewQuery();

  const queryParams: SessionListQuery = {
    view: viewFilter,
    delivery_mode: (modeFilter as any) || undefined,
    search: search.trim() || undefined,
    page,
    limit: 12,
  };

  const {
    data: sessionsData,
    isFetching: sessionsFetching,
    refetch: refetchSessions,
  } = useGetStudentClassroomSessionsQuery(queryParams);

  const {
    data: attendanceData,
    isFetching: attendanceFetching,
    refetch: refetchAttendance,
  } = useGetStudentClassroomAttendanceQuery({ page: 1, limit: 25 });

  const {
    data: flippedData,
    isFetching: flippedFetching,
    refetch: refetchFlipped,
  } = useGetStudentFlippedPreparationsQuery();

  const [joinSession] = useJoinStudentClassroomSessionMutation();

  const handleRefresh = () => {
    refetchOverview();
    refetchSessions();
    refetchAttendance();
    refetchFlipped();
  };

  const handleJoinClass = async (session: ClassroomSessionDto) => {
    setJoiningSessionId(session.session_id);
    try {
      const res = await joinSession(session.session_id).unwrap();
      toast.success(
        res.already_recorded
          ? 'Re-opening live class session...'
          : 'Online attendance recorded as Present. Opening session link...',
      );
      if (res.meeting_url) {
        window.open(res.meeting_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Unable to join classroom session');
    } finally {
      setJoiningSessionId(null);
    }
  };

  if (overviewLoading) {
    return (
      <PageContainer data-testid="student-classroom-page">
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading Hybrid Classroom workspace...
        </div>
      </PageContainer>
    );
  }

  if (overviewError || !overview) {
    return (
      <PageContainer data-testid="student-classroom-page">
        <Card className="p-8 text-center space-y-3 rounded-2xl">
          <div className="text-base font-bold text-rose-600">Unable to load Student Classroom</div>
          <p className="text-sm text-muted-foreground">
            Ensure your account is linked to an active student enrollment in this school.
          </p>
          <Button variant="outline" onClick={handleRefresh}>
            Retry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const sessions = sessionsData?.items || [];

  return (
    <PageContainer data-testid="student-classroom-page">
      <PageHeader
        title="Hybrid Classroom"
        description={`${overview.student.full_name} • ${overview.student.grade_name || 'Grade'} ${overview.student.section_name ? `Section ${overview.student.section_name}` : ''} (${overview.student.academic_year_name || 'Current Academic Year'})`}
        badge={
          <Badge variant="outline" className="gap-1.5 font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-primary" />
            Student Portal
          </Badge>
        }
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
            <RefreshCw className={cn('w-4 h-4', sessionsFetching && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <AttendanceSummaryCards summary={overview.attendance_summary} titlePrefix="My" />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {[
          { key: 'sessions' as TabKey, label: 'Classroom Sessions', icon: Radio },
          {
            key: 'flipped' as TabKey,
            label: `Flipped Preparation${flippedData && flippedData.length > 0 ? ` (${flippedData.length})` : ''}`,
            icon: Sparkles,
          },
          { key: 'attendance' as TabKey, label: 'My Attendance History', icon: Clock },
          { key: 'classes' as TabKey, label: 'My Enrolled Subjects', icon: BookOpen },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className="gap-2 rounded-xl"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'live', 'upcoming', 'past'] as const).map((view) => (
                <Button
                  key={view}
                  size="sm"
                  variant={viewFilter === view ? 'default' : 'outline'}
                  onClick={() => {
                    setViewFilter(view);
                    setPage(1);
                  }}
                  className="capitalize rounded-xl"
                >
                  {view === 'live' ? 'Live Now' : view}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={modeFilter}
                onChange={(e) => {
                  setModeFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-xl border border-input bg-background text-sm"
                aria-label="Filter by delivery mode"
              >
                <option value="">All Modes</option>
                <option value="physical">Physical</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search subject or topic..."
                className="h-9 px-3 rounded-xl border border-input bg-background text-sm w-56"
              />
            </div>
          </div>

          {sessions.length === 0 ? (
            <Card className="p-10 text-center rounded-2xl text-sm text-muted-foreground">
              No classroom sessions match your selected filters.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session) => (
                <Card
                  key={session.session_id}
                  className="p-5 rounded-2xl border-slate-200/80 dark:border-border flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-base font-bold text-foreground">
                          {session.subject_name}{' '}
                          <span className="text-xs font-medium text-muted-foreground">
                            ({session.subject_code})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {session.grade_name} • Sec {session.section_name} • Teacher:{' '}
                          <strong className="text-foreground">{session.teacher_name}</strong>
                        </div>
                      </div>
                      <SessionStatusBadge status={session.session_status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <DeliveryModeBadge mode={session.delivery_mode} />
                      <TeachingApproachBadge approach={session.teaching_approach} />
                      <AttendanceStatusBadge
                        status={session.student_attendance?.attendance_status || null}
                        participationMode={session.student_attendance?.participation_mode}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{session.session_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>
                          {session.scheduled_start_time.slice(0, 5)} –{' '}
                          {session.scheduled_end_time.slice(0, 5)}
                        </span>
                      </div>
                      {(session.classroom_name || session.classroom_code) && (
                        <div className="col-span-2 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>Room: {session.classroom_name || session.classroom_code}</span>
                        </div>
                      )}
                      {session.lesson_title && (
                        <div className="col-span-2 truncate">
                          Lesson:{' '}
                          <strong className="text-foreground">{session.lesson_title}</strong>
                        </div>
                      )}
                      {session.topics_covered && (
                        <div className="col-span-2">
                          Topics: <span className="text-foreground">{session.topics_covered}</span>
                        </div>
                      )}
                      {session.session_status === 'not_conducted' &&
                        session.not_conducted_reason && (
                          <div className="col-span-2 text-amber-700">
                            Reason: {session.not_conducted_reason}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                    <span className="text-xs text-muted-foreground">
                      {session.can_join
                        ? 'Live session link ready'
                        : session.join_reason || 'Session overview'}
                    </span>

                    {session.can_join ? (
                      <Button
                        size="sm"
                        disabled={joiningSessionId === session.session_id}
                        onClick={() => handleJoinClass(session)}
                        className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Video className="w-3.5 h-3.5" />
                        {joiningSessionId === session.session_id
                          ? 'Joining...'
                          : 'Join Online Class'}
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled className="rounded-xl">
                        {session.delivery_mode === 'physical' ? 'In-Person Class' : 'Join Locked'}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {sessionsData && sessionsData.total_pages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {sessionsData.page} of {sessionsData.total_pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= sessionsData.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'flipped' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm text-foreground">
                Flipped Classroom Preparation Model
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review assigned learning materials, watch instructional media, and prepare your
                responses before the scheduled classroom session. In-class time is dedicated to
                active problem-solving, group discussions, and guided practice.
              </p>
            </div>
          </div>

          {!flippedData || flippedData.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border-slate-200/80 dark:border-border space-y-3">
              <BookMarked className="w-10 h-10 text-muted-foreground mx-auto" />
              <div className="font-semibold text-foreground">No Upcoming Flipped Lessons</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No flipped classroom lessons are currently assigned for your enrolled section. When
                teachers schedule a flipped class with pre-class material, it will appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {flippedData.map((session) => {
                const prep = session.flipped_preparation;
                return (
                  <Card
                    key={session.session_id}
                    className="p-6 rounded-2xl border-slate-200/80 dark:border-border space-y-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-foreground">
                            {session.subject_name}
                          </span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {session.subject_code}
                          </Badge>
                          <DeliveryModeBadge mode={session.delivery_mode} />
                          <TeachingApproachBadge approach={session.teaching_approach} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Teacher:{' '}
                          <strong className="text-foreground">{session.teacher_name}</strong> •{' '}
                          {session.grade_name} Section {session.section_name}
                        </div>
                      </div>

                      <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/40 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Pre-Class Deadline: <strong>{session.session_date}</strong> at{' '}
                          <strong>{session.scheduled_start_time.slice(0, 5)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Lesson Topic & Unit */}
                    <div className="space-y-1">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Lesson Topic
                      </div>
                      <div className="text-base font-semibold text-foreground">
                        {prep?.lesson_title ||
                          session.topics_covered ||
                          'Flipped Preparation Topic'}
                      </div>
                      {prep?.unit_title && (
                        <div className="text-xs text-muted-foreground">
                          Curriculum Unit: <strong>{prep.unit_title}</strong>{' '}
                          {prep.unit_code ? `(${prep.unit_code})` : ''}
                        </div>
                      )}
                    </div>

                    {/* Instructions & Expectations */}
                    {(prep?.lesson_summary ||
                      prep?.prerequisite_knowledge ||
                      session.teacher_remarks) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/30 p-4 rounded-xl text-xs">
                        {prep?.lesson_summary && (
                          <div className="space-y-1">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-primary" /> Teacher Instructions
                            </span>
                            <p className="text-muted-foreground whitespace-pre-line">
                              {prep.lesson_summary}
                            </p>
                          </div>
                        )}
                        {prep?.prerequisite_knowledge && (
                          <div className="space-y-1">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-primary" /> Prerequisite
                              Knowledge & Expectations
                            </span>
                            <p className="text-muted-foreground whitespace-pre-line">
                              {prep.prerequisite_knowledge}
                            </p>
                          </div>
                        )}
                        {!prep?.lesson_summary && session.teacher_remarks && (
                          <div className="space-y-1 md:col-span-2">
                            <span className="font-semibold text-foreground">Teacher Remarks</span>
                            <p className="text-muted-foreground">{session.teacher_remarks}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assigned Learning Resources */}
                    {prep?.resources && prep.resources.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-primary" /> Pre-Class Learning
                          Resources ({prep.resources.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {prep.resources.map((res) => (
                            <div
                              key={res.resource_id}
                              className="p-3.5 rounded-xl border border-border/80 bg-background flex items-start justify-between gap-3 hover:border-primary/40 transition-colors"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] uppercase font-mono"
                                  >
                                    {res.resource_type}
                                  </Badge>
                                  <span className="text-xs font-semibold text-foreground truncate">
                                    {res.title}
                                  </span>
                                </div>
                                {res.usage_notes && (
                                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                                    {res.usage_notes}
                                  </p>
                                )}
                                {res.file_name && (
                                  <div className="text-[10px] text-muted-foreground/80 font-mono truncate">
                                    {res.file_name}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {(res.preview_url || res.external_url) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs gap-1 rounded-lg"
                                    onClick={() =>
                                      window.open(
                                        res.preview_url || res.external_url || '',
                                        '_blank',
                                        'noopener,noreferrer',
                                      )
                                    }
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Open
                                  </Button>
                                )}
                                {res.download_url && res.download_url !== res.preview_url && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs gap-1 rounded-lg"
                                    onClick={() =>
                                      window.open(
                                        res.download_url!,
                                        '_blank',
                                        'noopener,noreferrer',
                                      )
                                    }
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pre-Class Preparation Questions */}
                    {prep?.preparation_questions && prep.preparation_questions.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Preparation
                          Questions ({prep.preparation_questions.length})
                        </div>
                        <div className="space-y-2">
                          {prep.preparation_questions.map((q, idx) => (
                            <div
                              key={q.exit_ticket_id}
                              className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1"
                            >
                              <div className="font-medium text-foreground flex items-start gap-1.5">
                                <span className="font-bold text-amber-600">Q{idx + 1}:</span>
                                <span>{q.prompt}</span>
                              </div>
                              {q.expected_response_or_criteria && (
                                <p className="text-[11px] text-muted-foreground pl-5">
                                  Thinking cue: {q.expected_response_or_criteria}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expected Outcomes */}
                    {prep?.outcomes && prep.outcomes.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <ListChecks className="w-3.5 h-3.5 text-primary" /> Target Learning
                          Outcomes
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {prep.outcomes.map((o) => (
                            <div
                              key={o.learning_outcome_id}
                              className="px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs flex items-center gap-1.5"
                            >
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {o.outcome_code}
                              </Badge>
                              <span className="text-muted-foreground">{o.outcome_statement}</span>
                              {o.bloom_level && (
                                <Badge variant="secondary" className="text-[10px] capitalize">
                                  {o.bloom_level}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* In-Class Activities Preview */}
                    {prep?.in_class_activities && prep.in_class_activities.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-emerald-600" /> Scheduled In-Class
                          Activities ({prep.in_class_activities.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {prep.in_class_activities.map((act) => (
                            <div
                              key={act.lesson_activity_id}
                              className="p-2.5 rounded-xl bg-background border border-border/70 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {act.activity_type.replace('_', ' ')}
                                </Badge>
                                {act.duration_minutes && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {act.duration_minutes} min
                                  </span>
                                )}
                              </div>
                              <div className="font-medium text-foreground truncate">
                                {act.activity_title}
                              </div>
                              {act.activity_description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-2">
                                  {act.activity_description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post-Class Follow-up */}
                    {prep?.post_class_activities && prep.post_class_activities.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Connected
                          Follow-up Assignments ({prep.post_class_activities.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {prep.post_class_activities.map((p) => (
                            <div
                              key={p.activity_id}
                              className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-200/40 dark:border-indigo-900/40 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] uppercase font-mono"
                                >
                                  {p.activity_type}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  Due: {p.due_at.slice(0, 10)}
                                </span>
                              </div>
                              <div className="font-semibold text-foreground">{p.title}</div>
                              <p className="text-[11px] text-muted-foreground line-clamp-1">
                                {p.instructions}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <Card className="rounded-2xl overflow-hidden border-slate-200/80 dark:border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="font-bold text-sm">Session-Wise Attendance Log</div>
            {attendanceFetching && (
              <span className="text-xs text-muted-foreground">Syncing...</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Date & Time</th>
                  <th className="text-left p-3">Subject</th>
                  <th className="text-left p-3">Teacher</th>
                  <th className="text-left p-3">Mode</th>
                  <th className="text-left p-3">Attendance</th>
                  <th className="text-left p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!attendanceData || attendanceData.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No classroom attendance records recorded yet.
                    </td>
                  </tr>
                ) : (
                  attendanceData.items.map((row: any) => (
                    <tr key={row.session_attendance_id}>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-medium">{row.session_date}</div>
                        <div className="text-xs text-muted-foreground">
                          {String(row.scheduled_start_time).slice(0, 5)} –{' '}
                          {String(row.scheduled_end_time).slice(0, 5)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{row.subject_name}</div>
                        <div className="text-xs text-muted-foreground">{row.subject_code}</div>
                      </td>
                      <td className="p-3">{row.teacher_name}</td>
                      <td className="p-3">
                        <DeliveryModeBadge mode={row.delivery_mode} />
                      </td>
                      <td className="p-3">
                        <AttendanceStatusBadge
                          status={row.attendance_status}
                          participationMode={row.participation_mode}
                        />
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{row.remarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overview.classes.length === 0 ? (
            <Card className="col-span-full p-8 text-center text-sm text-muted-foreground rounded-2xl">
              No active subject allocations found for your section.
            </Card>
          ) : (
            overview.classes.map((cls: any) => (
              <Card key={cls.academic_year_grade_subject_id} className="p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{cls.subject_code}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {cls.grade_name} • Sec {cls.section_name}
                  </span>
                </div>
                <div className="text-base font-bold">{cls.subject_name}</div>
                <div className="text-xs text-muted-foreground">
                  Assigned Teacher: <strong className="text-foreground">{cls.teacher_name}</strong>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default StudentClassroomPage;
