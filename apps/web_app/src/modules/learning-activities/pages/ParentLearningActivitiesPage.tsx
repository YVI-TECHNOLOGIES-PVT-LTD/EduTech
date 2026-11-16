import React, { useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useParentSelectedChild } from '@/modules/parent/hooks/useParentSelectedChild';
import { ParentChildSelectorBar } from '@/modules/parent/components/ParentChildSelectorBar';
import {
  ParentErrorState,
  ParentLoadingSkeleton,
  ParentNoChildrenState,
} from '@/modules/parent/components/ParentStates';
import {
  ActivityQueryParams,
  LearningActivityType,
  useGetParentChildFileDownloadUrlMutation,
  useGetParentChildLearningActivitiesQuery,
  useGetParentChildLearningActivityDetailQuery,
  useGetParentChildLearningOverviewQuery,
} from '@/shared/api/learningActivities.api';
import {
  ActivityStatusBadge,
  ActivitySubtypeBadge,
  ActivityTypeBadge,
  SubmissionStatusBadge,
  formatDateTimeShort,
} from '../components/LearningActivityBadges';
import { BookOpen, CheckCircle2, Download, Lock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const ParentLearningActivitiesPage: React.FC = () => {
  const {
    children,
    selectedChildId,
    selectChild,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useParentSelectedChild();

  const [typeFilter, setTypeFilter] = useState<LearningActivityType | ''>('');
  const [viewFilter, setViewFilter] = useState<ActivityQueryParams['view']>('all');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const {
    data: overview,
    isLoading: overviewLoading,
    isFetching: overviewFetching,
    refetch: refetchOverview,
  } = useGetParentChildLearningOverviewQuery(selectedChildId || '', {
    skip: !selectedChildId,
  });

  const {
    data: activitiesPage,
    isFetching: activitiesFetching,
    refetch: refetchActivities,
  } = useGetParentChildLearningActivitiesQuery(
    {
      childId: selectedChildId || '',
      params: {
        activity_type: typeFilter || undefined,
        view: viewFilter,
        page,
        limit: 12,
      },
    },
    { skip: !selectedChildId },
  );

  const { data: detailData, isFetching: detailLoading } =
    useGetParentChildLearningActivityDetailQuery(
      { childId: selectedChildId || '', activityId: selectedActivityId || '' },
      { skip: !selectedChildId || !selectedActivityId },
    );

  const [getChildFileUrl] = useGetParentChildFileDownloadUrlMutation();

  const handleDownloadChildFile = async (fileId: string) => {
    if (!selectedChildId) return;
    try {
      const res = await getChildFileUrl({ childId: selectedChildId, fileId }).unwrap();
      window.open(res.download_url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to download child submission attachment.');
    }
  };

  if (isListLoading) {
    return (
      <PageContainer>
        <ParentLoadingSkeleton />
      </PageContainer>
    );
  }

  if (isListError) {
    return (
      <PageContainer>
        <ParentErrorState onRetry={refetchList} />
      </PageContainer>
    );
  }

  if (!children || children.length === 0) {
    return (
      <PageContainer>
        <ParentNoChildrenState />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Learning Activities & Homework"
        description="Monitor your child's assigned homework, project deadlines, submission progress, marks, and teacher feedback."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-slate-300 text-slate-600">
              <Lock className="mr-1 h-3 w-3" />
              Read-Only Parent View
            </Badge>
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
          </div>
        }
      />

      <ParentChildSelectorBar
        childrenList={children}
        selectedChildId={selectedChildId}
        onSelectChild={(id) => {
          selectChild(id);
          setSelectedActivityId(null);
          setPage(1);
        }}
      />

      {/* Per-Child KPI Summary */}
      <div className="mt-4 mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
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
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Submitted</p>
          <p className="mt-1 text-2xl font-bold text-sky-700">{overview?.submitted_count ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Resubmission Needed</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {overview?.resubmission_requested_count ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Reviewed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {overview?.reviewed_count ?? 0}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4 flex flex-wrap items-center gap-3 p-3">
        <select
          value={viewFilter || 'all'}
          onChange={(e) => {
            setViewFilter(e.target.value as any);
            setPage(1);
          }}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All Activities</option>
          <option value="pending">Pending Submissions</option>
          <option value="submitted">Submitted</option>
          <option value="resubmission_requested">Resubmission Requested</option>
          <option value="reviewed">Reviewed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as any);
            setPage(1);
          }}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Homework & Projects</option>
          <option value="project">Digital Projects Only</option>
          <option value="homework">Homework Only</option>
        </select>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          {overviewLoading || (activitiesFetching && !activitiesPage?.items?.length) ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Loading child activities...
            </Card>
          ) : !activitiesPage?.items?.length ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No published learning activities found for{' '}
              {overview?.child?.full_name || 'this child'}.
            </Card>
          ) : (
            activitiesPage.items.map((act) => (
              <Card
                key={act.activity_id}
                onClick={() => setSelectedActivityId(act.activity_id)}
                className={`cursor-pointer p-4 transition-colors hover:border-primary ${
                  selectedActivityId === act.activity_id ? 'border-primary ring-1 ring-primary' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <ActivitySubtypeBadge subtype={act.activity_subtype || act.activity_type} />
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

        <div className="lg:col-span-5">
          {!selectedActivityId ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-50" />
              Select any activity on the left to review instructions, submission history, marks, and
              teacher feedback.
            </Card>
          ) : detailLoading || overviewFetching || !detailData?.activity ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Loading activity details...
            </Card>
          ) : (
            <Card className="space-y-4 p-5">
              <div>
                <div className="flex flex-wrap gap-2">
                  <ActivitySubtypeBadge
                    subtype={
                      detailData.activity.activity_subtype || detailData.activity.activity_type
                    }
                  />
                  <ActivityStatusBadge status={detailData.activity.activity_status} />
                </div>
                <h2 className="mt-2 text-lg font-semibold">{detailData.activity.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {detailData.activity.subject_name} · Teacher: {detailData.activity.teacher_name}
                </p>
              </div>

              <div className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                {detailData.activity.instructions}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  Due: <strong>{formatDateTimeShort(detailData.activity.due_at)}</strong>
                </div>
                {detailData.activity.grading_enabled &&
                  detailData.activity.maximum_marks !== null && (
                    <div>
                      Maximum Marks: <strong>{detailData.activity.maximum_marks}</strong>
                    </div>
                  )}
              </div>

              {detailData.attempts.length > 0 ? (
                <div className="space-y-3 border-t pt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Submission Attempts ({detailData.attempts.length})
                  </h4>
                  {detailData.attempts.map((sub) => (
                    <div key={sub.submission_id} className="rounded-md border p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">Attempt #{sub.attempt_number}</span>
                        <div className="flex items-center gap-1.5">
                          <SubmissionStatusBadge status={sub.submission_status} />
                          {sub.is_late && <Badge variant="destructive">Late</Badge>}
                        </div>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        Submitted: {formatDateTimeShort(sub.submitted_at)}
                      </p>
                      {sub.files.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {sub.files.map((f) => (
                            <Button
                              key={f.submission_file_id}
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleDownloadChildFile(f.submission_file_id)}
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
                                : 'Teacher Evaluation'}
                            </span>
                            {sub.latest_review.obtained_marks !== null && (
                              <span>
                                Marks: {sub.latest_review.obtained_marks}
                                {detailData.activity.maximum_marks !== null
                                  ? ` / ${detailData.activity.maximum_marks}`
                                  : ''}
                              </span>
                            )}
                          </div>
                          {sub.latest_review.feedback && (
                            <p className="mt-1 text-emerald-950">{sub.latest_review.feedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {detailData.activity.activity_type === 'homework'
                    ? 'Homework tasks are completed offline without digital file uploads.'
                    : 'No digital submission uploaded yet by the student.'}
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default ParentLearningActivitiesPage;
