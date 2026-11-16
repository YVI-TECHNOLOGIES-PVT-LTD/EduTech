import React, { useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ActivityQueryParams,
  LearningActivityDto,
  useGetStudentFileDownloadUrlMutation,
  useGetStudentLearningActivitiesQuery,
  useGetStudentLearningActivityDetailQuery,
  useGetStudentLearningOverviewQuery,
  useSubmitStudentProjectMutation,
} from '@/shared/api/learningActivities.api';
import {
  ActivityStatusBadge,
  ActivitySubtypeBadge,
  ActivityTypeBadge,
  SubmissionStatusBadge,
  formatDateTimeShort,
  formatFileSize,
} from '../components/LearningActivityBadges';
import { AudioRecorder } from '../components/AudioRecorder';
import { CodingWorkspace } from '../components/CodingWorkspace';
import { GamifiedQuizView } from '../components/GamifiedQuizView';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Code,
  Download,
  FileUp,
  Film,
  Headphones,
  HelpCircle,
  Info,
  Mic,
  Music,
  RefreshCw,
  Send,
  Share2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type StudentViewTab = 'all' | 'pending' | 'submitted' | 'resubmission_requested' | 'reviewed';

export const StudentLearningActivitiesPage: React.FC = () => {
  const [viewTab, setViewTab] = useState<StudentViewTab>('all');
  const [typeFilter, setTypeFilter] = useState<'homework' | 'project' | ''>('');
  const [subtypeFilter, setSubtypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // Submission composer state
  const [textContent, setTextContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { data: overview, refetch: refetchOverview } = useGetStudentLearningOverviewQuery();

  const queryParams: ActivityQueryParams = {
    view: viewTab,
    activity_type: typeFilter || undefined,
    activity_subtype: (subtypeFilter as any) || undefined,
    search: search.trim() || undefined,
    page,
    limit: 12,
  };

  const {
    data: activitiesPage,
    isFetching,
    refetch: refetchList,
  } = useGetStudentLearningActivitiesQuery(queryParams);

  const { data: detailData, isFetching: detailLoading } = useGetStudentLearningActivityDetailQuery(
    selectedActivityId || '',
    {
      skip: !selectedActivityId,
    },
  );

  const [submitProject, { isLoading: submitting }] = useSubmitStudentProjectMutation();
  const [getDownloadUrl] = useGetStudentFileDownloadUrlMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    const merged = [...selectedFiles, ...incoming].slice(0, 5);
    if (selectedFiles.length + incoming.length > 5) {
      toast.warning('Maximum 5 files are allowed per submission attempt.');
    }
    setSelectedFiles(merged);
    e.target.value = '';
  };

  const handleSubmitProject = async (e: React.FormEvent, activity: LearningActivityDto) => {
    e.preventDefault();
    if (!textContent.trim() && selectedFiles.length === 0) {
      toast.error('Please enter your response text or attach at least one file.');
      return;
    }

    const formData = new FormData();
    if (textContent.trim()) {
      formData.append('text_content', textContent.trim());
    }
    for (const file of selectedFiles) {
      formData.append('files', file);
    }

    try {
      await submitProject({ activityId: activity.activity_id, formData }).unwrap();
      toast.success('Project submission uploaded successfully!');
      setTextContent('');
      setSelectedFiles([]);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Could not submit project attempt.');
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      const res = await getDownloadUrl(fileId).unwrap();
      window.open(res.download_url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to generate download URL.');
    }
  };

  const selectedActivity = detailData?.activity || null;
  const attempts = detailData?.attempts || [];

  return (
    <PageContainer>
      <PageHeader
        title="My Learning Activities"
        description="View homework instructions, upload project submissions, track attempts, and review teacher marks & feedback."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchOverview();
              refetchList();
            }}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Student Overview KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Assigned</p>
          <p className="mt-1 text-2xl font-bold">{overview?.total_assigned ?? 0}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {overview?.project_count ?? 0} projects · {overview?.homework_count ?? 0} homework
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Pending Projects</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">
            {overview?.pending_projects_count ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Open for digital upload</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Submitted</p>
          <p className="mt-1 text-2xl font-bold text-sky-700">
            {(overview?.submitted_count ?? 0) + (overview?.under_review_count ?? 0)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Awaiting teacher review</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Resubmissions</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {overview?.resubmission_requested_count ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Action required</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Reviewed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {overview?.reviewed_count ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Feedback ready</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['pending', 'Pending'],
              ['submitted', 'Submitted'],
              ['resubmission_requested', 'Resubmission Needed'],
              ['reviewed', 'Reviewed'],
            ] as Array<[StudentViewTab, string]>
          ).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={viewTab === key ? 'default' : 'outline'}
              onClick={() => {
                setViewTab(key);
                setPage(1);
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search activities..."
            className="h-9 rounded-md border px-3 text-sm"
          />
          <select
            value={subtypeFilter}
            onChange={(e) => {
              setSubtypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All Formats & Activities</option>
            <option value="homework">Homework (Offline)</option>
            <option value="project">Digital Projects</option>
            <option value="coding_lab">Coding Labs</option>
            <option value="video_submission">Video Submissions</option>
            <option value="audio_submission">Audio Submissions</option>
            <option value="quiz">Gamified Quizzes</option>
            <option value="peer_learning">Peer Learning</option>
            <option value="collaborative">Collaborative Tasks</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: Activity Cards */}
        <div className="space-y-3 lg:col-span-7">
          {isFetching && !activitiesPage?.items?.length ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Loading your activities...
            </Card>
          ) : !activitiesPage?.items?.length ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No activities found in this view.
            </Card>
          ) : (
            activitiesPage.items.map((act) => (
              <Card
                key={act.activity_id}
                onClick={() => {
                  setSelectedActivityId(act.activity_id);
                  setTextContent('');
                  setSelectedFiles([]);
                }}
                className={`cursor-pointer p-4 transition-colors hover:border-primary ${
                  selectedActivityId === act.activity_id ? 'border-primary ring-1 ring-primary' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <ActivitySubtypeBadge subtype={act.activity_subtype} type={act.activity_type} />
                    <ActivityStatusBadge status={act.activity_status} />
                    <SubmissionStatusBadge
                      status={act.my_latest_submission?.submission_status}
                      activityType={act.activity_type}
                    />
                  </div>
                  <span className="text-xs font-medium text-indigo-700">{act.subject_name}</span>
                </div>
                <h3 className="mt-2 font-semibold">{act.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {act.instructions}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    Due: <strong>{formatDateTimeShort(act.due_at)}</strong>
                  </span>
                  {act.my_latest_submission?.latest_review?.obtained_marks !== null &&
                    act.my_latest_submission?.latest_review?.obtained_marks !== undefined && (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-800">
                        Marks: {act.my_latest_submission.latest_review.obtained_marks}
                        {act.maximum_marks !== null ? ` / ${act.maximum_marks}` : ''}
                      </Badge>
                    )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Right column: Selected Activity Detail + Project Submission Composer */}
        <div className="lg:col-span-5">
          {!selectedActivityId ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-50" />
              Select any homework or project activity on the left to view instructions, upload
              submissions, or check teacher feedback.
            </Card>
          ) : detailLoading || !selectedActivity ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Loading activity details...
            </Card>
          ) : (
            <Card className="p-5 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <ActivitySubtypeBadge
                    subtype={selectedActivity.activity_subtype}
                    type={selectedActivity.activity_type}
                  />
                  <ActivityStatusBadge status={selectedActivity.activity_status} />
                </div>
                <h2 className="mt-2 text-lg font-semibold">{selectedActivity.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedActivity.subject_name} · Teacher: {selectedActivity.teacher_name}
                </p>
                {selectedActivity.lesson_title && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Lesson: {selectedActivity.lesson_title}
                  </p>
                )}
              </div>

              <div className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                {selectedActivity.instructions}
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  Due Date: <strong>{formatDateTimeShort(selectedActivity.due_at)}</strong>
                </div>
                {selectedActivity.late_submission_authorized_until && (
                  <div className="text-amber-700">
                    Late Submission Window Until:{' '}
                    <strong>
                      {formatDateTimeShort(selectedActivity.late_submission_authorized_until)}
                    </strong>
                  </div>
                )}
                {selectedActivity.grading_enabled && selectedActivity.maximum_marks !== null && (
                  <div>
                    Grading Enabled: <strong>{selectedActivity.maximum_marks} marks max</strong>
                  </div>
                )}
              </div>

              {/* Homework Notice */}
              {selectedActivity.activity_type === 'homework' ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Homework tasks are completed offline as instructed by your teacher and do not
                    require digital submission uploads.
                  </span>
                </div>
              ) : selectedActivity.activity_subtype === 'coding_lab' ? (
                <CodingWorkspace
                  activityTitle={selectedActivity.title}
                  config={selectedActivity.coding_lab_config}
                  initialCode={attempts[0]?.text_content || ''}
                  isSubmitting={submitting}
                  canSubmit={selectedActivity.can_submit}
                  blockReason={selectedActivity.submission_block_reason}
                  onSubmitCode={async (codeText) => {
                    const formData = new FormData();
                    formData.append('text_content', codeText);
                    try {
                      await submitProject({
                        activityId: selectedActivity.activity_id,
                        formData,
                      }).unwrap();
                      toast.success('Coding solution submitted successfully!');
                    } catch (err: any) {
                      toast.error(
                        err?.data?.message || err?.message || 'Could not submit code solution.',
                      );
                    }
                  }}
                />
              ) : selectedActivity.activity_subtype === 'quiz' ? (
                <GamifiedQuizView
                  activityTitle={selectedActivity.title}
                  config={selectedActivity.quiz_config}
                  isSubmitting={submitting}
                  canSubmit={selectedActivity.can_submit}
                  blockReason={selectedActivity.submission_block_reason}
                  previousSubmissionText={attempts[0]?.text_content}
                  onSubmitQuiz={async (summary) => {
                    const formData = new FormData();
                    formData.append('text_content', summary);
                    try {
                      await submitProject({
                        activityId: selectedActivity.activity_id,
                        formData,
                      }).unwrap();
                    } catch (err: any) {
                      toast.error(
                        err?.data?.message || err?.message || 'Could not submit quiz answers.',
                      );
                      throw err;
                    }
                  }}
                />
              ) : (
                <>
                  {/* Digital Submission Composer (Projects, Video, Audio, Peer & Collaborative Tasks) */}
                  {selectedActivity.can_submit ? (
                    <form
                      onSubmit={(e) => handleSubmitProject(e, selectedActivity)}
                      className="space-y-3 rounded-md border p-4"
                    >
                      <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                        <FileUp className="h-4 w-4 text-indigo-600" />
                        {attempts.length > 0
                          ? `Submit Attempt #${attempts[0].attempt_number + 1}`
                          : selectedActivity.activity_subtype === 'video_submission'
                            ? 'Upload Video Presentation'
                            : selectedActivity.activity_subtype === 'audio_submission'
                              ? 'Record / Upload Audio Recording'
                              : 'Submit Project Work'}
                      </h4>

                      {/* In-Browser Audio Recording if Audio Submission subtype */}
                      {selectedActivity.activity_subtype === 'audio_submission' && (
                        <AudioRecorder
                          onRecordingReady={(recordedFile) => {
                            setSelectedFiles((prev) => [...prev, recordedFile].slice(0, 5));
                            toast.success(`Voice recording attached: ${recordedFile.name}`);
                          }}
                        />
                      )}

                      {/* Video instructions tip if Video Submission */}
                      {selectedActivity.activity_subtype === 'video_submission' && (
                        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-950">
                          <Film className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                          <div>
                            <span className="font-semibold">Video Submission Requirements:</span>
                            <p className="mt-0.5 text-rose-900">
                              Supported formats: MP4, WebM, MOV. Maximum file size: 10 MB per video
                              clip (PostgreSQL storage constraint). Ensure good lighting and clear
                              speech.
                            </p>
                          </div>
                        </div>
                      )}

                      <textarea
                        rows={3}
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder={
                          selectedActivity.activity_subtype === 'video_submission'
                            ? 'Optional video title, timestamps, or description notes...'
                            : selectedActivity.activity_subtype === 'audio_submission'
                              ? 'Optional spoken transcript notes or summary...'
                              : 'Write your notes, summary, code, or explanation...'
                        }
                        className="w-full rounded-md border p-2.5 text-sm"
                      />
                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Attachments (up to 5 files · PDF, Video, Audio, Code, Images · max 10MB
                          each)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,.mp3,.wav,.m4a,.txt,.py,.js,.ts,.java,.cpp,.html,.css,.json,.sql"
                          onChange={handleFileChange}
                          className="text-xs"
                        />
                        {selectedFiles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {selectedFiles.map((file, idx) => (
                              <div
                                key={`${file.name}-${idx}`}
                                className="flex items-center justify-between rounded bg-muted px-2 py-1 text-xs"
                              >
                                <span className="truncate">
                                  {file.name} ({formatFileSize(file.size)})
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button type="submit" size="sm" disabled={submitting} className="w-full">
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        {submitting ? 'Uploading Submission...' : 'Submit Attempt'}
                      </Button>
                    </form>
                  ) : (
                    <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {selectedActivity.submission_block_reason ||
                          'Submissions are not currently open for this activity.'}
                      </span>
                    </div>
                  )}

                  {/* Attempt History */}
                  {attempts.length > 0 && (
                    <div className="space-y-3 border-t pt-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Submission History ({attempts.length})
                      </h4>
                      {attempts.map((sub) => (
                        <div key={sub.submission_id} className="rounded-md border p-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold">Attempt #{sub.attempt_number}</span>
                            <div className="flex items-center gap-1.5">
                              <SubmissionStatusBadge status={sub.submission_status} />
                              {sub.is_late && <Badge variant="destructive">Late</Badge>}
                            </div>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            Submitted {formatDateTimeShort(sub.submitted_at)}
                          </p>
                          {sub.text_content && (
                            <p className="mt-2 whitespace-pre-wrap rounded bg-muted/40 p-2 text-foreground">
                              {sub.text_content}
                            </p>
                          )}
                          {sub.files.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {sub.files.map((f) => (
                                <Button
                                  key={f.submission_file_id}
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleDownloadFile(f.submission_file_id)}
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  {f.original_file_name}
                                </Button>
                              ))}
                            </div>
                          )}
                          {sub.latest_review && (
                            <div className="mt-2 rounded border border-emerald-200 bg-emerald-50/60 p-2">
                              <div className="flex items-center justify-between font-medium text-emerald-900">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {sub.latest_review.review_decision === 'resubmission_requested'
                                    ? 'Resubmission Requested'
                                    : 'Teacher Review'}
                                </span>
                                {sub.latest_review.obtained_marks !== null && (
                                  <span>
                                    Score: {sub.latest_review.obtained_marks}
                                    {selectedActivity.maximum_marks !== null
                                      ? ` / ${selectedActivity.maximum_marks}`
                                      : ''}
                                  </span>
                                )}
                              </div>
                              {sub.latest_review.feedback && (
                                <p className="mt-1 text-emerald-950">
                                  {sub.latest_review.feedback}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default StudentLearningActivitiesPage;
