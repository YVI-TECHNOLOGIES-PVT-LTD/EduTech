import React, { useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useParentSelectedChild } from '@/modules/parent/hooks/useParentSelectedChild';
import {
  ParentErrorState,
  ParentLoadingSkeleton,
  ParentNoChildrenState,
} from '@/modules/parent/components/ParentStates';
import {
  SessionListQuery,
  useGetParentChildClassroomAttendanceQuery,
  useGetParentChildClassroomOverviewQuery,
  useGetParentChildClassroomSessionsQuery,
} from '@/shared/api/classroom.api';
import {
  AttendanceStatusBadge,
  AttendanceSummaryCards,
  DeliveryModeBadge,
  SessionStatusBadge,
  TeachingApproachBadge,
} from '../components/ClassroomBadges';
import { Calendar, Clock, Lock, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ParentClassroomPage: React.FC = () => {
  const {
    children,
    selectedChildId,
    selectChild,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useParentSelectedChild();

  const [tab, setTab] = useState<'sessions' | 'attendance'>('sessions');
  const [viewFilter, setViewFilter] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');
  const [page, setPage] = useState(1);

  const {
    data: overview,
    isLoading: overviewLoading,
    isFetching: overviewFetching,
    refetch: refetchOverview,
  } = useGetParentChildClassroomOverviewQuery(selectedChildId || '', {
    skip: !selectedChildId,
  });

  const sessionQuery: { childId: string; params?: SessionListQuery } = {
    childId: selectedChildId || '',
    params: { view: viewFilter, page, limit: 12 },
  };

  const { data: sessionsData, refetch: refetchSessions } = useGetParentChildClassroomSessionsQuery(
    sessionQuery,
    { skip: !selectedChildId },
  );

  const { data: attendanceData, refetch: refetchAttendance } =
    useGetParentChildClassroomAttendanceQuery(
      { childId: selectedChildId || '', page: 1, limit: 30 },
      { skip: !selectedChildId },
    );

  const handleRefresh = () => {
    refetchList();
    if (selectedChildId) {
      refetchOverview();
      refetchSessions();
      refetchAttendance();
    }
  };

  if (isListLoading) {
    return (
      <PageContainer data-testid="parent-classroom-page">
        <ParentLoadingSkeleton />
      </PageContainer>
    );
  }

  if (isListError) {
    return (
      <PageContainer data-testid="parent-classroom-page">
        <ParentErrorState onRetry={refetchList} />
      </PageContainer>
    );
  }

  if (!children.length) {
    return (
      <PageContainer data-testid="parent-classroom-page">
        <ParentNoChildrenState />
      </PageContainer>
    );
  }

  const sessions = sessionsData?.items || [];

  return (
    <PageContainer data-testid="parent-classroom-page">
      <PageHeader
        title="Child Classroom & Attendance"
        description="Read-only monitoring of your child's physical, online, and hybrid classroom sessions and verified attendance."
        badge={
          <Badge variant="outline" className="gap-1.5 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Read-Only Parent View
          </Badge>
        }
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
            <RefreshCw className={cn('w-4 h-4', overviewFetching && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {overviewLoading || !overview ? (
        <ParentLoadingSkeleton />
      ) : (
        <>
          <AttendanceSummaryCards summary={overview.attendance_summary} />

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={tab === 'sessions' ? 'default' : 'ghost'}
                onClick={() => setTab('sessions')}
                className="rounded-xl"
              >
                Classroom Sessions
              </Button>
              <Button
                size="sm"
                variant={tab === 'attendance' ? 'default' : 'ghost'}
                onClick={() => setTab('attendance')}
                className="rounded-xl"
              >
                Attendance History
              </Button>
            </div>

            {tab === 'sessions' && (
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
            )}
          </div>

          {tab === 'sessions' && (
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <Card className="p-10 text-center rounded-2xl text-sm text-muted-foreground">
                  No classroom sessions scheduled for this child in the selected view.
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map((session) => (
                    <Card
                      key={session.session_id}
                      className="p-5 rounded-2xl border-slate-200/80 dark:border-border space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-bold">
                            {session.subject_name}{' '}
                            <span className="text-xs font-medium text-muted-foreground">
                              ({session.subject_code})
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Teacher:{' '}
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
                        {session.topics_covered && (
                          <div className="col-span-2">
                            Topics:{' '}
                            <span className="text-foreground">{session.topics_covered}</span>
                          </div>
                        )}
                        {session.not_conducted_reason && (
                          <div className="col-span-2 text-amber-700">
                            Not Conducted Reason: {session.not_conducted_reason}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          Student session join links are restricted to the enrolled student portal.
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'attendance' && (
            <Card className="rounded-2xl overflow-hidden border-slate-200/80 dark:border-border">
              <div className="p-4 border-b border-border font-bold text-sm">
                Verified Classroom Attendance History
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Date & Time</th>
                      <th className="text-left p-3">Subject</th>
                      <th className="text-left p-3">Teacher</th>
                      <th className="text-left p-3">Delivery Mode</th>
                      <th className="text-left p-3">Status & Mode</th>
                      <th className="text-left p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {!attendanceData || attendanceData.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No attendance entries recorded yet for this child.
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
                          <td className="p-3 text-xs text-muted-foreground">
                            {row.remarks || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default ParentClassroomPage;
