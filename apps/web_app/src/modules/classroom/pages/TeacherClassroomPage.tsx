import React, { useEffect, useMemo, useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClassroomAttendanceStatus,
  ClassroomDeliveryMode,
  ClassroomParticipationMode,
  ClassroomSessionDto,
  ClassroomTeachingApproach,
  SessionListQuery,
  useCancelTeacherClassroomSessionMutation,
  useCompleteTeacherClassroomSessionMutation,
  useCreateTeacherClassroomSessionMutation,
  useGetTeacherClassroomOverviewQuery,
  useGetTeacherClassroomSessionDetailQuery,
  useGetTeacherClassroomSessionsQuery,
  useGetTeacherSessionAuditQuery,
  useMarkTeacherClassroomAttendanceMutation,
  useMarkTeacherSessionNotConductedMutation,
  useStartTeacherClassroomSessionMutation,
  useUpdateTeacherClassroomSessionMutation,
} from '@/shared/api/classroom.api';
import {
  AttendanceStatusBadge,
  DeliveryModeBadge,
  SessionStatusBadge,
  TeachingApproachBadge,
} from '../components/ClassroomBadges';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  History,
  ListChecks,
  Lock,
  MapPin,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Sparkles,
  Square,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type DraftAttendanceEntry = {
  attendance_status: ClassroomAttendanceStatus;
  participation_mode: ClassroomParticipationMode | null;
  remarks: string;
};

export const TeacherClassroomPage: React.FC = () => {
  const [viewFilter, setViewFilter] = useState<'all' | 'live' | 'upcoming' | 'today' | 'past'>(
    'all',
  );
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'attendance' | 'audit' | 'flipped'>('attendance');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [facultyAssignmentId, setFacultyAssignmentId] = useState('');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:45');
  const [deliveryMode, setDeliveryMode] = useState<ClassroomDeliveryMode>('hybrid');
  const [teachingApproach, setTeachingApproach] =
    useState<ClassroomTeachingApproach>('traditional');
  const [classroomId, setClassroomId] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [lessonPlanId, setLessonPlanId] = useState('');
  const [topicsCovered, setTopicsCovered] = useState('');
  const [teacherRemarks, setTeacherRemarks] = useState('');

  // Complete / Not-conducted form controls
  const [completeTopics, setCompleteTopics] = useState('');
  const [notConductedReason, setNotConductedReason] = useState('');
  const [showNotConductedBox, setShowNotConductedBox] = useState(false);

  // Local editable attendance draft keyed by student_id
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, DraftAttendanceEntry>>({});

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview,
  } = useGetTeacherClassroomOverviewQuery();

  const sessionQuery: SessionListQuery = {
    view: viewFilter,
    status: (statusFilter as any) || undefined,
    delivery_mode: (modeFilter as any) || undefined,
    search: search.trim() || undefined,
    page,
    limit: 12,
  };

  const {
    data: sessionsData,
    isFetching: sessionsFetching,
    refetch: refetchSessions,
  } = useGetTeacherClassroomSessionsQuery(sessionQuery);

  const {
    data: sessionDetail,
    isFetching: detailFetching,
    refetch: refetchDetail,
  } = useGetTeacherClassroomSessionDetailQuery(selectedSessionId || '', {
    skip: !selectedSessionId,
  });

  const { data: auditData } = useGetTeacherSessionAuditQuery(
    { sessionId: selectedSessionId || '', page: 1, limit: 30 },
    { skip: !selectedSessionId || detailTab !== 'audit' },
  );

  const [createSession, { isLoading: creating }] = useCreateTeacherClassroomSessionMutation();
  const [updateSession, { isLoading: updating }] = useUpdateTeacherClassroomSessionMutation();
  const [startSession, { isLoading: starting }] = useStartTeacherClassroomSessionMutation();
  const [completeSession, { isLoading: completing }] = useCompleteTeacherClassroomSessionMutation();
  const [cancelSession, { isLoading: cancelling }] = useCancelTeacherClassroomSessionMutation();
  const [markNotConducted, { isLoading: markingNotConducted }] =
    useMarkTeacherSessionNotConductedMutation();
  const [markAttendance, { isLoading: savingAttendance }] =
    useMarkTeacherClassroomAttendanceMutation();

  useEffect(() => {
    if (overview?.assignments.length && !facultyAssignmentId) {
      setFacultyAssignmentId(overview.assignments[0].faculty_assignment_id);
    }
    if (overview?.classrooms.length && !classroomId) {
      setClassroomId(overview.classrooms[0].classroom_id);
    }
  }, [overview, facultyAssignmentId, classroomId]);

  useEffect(() => {
    if (!sessionDetail) return;
    const defaultMode: ClassroomParticipationMode | null =
      sessionDetail.session.delivery_mode === 'online'
        ? 'online'
        : sessionDetail.session.delivery_mode === 'physical'
          ? 'physical'
          : 'physical';
    const nextDraft: Record<string, DraftAttendanceEntry> = {};
    for (const student of sessionDetail.roster) {
      const status = student.attendance_status || 'present';
      const requiresMode = status === 'present' || status === 'late';
      nextDraft[student.student_id] = {
        attendance_status: status,
        participation_mode: requiresMode ? student.participation_mode || defaultMode : null,
        remarks: student.remarks || '',
      };
    }
    setAttendanceDraft(nextDraft);
    setCompleteTopics(sessionDetail.session.topics_covered || '');
  }, [sessionDetail]);

  const matchingLessonPlans = useMemo(() => {
    if (!overview) return [];
    const selectedAssign = overview.assignments.find(
      (a) => a.faculty_assignment_id === facultyAssignmentId,
    );
    if (!selectedAssign) return overview.lesson_plans;
    return overview.lesson_plans.filter(
      (lp) => lp.academic_year_grade_subject_id === selectedAssign.academic_year_grade_subject_id,
    );
  }, [overview, facultyAssignmentId]);

  const handleRefresh = () => {
    refetchOverview();
    refetchSessions();
    if (selectedSessionId) refetchDetail();
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createSession({
        faculty_assignment_id: facultyAssignmentId,
        session_date: sessionDate,
        scheduled_start_time: startTime,
        scheduled_end_time: endTime,
        delivery_mode: deliveryMode,
        teaching_approach: teachingApproach,
        classroom_id: deliveryMode === 'online' ? null : classroomId || null,
        meeting_url: deliveryMode === 'physical' ? null : meetingUrl.trim() || null,
        lesson_plan_id: lessonPlanId || null,
        topics_covered: topicsCovered.trim() || null,
        teacher_remarks: teacherRemarks.trim() || null,
      }).unwrap();

      toast.success('Classroom session scheduled successfully.');
      setShowCreateForm(false);
      setSelectedSessionId(created.session_id);
      setTopicsCovered('');
      setTeacherRemarks('');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to schedule session');
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await startSession(sessionId).unwrap();
      toast.success('Classroom session is now LIVE.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Unable to start session');
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await completeSession({
        sessionId,
        topics_covered: completeTopics.trim() || null,
      }).unwrap();
      toast.success('Classroom session marked completed.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Unable to complete session');
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      await cancelSession({ sessionId, teacher_remarks: 'Cancelled by teacher' }).unwrap();
      toast.success('Classroom session cancelled.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Unable to cancel session');
    }
  };

  const handleNotConducted = async (sessionId: string) => {
    if (!notConductedReason.trim()) {
      toast.error('Please enter a reason before marking not conducted.');
      return;
    }
    try {
      await markNotConducted({
        sessionId,
        not_conducted_reason: notConductedReason.trim(),
      }).unwrap();
      toast.success('Session marked as not conducted.');
      setShowNotConductedBox(false);
      setNotConductedReason('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Unable to update session');
    }
  };

  const handleQuickApproachToggle = async (session: ClassroomSessionDto) => {
    const nextApproach: ClassroomTeachingApproach =
      session.teaching_approach === 'traditional' ? 'flipped' : 'traditional';
    try {
      await updateSession({
        sessionId: session.session_id,
        body: { teaching_approach: nextApproach },
      }).unwrap();
      toast.success(`Teaching approach updated to ${nextApproach}.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Unable to update teaching approach');
    }
  };

  const setStudentDraftStatus = (
    studentId: string,
    status: ClassroomAttendanceStatus,
    sessionMode: ClassroomDeliveryMode,
  ) => {
    setAttendanceDraft((prev) => {
      const current = prev[studentId] || {
        attendance_status: status,
        participation_mode: null,
        remarks: '',
      };
      let nextMode: ClassroomParticipationMode | null = null;
      if (status === 'present' || status === 'late') {
        if (sessionMode === 'physical') nextMode = 'physical';
        else if (sessionMode === 'online') nextMode = 'online';
        else nextMode = current.participation_mode || 'physical';
      }
      return {
        ...prev,
        [studentId]: {
          ...current,
          attendance_status: status,
          participation_mode: nextMode,
        },
      };
    });
  };

  const applyBulkPresent = (mode: ClassroomParticipationMode) => {
    if (!sessionDetail) return;
    setAttendanceDraft((prev) => {
      const next = { ...prev };
      for (const s of sessionDetail.roster) {
        next[s.student_id] = {
          ...(next[s.student_id] || { remarks: '' }),
          attendance_status: 'present',
          participation_mode: mode,
        };
      }
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    if (!sessionDetail || !selectedSessionId) return;
    const records = sessionDetail.roster.map((student) => {
      const draft = attendanceDraft[student.student_id] || {
        attendance_status: 'present' as ClassroomAttendanceStatus,
        participation_mode:
          sessionDetail.session.delivery_mode === 'online'
            ? ('online' as ClassroomParticipationMode)
            : ('physical' as ClassroomParticipationMode),
        remarks: '',
      };
      return {
        student_id: student.student_id,
        enrollment_id: student.enrollment_id,
        attendance_status: draft.attendance_status,
        participation_mode:
          draft.attendance_status === 'present' || draft.attendance_status === 'late'
            ? draft.participation_mode
            : null,
        remarks: draft.remarks.trim() || null,
      };
    });

    try {
      await markAttendance({ sessionId: selectedSessionId, records }).unwrap();
      toast.success(`Saved attendance for ${records.length} student(s).`);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to save attendance');
    }
  };

  if (overviewLoading) {
    return (
      <PageContainer data-testid="teacher-classroom-page">
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading Teacher Hybrid Classroom cockpit...
        </div>
      </PageContainer>
    );
  }

  if (overviewError || !overview) {
    return (
      <PageContainer data-testid="teacher-classroom-page">
        <Card className="p-8 text-center space-y-3 rounded-2xl">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <div className="text-base font-bold">Teacher Profile Required</div>
          <p className="text-sm text-muted-foreground">
            Your user account must be linked to an active faculty/staff record to manage classroom
            sessions.
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
    <PageContainer data-testid="teacher-classroom-page">
      <PageHeader
        title="Hybrid Classroom Delivery"
        description={`${overview.teacher.full_name} • Plan and conduct physical, online, and hybrid sessions, toggle flipped classroom lessons, and record live attendance.`}
        badge={
          <Badge variant="outline" className="gap-1.5 font-semibold">
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            Teacher Workspace
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
              <RefreshCw className={cn('w-4 h-4', sessionsFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateForm((v) => !v)}
              className="gap-1.5 rounded-xl"
              disabled={!overview.assignments.length}
            >
              <Plus className="w-4 h-4" />
              {showCreateForm ? 'Close Form' : 'Schedule Session'}
            </Button>
          </div>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          {
            label: 'Assigned Classes',
            value: overview.kpis.assigned_classes_count,
            tone: 'text-foreground',
          },
          { label: 'Live Now', value: overview.kpis.live_sessions_count, tone: 'text-emerald-600' },
          { label: 'Today', value: overview.kpis.today_sessions_count, tone: 'text-sky-600' },
          {
            label: 'Upcoming',
            value: overview.kpis.upcoming_sessions_count,
            tone: 'text-indigo-600',
          },
          {
            label: 'Completed',
            value: overview.kpis.completed_sessions_count,
            tone: 'text-slate-600',
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4 rounded-2xl border-slate-200/80 dark:border-border">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </div>
            <div className={cn('text-2xl font-black mt-1', kpi.tone)}>{kpi.value}</div>
          </Card>
        ))}
      </div>

      {/* Create Session Panel */}
      {showCreateForm && (
        <Card className="p-6 rounded-2xl border-primary/25 shadow-sm">
          <div className="text-base font-bold mb-4">Schedule New Classroom Session</div>
          <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Assigned Class & Subject *
              </label>
              <select
                value={facultyAssignmentId}
                onChange={(e) => {
                  setFacultyAssignmentId(e.target.value);
                  setLessonPlanId('');
                }}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
              >
                {overview.assignments.map((a) => (
                  <option key={a.faculty_assignment_id} value={a.faculty_assignment_id}>
                    {a.grade_name} • Sec {a.section_name} — {a.subject_name} ({a.subject_code}) [
                    {a.academic_year_name}]
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Session Date *</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Start Time *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">End Time *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Delivery Mode *</label>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value as ClassroomDeliveryMode)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
              >
                <option value="physical">Physical (In-Person)</option>
                <option value="online">Online (Virtual)</option>
                <option value="hybrid">Hybrid (In-Person + Online)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Teaching Approach *
              </label>
              <select
                value={teachingApproach}
                onChange={(e) => setTeachingApproach(e.target.value as ClassroomTeachingApproach)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
              >
                <option value="traditional">Traditional</option>
                <option value="flipped">Flipped Classroom</option>
              </select>
            </div>

            {deliveryMode !== 'online' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Physical Classroom *
                </label>
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
                >
                  <option value="">Select classroom...</option>
                  {overview.classrooms.map((room) => (
                    <option key={room.classroom_id} value={room.classroom_id}>
                      {room.room_name} ({room.room_code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {deliveryMode !== 'physical' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Meeting Link (https://) *
                </label>
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.example.edu/class-room"
                  required
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Linked Lesson Plan (Optional)
              </label>
              <select
                value={lessonPlanId}
                onChange={(e) => setLessonPlanId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
              >
                <option value="">None</option>
                {matchingLessonPlans.map((lp) => (
                  <option key={lp.lesson_plan_id} value={lp.lesson_plan_id}>
                    {lp.lesson_title} ({lp.teaching_approach})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Topics Covered / Planned Agenda
              </label>
              <input
                type="text"
                value={topicsCovered}
                onChange={(e) => setTopicsCovered(e.target.value)}
                placeholder="Key topics for today's class..."
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Teacher Remarks</label>
              <input
                type="text"
                value={teacherRemarks}
                onChange={(e) => setTeacherRemarks(e.target.value)}
                placeholder="Optional preparation notes"
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
              />
            </div>

            <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="rounded-xl">
                {creating ? 'Scheduling...' : 'Create Classroom Session'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Split Grid: Sessions List + Live Session Detail / Attendance Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={cn('space-y-4', selectedSessionId ? 'lg:col-span-5' : 'lg:col-span-12')}>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'live', 'today', 'upcoming', 'past'] as const).map((view) => (
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

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-xl border border-input bg-background text-xs"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">Live (In Progress)</option>
              <option value="completed">Completed</option>
              <option value="not_conducted">Not Conducted</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => {
                setModeFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-xl border border-input bg-background text-xs"
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
              placeholder="Search subject, section, topic..."
              className="h-9 px-3 rounded-xl border border-input bg-background text-xs flex-1 min-w-[160px]"
            />
          </div>

          {/* Session Cards */}
          {sessions.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground rounded-2xl">
              No classroom sessions found matching the selected filters.
            </Card>
          ) : (
            <div
              className={cn(
                'grid gap-3',
                selectedSessionId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2',
              )}
            >
              {sessions.map((session) => {
                const isSelected = session.session_id === selectedSessionId;
                return (
                  <Card
                    key={session.session_id}
                    onClick={() => setSelectedSessionId(session.session_id)}
                    className={cn(
                      'p-4 rounded-2xl cursor-pointer transition border hover:border-primary/50 space-y-3',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/15'
                        : 'border-slate-200/80 dark:border-border',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-foreground">
                          {session.subject_name}{' '}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({session.subject_code})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.grade_name} • Sec {session.section_name}
                        </div>
                      </div>
                      <SessionStatusBadge status={session.session_status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <DeliveryModeBadge mode={session.delivery_mode} />
                      <TeachingApproachBadge approach={session.teaching_approach} />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {session.session_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {session.scheduled_start_time.slice(0, 5)} –{' '}
                        {session.scheduled_end_time.slice(0, 5)}
                      </span>
                      {session.attendance_summary && (
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          {session.attendance_summary.marked_count}/
                          {session.attendance_summary.enrolled_count} marked
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {sessionsData && sessionsData.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
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

        {/* Detail + Live Control + Attendance Panel */}
        {selectedSessionId && (
          <div className="lg:col-span-7 space-y-4">
            {detailFetching && !sessionDetail ? (
              <Card className="p-8 text-center text-sm text-muted-foreground rounded-2xl">
                Loading session workspace...
              </Card>
            ) : sessionDetail ? (
              <Card className="p-5 rounded-2xl border-slate-200/80 dark:border-border space-y-5">
                {/* Header & Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black">{sessionDetail.session.subject_name}</h2>
                      <SessionStatusBadge status={sessionDetail.session.session_status} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sessionDetail.session.grade_name} • Section{' '}
                      {sessionDetail.session.section_name} • {sessionDetail.session.session_date} (
                      {sessionDetail.session.scheduled_start_time.slice(0, 5)} –{' '}
                      {sessionDetail.session.scheduled_end_time.slice(0, 5)})
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <DeliveryModeBadge mode={sessionDetail.session.delivery_mode} />
                      <TeachingApproachBadge approach={sessionDetail.session.teaching_approach} />
                      {sessionDetail.capabilities.can_edit_metadata && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={updating}
                          onClick={() => handleQuickApproachToggle(sessionDetail.session)}
                          className="h-6 px-2 text-xs"
                        >
                          Switch Approach
                        </Button>
                      )}
                      {sessionDetail.session.classroom_name && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {sessionDetail.session.classroom_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {sessionDetail.session.meeting_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            sessionDetail.session.meeting_url!,
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                        className="gap-1.5 rounded-xl"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Meet
                      </Button>
                    )}

                    {sessionDetail.capabilities.can_start && (
                      <Button
                        size="sm"
                        disabled={starting}
                        onClick={() => handleStartSession(sessionDetail.session.session_id)}
                        className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {starting ? 'Starting...' : 'Start Class'}
                      </Button>
                    )}

                    {sessionDetail.capabilities.can_complete && (
                      <Button
                        size="sm"
                        disabled={completing}
                        onClick={() => handleCompleteSession(sessionDetail.session.session_id)}
                        className="gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <Square className="w-3.5 h-3.5" />
                        {completing ? 'Completing...' : 'Complete Class'}
                      </Button>
                    )}

                    {sessionDetail.capabilities.can_cancel && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cancelling}
                        onClick={() => handleCancelSession(sessionDetail.session.session_id)}
                        className="gap-1 text-rose-600 rounded-xl"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </Button>
                    )}

                    {sessionDetail.capabilities.can_mark_not_conducted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowNotConductedBox((v) => !v)}
                        className="rounded-xl text-amber-700"
                      >
                        Not Conducted
                      </Button>
                    )}
                  </div>
                </div>

                {showNotConductedBox && sessionDetail.capabilities.can_mark_not_conducted && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl space-y-2">
                    <label className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Reason for Marking Session Not Conducted *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={notConductedReason}
                        onChange={(e) => setNotConductedReason(e.target.value)}
                        placeholder="e.g., Faculty on medical leave / school event"
                        className="flex-1 h-9 px-3 rounded-lg border border-amber-300 bg-background text-sm"
                      />
                      <Button
                        size="sm"
                        disabled={markingNotConducted}
                        onClick={() => handleNotConducted(sessionDetail.session.session_id)}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                )}

                {sessionDetail.capabilities.can_complete && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Topics Covered (Saved when completing session)
                    </label>
                    <input
                      type="text"
                      value={completeTopics}
                      onChange={(e) => setCompleteTopics(e.target.value)}
                      placeholder="Summarize concepts taught during this live session..."
                      className="w-full h-9 px-3 rounded-xl border border-input bg-background text-sm"
                    />
                  </div>
                )}

                {/* Detail Sub-tabs */}
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Button
                    size="sm"
                    variant={detailTab === 'attendance' ? 'default' : 'ghost'}
                    onClick={() => setDetailTab('attendance')}
                    className="gap-1.5 rounded-xl"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Roster & Attendance ({sessionDetail.roster.length})
                  </Button>
                  {(sessionDetail.session.teaching_approach === 'flipped' ||
                    sessionDetail.flipped_preparation) && (
                    <Button
                      size="sm"
                      variant={detailTab === 'flipped' ? 'default' : 'ghost'}
                      onClick={() => setDetailTab('flipped')}
                      className="gap-1.5 rounded-xl text-amber-700 dark:text-amber-400"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Flipped Preparation
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={detailTab === 'audit' ? 'default' : 'ghost'}
                    onClick={() => setDetailTab('audit')}
                    className="gap-1.5 rounded-xl"
                  >
                    <History className="w-4 h-4" />
                    Audit Trail
                  </Button>
                </div>

                {detailTab === 'attendance' && (
                  <div className="space-y-3">
                    {!sessionDetail.capabilities.can_edit_attendance ? (
                      <div className="p-3 bg-muted/60 border border-border rounded-xl flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>
                          {sessionDetail.capabilities.attendance_lock_reason} (Enforced at both
                          application and PostgreSQL trigger layers).
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 p-3 rounded-xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                            Quick Fill:
                          </span>
                          {sessionDetail.session.delivery_mode !== 'online' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => applyBulkPresent('physical')}
                              className="h-7 text-xs"
                            >
                              All Present (Physical)
                            </Button>
                          )}
                          {sessionDetail.session.delivery_mode !== 'physical' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => applyBulkPresent('online')}
                              className="h-7 text-xs"
                            >
                              All Present (Online)
                            </Button>
                          )}
                        </div>

                        <Button
                          size="sm"
                          disabled={savingAttendance || sessionDetail.roster.length === 0}
                          onClick={handleSaveAttendance}
                          className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {savingAttendance ? 'Saving...' : 'Save Attendance'}
                        </Button>
                      </div>
                    )}

                    <div className="overflow-x-auto border border-border rounded-xl">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="text-left p-2.5">Roll</th>
                            <th className="text-left p-2.5">Student</th>
                            <th className="text-left p-2.5">Status</th>
                            <th className="text-left p-2.5">Participation</th>
                            <th className="text-left p-2.5">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {sessionDetail.roster.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                No actively enrolled students found for this section/date.
                              </td>
                            </tr>
                          ) : (
                            sessionDetail.roster.map((student) => {
                              const draft = attendanceDraft[student.student_id] || {
                                attendance_status: student.attendance_status || 'present',
                                participation_mode: student.participation_mode || null,
                                remarks: student.remarks || '',
                              };
                              const canEdit = sessionDetail.capabilities.can_edit_attendance;
                              const needsMode =
                                draft.attendance_status === 'present' ||
                                draft.attendance_status === 'late';
                              return (
                                <tr key={student.student_id}>
                                  <td className="p-2.5 text-xs font-mono text-muted-foreground">
                                    {student.roll_number || '—'}
                                  </td>
                                  <td className="p-2.5">
                                    <div className="font-semibold text-xs">{student.full_name}</div>
                                    <div className="text-[11px] text-muted-foreground">
                                      {student.admission_no || student.student_id.slice(0, 8)}
                                    </div>
                                  </td>
                                  <td className="p-2.5">
                                    {canEdit ? (
                                      <select
                                        value={draft.attendance_status}
                                        onChange={(e) =>
                                          setStudentDraftStatus(
                                            student.student_id,
                                            e.target.value as ClassroomAttendanceStatus,
                                            sessionDetail.session.delivery_mode,
                                          )
                                        }
                                        className="h-8 px-2 rounded-lg border border-input bg-background text-xs"
                                      >
                                        <option value="present">Present</option>
                                        <option value="late">Late</option>
                                        <option value="absent">Absent</option>
                                        <option value="excused">Excused</option>
                                      </select>
                                    ) : (
                                      <AttendanceStatusBadge
                                        status={student.attendance_status}
                                        participationMode={student.participation_mode}
                                      />
                                    )}
                                  </td>
                                  <td className="p-2.5">
                                    {canEdit ? (
                                      needsMode ? (
                                        <select
                                          value={draft.participation_mode || 'physical'}
                                          disabled={
                                            sessionDetail.session.delivery_mode !== 'hybrid'
                                          }
                                          onChange={(e) =>
                                            setAttendanceDraft((prev) => ({
                                              ...prev,
                                              [student.student_id]: {
                                                ...draft,
                                                participation_mode: e.target
                                                  .value as ClassroomParticipationMode,
                                              },
                                            }))
                                          }
                                          className="h-8 px-2 rounded-lg border border-input bg-background text-xs disabled:opacity-60"
                                        >
                                          {sessionDetail.session.delivery_mode !== 'online' && (
                                            <option value="physical">Physical</option>
                                          )}
                                          {sessionDetail.session.delivery_mode !== 'physical' && (
                                            <option value="online">Online</option>
                                          )}
                                        </select>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">N/A</span>
                                      )
                                    ) : (
                                      <span className="text-xs capitalize text-muted-foreground">
                                        {student.participation_mode || '—'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5">
                                    {canEdit ? (
                                      <input
                                        type="text"
                                        value={draft.remarks}
                                        onChange={(e) =>
                                          setAttendanceDraft((prev) => ({
                                            ...prev,
                                            [student.student_id]: {
                                              ...draft,
                                              remarks: e.target.value,
                                            },
                                          }))
                                        }
                                        placeholder="Note..."
                                        className="h-8 px-2 rounded-lg border border-input bg-background text-xs w-full min-w-[110px]"
                                      />
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        {student.remarks || '—'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {detailTab === 'flipped' && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {sessionDetail.flipped_preparation ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-300/40 dark:border-amber-900/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-600" />
                              Flipped Lesson: {sessionDetail.flipped_preparation.lesson_title}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {sessionDetail.flipped_preparation.duration_minutes || 45} mins
                            </Badge>
                          </div>
                          {sessionDetail.flipped_preparation.unit_title && (
                            <div className="text-xs text-muted-foreground">
                              Curriculum Unit:{' '}
                              <strong>{sessionDetail.flipped_preparation.unit_title}</strong>{' '}
                              {sessionDetail.flipped_preparation.unit_code
                                ? `(${sessionDetail.flipped_preparation.unit_code})`
                                : ''}
                            </div>
                          )}
                          <div className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Pre-Class Preparation Deadline:{' '}
                            <strong>
                              {sessionDetail.flipped_preparation.preparation_deadline ||
                                `${sessionDetail.session.session_date} ${sessionDetail.session.scheduled_start_time.slice(0, 5)}`}
                            </strong>
                          </div>
                        </div>

                        {/* Instructions & Expectations */}
                        {(sessionDetail.flipped_preparation.lesson_summary ||
                          sessionDetail.flipped_preparation.prerequisite_knowledge) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs">
                            {sessionDetail.flipped_preparation.lesson_summary && (
                              <div className="space-y-1">
                                <span className="font-semibold text-foreground flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5 text-primary" /> Preparation
                                  Instructions
                                </span>
                                <p className="text-muted-foreground whitespace-pre-line">
                                  {sessionDetail.flipped_preparation.lesson_summary}
                                </p>
                              </div>
                            )}
                            {sessionDetail.flipped_preparation.prerequisite_knowledge && (
                              <div className="space-y-1">
                                <span className="font-semibold text-foreground flex items-center gap-1">
                                  <BookOpen className="w-3.5 h-3.5 text-primary" /> Prerequisite
                                  Knowledge & Expectations
                                </span>
                                <p className="text-muted-foreground whitespace-pre-line">
                                  {sessionDetail.flipped_preparation.prerequisite_knowledge}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Assigned Pre-Class Resources */}
                        <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-primary" /> Pre-Class Learning
                            Resources ({sessionDetail.flipped_preparation.resources.length})
                          </div>
                          {sessionDetail.flipped_preparation.resources.length === 0 ? (
                            <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                              No learning resources attached to this lesson plan yet.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {sessionDetail.flipped_preparation.resources.map((res) => (
                                <div
                                  key={res.resource_id}
                                  className="p-3 rounded-xl border border-border bg-background flex items-start justify-between gap-2"
                                >
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] uppercase font-mono"
                                      >
                                        {res.resource_type}
                                      </Badge>
                                      <span className="text-xs font-semibold truncate">
                                        {res.title}
                                      </span>
                                    </div>
                                    {res.usage_notes && (
                                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                                        {res.usage_notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
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
                                        className="h-7 px-2 text-xs rounded-lg"
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
                          )}
                        </div>

                        {/* Pre-Class Preparation Questions */}
                        {sessionDetail.flipped_preparation.preparation_questions.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Pre-Class
                              Reflection & Questions (
                              {sessionDetail.flipped_preparation.preparation_questions.length})
                            </div>
                            <div className="space-y-1.5">
                              {sessionDetail.flipped_preparation.preparation_questions.map(
                                (q, idx) => (
                                  <div
                                    key={q.exit_ticket_id}
                                    className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-0.5"
                                  >
                                    <div className="font-medium text-foreground">
                                      <span className="font-bold text-amber-600 mr-1.5">
                                        Q{idx + 1}:
                                      </span>
                                      {q.prompt}
                                    </div>
                                    {q.expected_response_or_criteria && (
                                      <div className="text-[11px] text-muted-foreground pl-5">
                                        Criteria: {q.expected_response_or_criteria}
                                      </div>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {/* Target Learning Outcomes */}
                        {sessionDetail.flipped_preparation.outcomes.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <ListChecks className="w-3.5 h-3.5 text-primary" /> Target Learning
                              Outcomes
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {sessionDetail.flipped_preparation.outcomes.map((o) => (
                                <div
                                  key={o.learning_outcome_id}
                                  className="px-2 py-1 rounded-lg bg-background border border-border text-xs flex items-center gap-1.5"
                                >
                                  <Badge variant="outline" className="text-[10px] font-mono">
                                    {o.outcome_code}
                                  </Badge>
                                  <span className="text-muted-foreground text-[11px]">
                                    {o.outcome_statement}
                                  </span>
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

                        {/* In-Class Activities Schedule */}
                        {sessionDetail.flipped_preparation.in_class_activities.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-border/60">
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Radio className="w-3.5 h-3.5 text-emerald-600" /> In-Class Classroom
                              Activities (
                              {sessionDetail.flipped_preparation.in_class_activities.length})
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {sessionDetail.flipped_preparation.in_class_activities.map((act) => (
                                <div
                                  key={act.lesson_activity_id}
                                  className="p-2.5 rounded-xl border border-border bg-background text-xs space-y-0.5"
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
                                  <div className="font-semibold">{act.activity_title}</div>
                                  {act.activity_description && (
                                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                                      {act.activity_description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Preparation Monitoring */}
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5">
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-primary" /> Flipped Preparation
                            Monitoring
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                            <div className="p-2 rounded-lg bg-background border border-border">
                              <div className="text-sm font-bold">{sessionDetail.roster.length}</div>
                              <div className="text-[10px] text-muted-foreground">
                                Assigned Students
                              </div>
                            </div>
                            <div className="p-2 rounded-lg bg-background border border-border">
                              <div className="text-sm font-bold text-emerald-600">
                                {sessionDetail.session.attendance_summary?.present_count || 0}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Session Present
                              </div>
                            </div>
                            <div className="p-2 rounded-lg bg-background border border-border">
                              <div className="text-sm font-bold text-rose-600">
                                {sessionDetail.session.attendance_summary?.absent_count || 0}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Session Absent
                              </div>
                            </div>
                            <div className="p-2 rounded-lg bg-background border border-border">
                              <div className="text-sm font-bold text-indigo-600">
                                {sessionDetail.session.delivery_mode.toUpperCase()}
                              </div>
                              <div className="text-[10px] text-muted-foreground">Delivery Mode</div>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground pt-1">
                            Student pre-class resource review is self-directed. Live attendance is
                            conducted and verified during the classroom session.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-border space-y-2">
                        <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                        <div className="font-semibold text-sm">No Lesson Plan Linked</div>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          This session does not currently have a linked lesson plan. Edit this
                          session to link an approved lesson plan with pre-class resources and
                          activities.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'audit' && (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {!auditData || auditData.items.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No audit events recorded yet.
                      </div>
                    ) : (
                      auditData.items.map((entry) => (
                        <div
                          key={entry.audit_id}
                          className="p-3 rounded-xl border border-border text-xs space-y-1 bg-muted/20"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold">
                              {entry.entity_type} • {entry.action}
                            </span>
                            <span className="text-muted-foreground">
                              {entry.actor_name} • {new Date(entry.occurred_at).toLocaleString()}
                            </span>
                          </div>
                          {entry.new_values && (
                            <div className="text-[11px] text-muted-foreground font-mono truncate">
                              status=
                              {entry.new_values.session_status ||
                                entry.new_values.attendance_status ||
                                'updated'}
                              {entry.new_values.participation_mode
                                ? `, mode=${entry.new_values.participation_mode}`
                                : ''}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default TeacherClassroomPage;
