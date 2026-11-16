import React, { useMemo, useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LearningActivityDto,
  LearningActivityStatus,
  LearningActivityType,
  LearningReviewDecision,
  LearningSubmissionStatus,
  TeacherSubmissionItemDto,
  useCloseDueTeacherActivitiesMutation,
  useCloseTeacherLearningActivityMutation,
  useCreateTeacherLearningActivityMutation,
  useExtendTeacherLearningLateDeadlineMutation,
  useGetTeacherFileDownloadUrlMutation,
  useGetTeacherLearningActivitiesQuery,
  useGetTeacherLearningActivityAuditQuery,
  useGetTeacherLearningActivityDetailQuery,
  useGetTeacherLearningAssignmentsQuery,
  useGetTeacherLearningOverviewQuery,
  useGetTeacherLearningSubmissionsQuery,
  usePublishTeacherLearningActivityMutation,
  useReviewTeacherSubmissionMutation,
  useStartTeacherSubmissionReviewMutation,
  useUpdateTeacherLearningActivityMutation,
} from '@/shared/api/learningActivities.api';
import {
  ActivityStatusBadge,
  ActivitySubtypeBadge,
  ActivityTypeBadge,
  SubmissionStatusBadge,
  formatDateTimeShort,
  formatFileSize,
} from '../components/LearningActivityBadges';
import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Edit3,
  FileCode,
  FileText,
  History,
  Lock,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

type TeacherTab = 'activities' | 'submissions' | 'create';

function toLocalDateTimeInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const TeacherLearningActivitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('activities');
  const [typeFilter, setTypeFilter] = useState<LearningActivityType | ''>('');
  const [subtypeFilter, setSubtypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<LearningActivityStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<LearningActivityDto | null>(null);
  const [auditActivityId, setAuditActivityId] = useState<string | null>(null);

  // Submission filters
  const [subStatusFilter, setSubStatusFilter] = useState<LearningSubmissionStatus | ''>('');
  const [reviewTarget, setReviewTarget] = useState<TeacherSubmissionItemDto | null>(null);
  const [reviewDecision, setReviewDecision] = useState<LearningReviewDecision>('reviewed');
  const [obtainedMarks, setObtainedMarks] = useState<string>('');
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [resubmitUntil, setResubmitUntil] = useState<string>(() => {
    const d = new Date(Date.now() + 72 * 3600 * 1000);
    return toLocalDateTimeInput(d.toISOString());
  });

  // Late extension modal state
  const [lateExtendTarget, setLateExtendTarget] = useState<LearningActivityDto | null>(null);
  const [lateExtendInput, setLateExtendInput] = useState<string>('');

  // Form state for create / edit
  const [facultyAssignmentId, setFacultyAssignmentId] = useState<string>('');
  const [lessonPlanId, setLessonPlanId] = useState<string>('');
  const [activityType, setActivityType] = useState<LearningActivityType>('project');
  const [activitySubtype, setActivitySubtype] = useState<string>('project');
  // Coding Lab form fields
  const [codingLang, setCodingLang] = useState<string>('python');
  const [codingProblem, setCodingProblem] = useState<string>('');
  const [codingInputFmt, setCodingInputFmt] = useState<string>('');
  const [codingOutputFmt, setCodingOutputFmt] = useState<string>('');
  const [codingConstraints, setCodingConstraints] = useState<string>('');
  const [codingSampleInput, setCodingSampleInput] = useState<string>('');
  const [codingSampleOutput, setCodingSampleOutput] = useState<string>('');
  const [codingStarterCode, setCodingStarterCode] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [dueAtInput, setDueAtInput] = useState<string>(() => {
    const d = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    return toLocalDateTimeInput(d.toISOString());
  });
  const [lateUntilInput, setLateUntilInput] = useState<string>('');
  const [gradingEnabled, setGradingEnabled] = useState<boolean>(true);
  const [maximumMarks, setMaximumMarks] = useState<string>('20');
  const [publishImmediately, setPublishImmediately] = useState<boolean>(true);

  const { data: overview, refetch: refetchOverview } = useGetTeacherLearningOverviewQuery();
  const { data: assignments = [] } = useGetTeacherLearningAssignmentsQuery();
  const {
    data: activitiesPage,
    isFetching: activitiesFetching,
    refetch: refetchActivities,
  } = useGetTeacherLearningActivitiesQuery({
    activity_type: typeFilter || undefined,
    activity_subtype: (subtypeFilter as any) || undefined,
    activity_status: statusFilter || undefined,
    search: search.trim() || undefined,
    page,
    limit: 12,
  });

  const { data: submissionsPage, isFetching: submissionsFetching } =
    useGetTeacherLearningSubmissionsQuery({
      activity_id: selectedActivityId || undefined,
      submission_status: subStatusFilter || undefined,
      page: 1,
      limit: 50,
    });

  const { data: detailData } = useGetTeacherLearningActivityDetailQuery(selectedActivityId || '', {
    skip: !selectedActivityId,
  });

  const { data: auditRows = [] } = useGetTeacherLearningActivityAuditQuery(auditActivityId || '', {
    skip: !auditActivityId,
  });

  const [createActivity, { isLoading: creating }] = useCreateTeacherLearningActivityMutation();
  const [updateActivity, { isLoading: updating }] = useUpdateTeacherLearningActivityMutation();
  const [publishActivity] = usePublishTeacherLearningActivityMutation();
  const [closeActivity] = useCloseTeacherLearningActivityMutation();
  const [extendLate] = useExtendTeacherLearningLateDeadlineMutation();
  const [closeDue, { isLoading: closingDue }] = useCloseDueTeacherActivitiesMutation();
  const [startReview] = useStartTeacherSubmissionReviewMutation();
  const [submitReview, { isLoading: submittingReview }] = useReviewTeacherSubmissionMutation();
  const [getDownloadUrl] = useGetTeacherFileDownloadUrlMutation();

  const selectedAssignment = useMemo(
    () =>
      assignments.find((a) => a.faculty_assignment_id === facultyAssignmentId) || assignments[0],
    [assignments, facultyAssignmentId],
  );

  const resetForm = () => {
    setEditingActivity(null);
    setFacultyAssignmentId(assignments[0]?.faculty_assignment_id || '');
    setLessonPlanId('');
    setActivityType('project');
    setActivitySubtype('project');
    setCodingLang('python');
    setCodingProblem('');
    setCodingInputFmt('');
    setCodingOutputFmt('');
    setCodingConstraints('');
    setCodingSampleInput('');
    setCodingSampleOutput('');
    setCodingStarterCode('');
    setTitle('');
    setInstructions('');
    setDueAtInput(toLocalDateTimeInput(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()));
    setLateUntilInput('');
    setGradingEnabled(true);
    setMaximumMarks('20');
    setPublishImmediately(true);
  };

  const beginEdit = (act: LearningActivityDto) => {
    setEditingActivity(act);
    setFacultyAssignmentId(act.faculty_assignment_id);
    setLessonPlanId(act.lesson_plan_id || '');
    setActivityType(act.activity_type);
    setActivitySubtype(act.activity_subtype || act.activity_type);
    if (act.coding_lab_config) {
      setCodingLang(act.coding_lab_config.language || 'python');
      setCodingProblem(act.coding_lab_config.problem_statement || '');
      setCodingInputFmt(act.coding_lab_config.input_format || '');
      setCodingOutputFmt(act.coding_lab_config.output_format || '');
      setCodingConstraints(act.coding_lab_config.constraints || '');
      setCodingSampleInput(act.coding_lab_config.sample_input || '');
      setCodingSampleOutput(act.coding_lab_config.sample_output || '');
      setCodingStarterCode(act.coding_lab_config.starter_code || '');
    }
    setTitle(act.title);
    setInstructions(act.instructions);
    setDueAtInput(toLocalDateTimeInput(act.due_at));
    setLateUntilInput(toLocalDateTimeInput(act.late_submission_authorized_until));
    setGradingEnabled(act.grading_enabled);
    setMaximumMarks(act.maximum_marks !== null ? String(act.maximum_marks) : '');
    setPublishImmediately(false);
    setActiveTab('create');
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveAssignmentId = facultyAssignmentId || assignments[0]?.faculty_assignment_id;
    if (!effectiveAssignmentId && !editingActivity) {
      toast.error('You need an active section-subject assignment to create an activity.');
      return;
    }
    if (!dueAtInput) {
      toast.error('Please specify a due date & time.');
      return;
    }

    const dueIso = new Date(dueAtInput).toISOString();
    const lateIso = lateUntilInput ? new Date(lateUntilInput).toISOString() : null;
    const baseActivityType: LearningActivityType =
      activitySubtype === 'homework' ? 'homework' : 'project';
    const codingLabConfig =
      activitySubtype === 'coding_lab'
        ? {
            language: codingLang,
            problem_statement: codingProblem || undefined,
            input_format: codingInputFmt || undefined,
            output_format: codingOutputFmt || undefined,
            constraints: codingConstraints || undefined,
            sample_input: codingSampleInput || undefined,
            sample_output: codingSampleOutput || undefined,
            starter_code: codingStarterCode || undefined,
          }
        : undefined;

    try {
      if (editingActivity) {
        await updateActivity({
          activityId: editingActivity.activity_id,
          body: {
            lesson_plan_id: lessonPlanId || null,
            activity_type: baseActivityType,
            activity_subtype: activitySubtype as any,
            coding_lab_config: codingLabConfig,
            title: title.trim(),
            instructions: instructions.trim(),
            due_at: dueIso,
            late_submission_authorized_until: lateIso,
            grading_enabled: gradingEnabled,
            maximum_marks: gradingEnabled ? Number(maximumMarks) : null,
          },
        }).unwrap();
        toast.success('Learning activity updated.');
      } else {
        await createActivity({
          faculty_assignment_id: effectiveAssignmentId,
          lesson_plan_id: lessonPlanId || null,
          activity_type: baseActivityType,
          activity_subtype: activitySubtype as any,
          coding_lab_config: codingLabConfig,
          title: title.trim(),
          instructions: instructions.trim(),
          due_at: dueIso,
          late_submission_authorized_until: lateIso,
          grading_enabled: gradingEnabled,
          maximum_marks: gradingEnabled ? Number(maximumMarks) : null,
          publish_immediately: publishImmediately,
        }).unwrap();
        toast.success(
          publishImmediately
            ? 'Learning activity created and published to students & parents.'
            : 'Draft learning activity created.',
        );
      }
      resetForm();
      setActiveTab('activities');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Could not save activity.');
    }
  };

  const handlePublish = async (activityId: string) => {
    try {
      await publishActivity(activityId).unwrap();
      toast.success('Activity published! Students & parents have been notified.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to publish activity.');
    }
  };

  const handleClose = async (activityId: string) => {
    try {
      await closeActivity({ activityId, closure_reason: 'Closed by teacher' }).unwrap();
      toast.success('Activity closed.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to close activity.');
    }
  };

  const handleCloseDue = async () => {
    try {
      const res = await closeDue().unwrap();
      toast.success(`Closed ${res.closed_count} overdue published activity(s).`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Could not close overdue activities.');
    }
  };

  const handleSaveLateExtension = async () => {
    if (!lateExtendTarget) return;
    try {
      await extendLate({
        activityId: lateExtendTarget.activity_id,
        late_submission_authorized_until: lateExtendInput
          ? new Date(lateExtendInput).toISOString()
          : null,
      }).unwrap();
      toast.success('Late submission authorization updated.');
      setLateExtendTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update late deadline.');
    }
  };

  const openReviewModal = (sub: TeacherSubmissionItemDto) => {
    setReviewTarget(sub);
    setReviewDecision('reviewed');
    setObtainedMarks(
      sub.latest_review?.obtained_marks !== null && sub.latest_review?.obtained_marks !== undefined
        ? String(sub.latest_review.obtained_marks)
        : '',
    );
    setReviewFeedback(sub.latest_review?.feedback || '');
    setResubmitUntil(toLocalDateTimeInput(new Date(Date.now() + 72 * 3600 * 1000).toISOString()));
    if (sub.submission_status === 'submitted') {
      startReview(sub.submission_id).catch(() => {});
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;

    try {
      await submitReview({
        submissionId: reviewTarget.submission_id,
        body: {
          review_decision: reviewDecision,
          obtained_marks:
            reviewTarget.grading_enabled && obtainedMarks.trim() !== ''
              ? Number(obtainedMarks)
              : null,
          feedback: reviewFeedback.trim() || null,
          resubmission_allowed_until:
            reviewDecision === 'resubmission_requested' && resubmitUntil
              ? new Date(resubmitUntil).toISOString()
              : null,
        },
      }).unwrap();
      toast.success(
        reviewDecision === 'resubmission_requested'
          ? 'Resubmission requested and student notified.'
          : 'Submission evaluated and feedback shared.',
      );
      setReviewTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save review.');
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      const res = await getDownloadUrl(fileId).unwrap();
      window.open(res.download_url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to generate secure file download link.');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Learning Activities & Submissions"
        description="Assign homework and digital projects, review uploaded project work, record marks & feedback, and manage deadlines."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchOverview();
                refetchActivities();
              }}
            >
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" disabled={closingDue} onClick={handleCloseDue}>
              <Clock className="mr-1.5 h-4 w-4" />
              Close Due Activities
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setActiveTab('create');
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Activity
            </Button>
          </div>
        }
      />

      {/* Overview KPI Strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Activities</p>
          <p className="mt-1 text-2xl font-bold">{overview?.total_activities ?? 0}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {overview?.project_count ?? 0} projects · {overview?.homework_count ?? 0} homework
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Published</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {overview?.published_count ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Visible to students & parents</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Drafts</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{overview?.draft_count ?? 0}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Awaiting publish</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Pending Reviews</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">
            {overview?.pending_reviews_count ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Submitted / Under Review</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Resubmissions Requested</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {overview?.resubmissions_requested_count ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Awaiting student re-upload</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-3">
        <Button
          variant={activeTab === 'activities' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('activities')}
        >
          <BookOpenCheck className="mr-1.5 h-4 w-4" />
          My Activities ({activitiesPage?.total ?? 0})
        </Button>
        <Button
          variant={activeTab === 'submissions' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('submissions')}
        >
          <ClipboardCheck className="mr-1.5 h-4 w-4" />
          Submissions & Reviews ({overview?.pending_reviews_count ?? 0} pending)
        </Button>
        <Button
          variant={activeTab === 'create' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('create')}
        >
          <Sparkles className="mr-1.5 h-4 w-4" />
          {editingActivity ? 'Edit Activity' : 'Create Activity'}
        </Button>
      </div>

      {/* TAB 1: ACTIVITIES LIST */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center gap-3 p-4">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search title, instructions, subject..."
              className="h-9 min-w-[220px] flex-1 rounded-md border px-3 text-sm"
            />
            <select
              value={subtypeFilter}
              onChange={(e) => {
                setSubtypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">All Formats & Subtypes</option>
              <option value="homework">Homework (Offline Practice)</option>
              <option value="project">Digital Project</option>
              <option value="coding_lab">Coding Lab</option>
              <option value="video_submission">Video Presentation</option>
              <option value="audio_submission">Audio Submission</option>
              <option value="quiz">Gamified Quiz</option>
              <option value="peer_learning">Peer Learning</option>
              <option value="collaborative">Collaborative Project</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </Card>

          {activitiesFetching && !activitiesPage?.items?.length ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Loading activities...
            </Card>
          ) : !activitiesPage?.items?.length ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No activities match the selected filters. Create a homework or project task to get
              started.
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activitiesPage.items.map((act) => (
                <Card key={act.activity_id} className="flex flex-col justify-between p-5">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <ActivitySubtypeBadge subtype={act.activity_subtype || act.activity_type} />
                        <ActivityStatusBadge status={act.activity_status} />
                        {act.grading_enabled && act.maximum_marks !== null && (
                          <Badge variant="secondary">Max {act.maximum_marks} marks</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {act.grade_name} · {act.section_name}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold">{act.title}</h3>
                    <p className="text-xs font-medium text-indigo-700">{act.subject_name}</p>
                    {act.lesson_title && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Lesson Plan: {act.lesson_title}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {act.instructions}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Due: {formatDateTimeShort(act.due_at)}</span>
                      {act.late_submission_authorized_until && (
                        <span className="text-amber-700">
                          Late window: {formatDateTimeShort(act.late_submission_authorized_until)}
                        </span>
                      )}
                    </div>
                    {act.activity_type === 'project' && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <span>
                          Submitted: <strong>{act.submitted_students_count}</strong> /{' '}
                          {act.total_enrolled_students}
                        </span>
                        <span className="text-indigo-700">
                          Pending Review: <strong>{act.pending_review_count}</strong>
                        </span>
                        <span className="text-emerald-700">
                          Reviewed: <strong>{act.reviewed_submissions_count}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                    {act.activity_status === 'draft' && (
                      <Button size="sm" onClick={() => handlePublish(act.activity_id)}>
                        <Send className="mr-1 h-3.5 w-3.5" />
                        Publish
                      </Button>
                    )}
                    {act.activity_status === 'published' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClose(act.activity_id)}
                      >
                        <Lock className="mr-1 h-3.5 w-3.5" />
                        Close
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => beginEdit(act)}>
                      <Edit3 className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {act.activity_type === 'project' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedActivityId(act.activity_id);
                            setActiveTab('submissions');
                          }}
                        >
                          <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
                          Submissions ({act.submitted_students_count})
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setLateExtendTarget(act);
                            setLateExtendInput(
                              toLocalDateTimeInput(
                                act.late_submission_authorized_until ||
                                  new Date(Date.parse(act.due_at) + 48 * 3600 * 1000).toISOString(),
                              ),
                            );
                          }}
                        >
                          <CalendarClock className="mr-1 h-3.5 w-3.5" />
                          Late Window
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAuditActivityId(act.activity_id)}
                    >
                      <History className="mr-1 h-3.5 w-3.5" />
                      Audit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activitiesPage && activitiesPage.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Page {activitiesPage.page} of {activitiesPage.total_pages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= activitiesPage.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBMISSIONS & REVIEWS */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center gap-3 p-4">
            {selectedActivityId && detailData?.activity && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Activity: {detailData.activity.title}</Badge>
                <Button size="sm" variant="ghost" onClick={() => setSelectedActivityId(null)}>
                  Show All Activities
                </Button>
              </div>
            )}
            <select
              value={subStatusFilter}
              onChange={(e) => setSubStatusFilter(e.target.value as any)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">All Submission Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="resubmission_requested">Resubmission Requested</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </Card>

          {submissionsFetching ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Loading submissions...
            </Card>
          ) : !submissionsPage?.items?.length ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No project submissions found matching the current filter.
            </Card>
          ) : (
            <div className="space-y-3">
              {submissionsPage.items.map((sub) => (
                <Card key={sub.submission_id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{sub.student_name}</h4>
                        {sub.admission_no && (
                          <span className="text-xs text-muted-foreground">
                            ({sub.admission_no})
                          </span>
                        )}
                        <Badge variant="outline">Attempt #{sub.attempt_number}</Badge>
                        <SubmissionStatusBadge status={sub.submission_status} />
                        {sub.is_late && (
                          <Badge variant="destructive" className="text-xs">
                            Late
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sub.activity_title} · {sub.subject_name} ({sub.grade_name} -{' '}
                        {sub.section_name}) · Submitted {formatDateTimeShort(sub.submitted_at)}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openReviewModal(sub)}>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      {sub.submission_status === 'reviewed' ? 'Add Updated Review' : 'Evaluate'}
                    </Button>
                  </div>

                  {sub.text_content && (
                    <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                      {sub.text_content}
                    </div>
                  )}

                  {sub.files.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sub.files.map((file) => (
                        <Button
                          key={file.submission_file_id}
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadFile(file.submission_file_id)}
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          {file.original_file_name} ({formatFileSize(file.file_size_bytes)})
                        </Button>
                      ))}
                    </div>
                  )}

                  {sub.latest_review && (
                    <div className="mt-3 rounded-md border bg-emerald-50/50 p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 font-medium">
                        <span>
                          Latest Review ({sub.latest_review.review_decision}) by{' '}
                          {sub.latest_review.reviewer_name}
                        </span>
                        {sub.latest_review.obtained_marks !== null && (
                          <span className="text-emerald-800">
                            Marks: {sub.latest_review.obtained_marks}
                            {sub.maximum_marks !== null ? ` / ${sub.maximum_marks}` : ''}
                          </span>
                        )}
                      </div>
                      {sub.latest_review.feedback && (
                        <p className="mt-1 text-muted-foreground">{sub.latest_review.feedback}</p>
                      )}
                      {sub.latest_review.resubmission_allowed_until && (
                        <p className="mt-1 text-amber-800">
                          Resubmission permitted until:{' '}
                          {formatDateTimeShort(sub.latest_review.resubmission_allowed_until)}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREATE OR EDIT FORM */}
      {activeTab === 'create' && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {editingActivity ? `Edit: ${editingActivity.title}` : 'Create Learning Activity'}
          </h3>
          <form onSubmit={handleSaveActivity} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Class & Subject Assignment</label>
                <select
                  disabled={Boolean(editingActivity)}
                  value={facultyAssignmentId || selectedAssignment?.faculty_assignment_id || ''}
                  onChange={(e) => {
                    setFacultyAssignmentId(e.target.value);
                    setLessonPlanId('');
                  }}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {assignments.map((a) => (
                    <option key={a.faculty_assignment_id} value={a.faculty_assignment_id}>
                      {a.grade_name} {a.section_name} — {a.subject_name} ({a.academic_year_name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Delivery Format & Activity Subtype
                </label>
                <select
                  value={activitySubtype}
                  onChange={(e) => {
                    const val = e.target.value;
                    setActivitySubtype(val);
                    setActivityType(val === 'homework' ? 'homework' : 'project');
                  }}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="homework">Homework (Offline Practice — Zero Upload)</option>
                  <option value="project">Digital Project (Document / File Upload)</option>
                  <option value="coding_lab">Coding Lab (Programming Problem & Code Editor)</option>
                  <option value="video_submission">Video Presentation (MP4/WebM &le; 10 MB)</option>
                  <option value="audio_submission">
                    Audio Submission (Voice / Speech &le; 10 MB)
                  </option>
                  <option value="quiz">Gamified Quiz (MCQ & Instant Feedback)</option>
                  <option value="peer_learning">Peer Learning (Pair Exercise & Reflection)</option>
                  <option value="collaborative">
                    Collaborative Project (Team Roles & Shared Scope)
                  </option>
                </select>
              </div>
            </div>

            {selectedAssignment && selectedAssignment.lesson_plans.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Linked Lesson Plan (Optional)
                </label>
                <select
                  value={lessonPlanId}
                  onChange={(e) => setLessonPlanId(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {selectedAssignment.lesson_plans.map((lp) => (
                    <option key={lp.lesson_plan_id} value={lp.lesson_plan_id}>
                      {lp.lesson_title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Solar System Scale Model Project"
                className="h-10 w-full rounded-md border px-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Instructions</label>
              <textarea
                required
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Detailed steps, expected outcomes, and submission guidelines..."
                className="w-full rounded-md border p-3 text-sm"
              />
            </div>

            {activitySubtype === 'coding_lab' && (
              <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-indigo-950 dark:text-indigo-200">
                  <FileCode className="h-4 w-4" />
                  Coding Lab Specifications
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Programming Language</label>
                    <select
                      value={codingLang}
                      onChange={(e) => setCodingLang(e.target.value)}
                      className="h-9 w-full rounded-md border bg-background px-3 text-xs"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="sql">SQL</option>
                      <option value="html">HTML / Web</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Constraints</label>
                    <input
                      type="text"
                      value={codingConstraints}
                      onChange={(e) => setCodingConstraints(e.target.value)}
                      placeholder="e.g. 1 <= N <= 10^5, Time Limit: 2.0s"
                      className="h-9 w-full rounded-md border bg-background px-3 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">Problem Statement</label>
                  <textarea
                    rows={3}
                    value={codingProblem}
                    onChange={(e) => setCodingProblem(e.target.value)}
                    placeholder="Describe the programming problem, input/output requirements, and edge cases..."
                    className="w-full rounded-md border bg-background p-2.5 text-xs font-mono"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Sample Input</label>
                    <textarea
                      rows={2}
                      value={codingSampleInput}
                      onChange={(e) => setCodingSampleInput(e.target.value)}
                      placeholder="e.g. 5\n1 2 3 4 5"
                      className="w-full rounded-md border bg-background p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Sample Expected Output</label>
                    <textarea
                      rows={2}
                      value={codingSampleOutput}
                      onChange={(e) => setCodingSampleOutput(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full rounded-md border bg-background p-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">Starter Code (Template)</label>
                  <textarea
                    rows={4}
                    value={codingStarterCode}
                    onChange={(e) => setCodingStarterCode(e.target.value)}
                    placeholder={`def solve():\n    # Write your solution here\n    pass`}
                    className="w-full rounded-md border bg-background p-2.5 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Due Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={dueAtInput}
                  onChange={(e) => setDueAtInput(e.target.value)}
                  className="h-10 w-full rounded-md border px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Late Submission Extended Until (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={lateUntilInput}
                  onChange={(e) => setLateUntilInput(e.target.value)}
                  className="h-10 w-full rounded-md border px-3 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 rounded-md border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={gradingEnabled}
                  onChange={(e) => setGradingEnabled(e.target.checked)}
                />
                Enable Numerical Grading
              </label>
              {gradingEnabled && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium">Maximum Marks:</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={maximumMarks}
                    onChange={(e) => setMaximumMarks(e.target.value)}
                    className="h-9 w-28 rounded-md border px-2 text-sm"
                  />
                </div>
              )}
              {!editingActivity && (
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                  />
                  Publish immediately to students & parents
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setActiveTab('activities');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating || updating}>
                {editingActivity ? 'Save Changes' : 'Create Activity'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* REVIEW SUBMISSION MODAL */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold">Evaluate Submission</h3>
            <p className="text-xs text-muted-foreground">
              {reviewTarget.student_name} — Attempt #{reviewTarget.attempt_number} ·{' '}
              {reviewTarget.activity_title}
            </p>
            <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium">Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value as LearningReviewDecision)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="reviewed">Mark Reviewed</option>
                  <option value="resubmission_requested">Request Resubmission</option>
                </select>
              </div>

              {reviewTarget.grading_enabled && (
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Obtained Marks (Max {reviewTarget.maximum_marks ?? 'N/A'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={reviewTarget.maximum_marks ?? undefined}
                    step="0.5"
                    value={obtainedMarks}
                    onChange={(e) => setObtainedMarks(e.target.value)}
                    className="h-10 w-full rounded-md border px-3 text-sm"
                  />
                </div>
              )}

              {reviewDecision === 'resubmission_requested' && (
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Resubmission Permitted Until
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={resubmitUntil}
                    onChange={(e) => setResubmitUntil(e.target.value)}
                    className="h-10 w-full rounded-md border px-3 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium">Teacher Feedback</label>
                <textarea
                  rows={4}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Constructive evaluation notes for the student and parent..."
                  className="w-full rounded-md border p-3 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setReviewTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingReview}>
                  Submit Review
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* LATE WINDOW MODAL */}
      {lateExtendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-base font-semibold">Authorize Late Submission</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {lateExtendTarget.title} (Due {formatDateTimeShort(lateExtendTarget.due_at)})
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium">
                Late Submission Cutoff (Leave empty to clear)
              </label>
              <input
                type="datetime-local"
                value={lateExtendInput}
                onChange={(e) => setLateExtendInput(e.target.value)}
                className="h-10 w-full rounded-md border px-3 text-sm"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLateExtendTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLateExtension}>Save</Button>
            </div>
          </Card>
        </div>
      )}

      {/* AUDIT HISTORY MODAL */}
      {auditActivityId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[80vh] w-full max-w-xl overflow-y-auto p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <FileText className="h-4 w-4" />
                Activity Audit Trail
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setAuditActivityId(null)}>
                Close
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {auditRows.map((row) => (
                <div key={row.audit_id} className="rounded-md border p-3 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="uppercase">{row.action}</span>
                    <span>{formatDateTimeShort(row.occurred_at)}</span>
                  </div>
                  <p className="mt-0.5 text-muted-foreground">
                    Actor: {row.actor_name || row.actor_staff_id || 'System'}
                  </p>
                </div>
              ))}
              {auditRows.length === 0 && (
                <p className="text-xs text-muted-foreground">No audit entries recorded yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};

export default TeacherLearningActivitiesPage;
