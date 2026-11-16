import React, { useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LearningActivityStatus,
  LearningActivityType,
  useCloseDueAdminActivitiesMutation,
  useGetAdminFileDownloadUrlMutation,
  useGetAdminLearningActivitiesQuery,
  useGetAdminLearningActivityDetailQuery,
  useGetAdminLearningFiltersQuery,
  useGetAdminLearningOverviewQuery,
} from '@/shared/api/learningActivities.api';
import {
  ActivityStatusBadge,
  ActivitySubtypeBadge,
  ActivityTypeBadge,
  SubmissionStatusBadge,
  formatDateTimeShort,
} from '../components/LearningActivityBadges';
import { Clock, Download, Eye, History, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const AdminLearningActivitiesPage: React.FC = () => {
  const [academicYearId, setAcademicYearId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [activityType, setActivityType] = useState<LearningActivityType | ''>('');
  const [activityStatus, setActivityStatus] = useState<LearningActivityStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const { data: overview, refetch: refetchOverview } = useGetAdminLearningOverviewQuery();
  const { data: filtersData } = useGetAdminLearningFiltersQuery();
  const {
    data: activitiesPage,
    isFetching,
    refetch: refetchActivities,
  } = useGetAdminLearningActivitiesQuery({
    academic_year_id: academicYearId || undefined,
    section_id: sectionId || undefined,
    activity_type: activityType || undefined,
    activity_status: activityStatus || undefined,
    search: search.trim() || undefined,
    page,
    limit: 15,
  });

  const { data: detailData, isFetching: detailFetching } = useGetAdminLearningActivityDetailQuery(
    selectedActivityId || '',
    { skip: !selectedActivityId },
  );

  const [closeDue, { isLoading: closingDue }] = useCloseDueAdminActivitiesMutation();
  const [getDownloadUrl] = useGetAdminFileDownloadUrlMutation();

  const handleCloseDue = async () => {
    try {
      const res = await closeDue().unwrap();
      toast.success(`Closed ${res.closed_count} overdue published activity(s).`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to close overdue activities.');
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      const res = await getDownloadUrl(fileId).unwrap();
      window.open(res.download_url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to generate download link.');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Learning Activities Oversight"
        description="Institution-wide monitoring of teacher homework/projects, submission completion rates, overdue activities, and review status."
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
            <Button size="sm" disabled={closingDue} onClick={handleCloseDue}>
              <Clock className="mr-1.5 h-4 w-4" />
              Close Overdue ({overview?.overdue_published_count ?? 0})
            </Button>
          </div>
        }
      />

      {/* Institutional KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Activities</p>
          <p className="mt-1 text-2xl font-bold">{overview?.total_activities ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Published</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {overview?.published_count ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Overdue Active</p>
          <p className="mt-1 text-2xl font-bold text-rose-700">
            {overview?.overdue_published_count ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Submissions</p>
          <p className="mt-1 text-2xl font-bold">{overview?.total_submissions ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Pending Reviews</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">
            {overview?.pending_reviews_count ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Late Attempts</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {overview?.late_submissions_count ?? 0}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search activity title or subject..."
          className="h-9 min-w-[200px] flex-1 rounded-md border px-3 text-sm"
        />
        <select
          value={academicYearId}
          onChange={(e) => {
            setAcademicYearId(e.target.value);
            setSectionId('');
            setPage(1);
          }}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All Academic Years</option>
          {(filtersData?.academic_years || []).map((ay: any) => (
            <option key={ay.academic_year_id} value={ay.academic_year_id}>
              {ay.academic_year_name}
            </option>
          ))}
        </select>
        <select
          value={sectionId}
          onChange={(e) => {
            setSectionId(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All Sections</option>
          {(filtersData?.sections || [])
            .filter((s: any) => !academicYearId || s.academic_year_id === academicYearId)
            .map((sec: any) => (
              <option key={sec.section_id} value={sec.section_id}>
                {sec.grade_name} - {sec.section_name}
              </option>
            ))}
        </select>
        <select
          value={activityType}
          onChange={(e) => {
            setActivityType(e.target.value as any);
            setPage(1);
          }}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All Types</option>
          <option value="project">Project</option>
          <option value="homework">Homework</option>
        </select>
        <select
          value={activityStatus}
          onChange={(e) => {
            setActivityStatus(e.target.value as any);
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

      {/* Oversight Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Class & Subject</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Submissions</th>
              <th className="px-4 py-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isFetching && !activitiesPage?.items?.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading institutional activities...
                </td>
              </tr>
            ) : !activitiesPage?.items?.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No activities found matching these filters.
                </td>
              </tr>
            ) : (
              activitiesPage.items.map((act) => (
                <tr key={act.activity_id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-medium">{act.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <ActivitySubtypeBadge subtype={act.activity_subtype || act.activity_type} />
                      <ActivityStatusBadge status={act.activity_status} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-medium">
                      {act.grade_name} - {act.section_name}
                    </div>
                    <div className="text-muted-foreground">{act.subject_name}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{act.teacher_name}</td>
                  <td className="px-4 py-3 text-xs">{formatDateTimeShort(act.due_at)}</td>
                  <td className="px-4 py-3 text-xs">
                    {act.activity_type === 'project' ? (
                      <span>
                        {act.submitted_students_count}/{act.total_enrolled_students} submitted ·{' '}
                        {act.reviewed_submissions_count} reviewed
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Offline Homework</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedActivityId(act.activity_id)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Details
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Oversight Detail Drawer / Modal */}
      {selectedActivityId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[85vh] w-full max-w-3xl overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">
                  {detailData?.activity?.title || 'Activity Inspection'}
                </h3>
                {detailData?.activity && (
                  <p className="text-xs text-muted-foreground">
                    {detailData.activity.grade_name} {detailData.activity.section_name} ·{' '}
                    {detailData.activity.subject_name} · Teacher: {detailData.activity.teacher_name}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedActivityId(null)}>
                Close
              </Button>
            </div>

            {detailFetching ? (
              <p className="text-sm text-muted-foreground">Loading oversight details...</p>
            ) : (
              detailData && (
                <>
                  <div className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                    {detailData.activity.instructions}
                  </div>

                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Student Submissions ({detailData.submissions.length})
                    </h4>
                    <div className="space-y-2">
                      {detailData.submissions.map((sub) => (
                        <div key={sub.submission_id} className="rounded-md border p-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold">
                              {sub.student_name} (Attempt #{sub.attempt_number})
                            </span>
                            <div className="flex items-center gap-1.5">
                              <SubmissionStatusBadge status={sub.submission_status} />
                              {sub.is_late && <Badge variant="destructive">Late</Badge>}
                            </div>
                          </div>
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
                        </div>
                      ))}
                      {detailData.submissions.length === 0 && (
                        <p className="text-xs text-muted-foreground">No submissions recorded.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <History className="h-3.5 w-3.5" />
                      Audit History ({detailData.audit.length})
                    </h4>
                    <div className="space-y-1.5">
                      {detailData.audit.map((a) => (
                        <div
                          key={a.audit_id}
                          className="flex items-center justify-between rounded border px-3 py-2 text-xs"
                        >
                          <span>
                            <strong className="uppercase">{a.action}</strong> by{' '}
                            {a.actor_name || a.actor_staff_id || 'System'}
                          </span>
                          <span className="text-muted-foreground">
                            {formatDateTimeShort(a.occurred_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )
            )}
          </Card>
        </div>
      )}
    </PageContainer>
  );
};

export default AdminLearningActivitiesPage;
