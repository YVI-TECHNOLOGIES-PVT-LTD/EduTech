import React, { useEffect, useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useGenerateAdminClassroomSessionsMutation,
  useGetAdminClassroomAcademicYearsQuery,
  useGetAdminClassroomSessionsQuery,
} from '@/shared/api/classroom.api';
import {
  DeliveryModeBadge,
  SessionStatusBadge,
  TeachingApproachBadge,
} from '../components/ClassroomBadges';
import { Calendar, Clock, Lock, RefreshCw, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const AdminClassroomPage: React.FC = () => {
  const { data: years = [] } = useGetAdminClassroomAcademicYearsQuery();
  const [academicYearId, setAcademicYearId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [approachFilter, setApproachFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (years.length && !academicYearId) {
      const preferred = years.find((y: any) => y.has_published_timetable) || years[0];
      setAcademicYearId(preferred.academic_year_id);
    }
  }, [years, academicYearId]);

  const {
    data: sessionsData,
    isFetching,
    refetch,
  } = useGetAdminClassroomSessionsQuery({
    academic_year_id: academicYearId || undefined,
    status: (statusFilter as any) || undefined,
    teaching_approach: (approachFilter as any) || undefined,
    page,
    limit: 20,
  });

  const [generateSessions, { isLoading: generating }] = useGenerateAdminClassroomSessionsMutation();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicYearId) {
      toast.error('Please select an academic year.');
      return;
    }
    try {
      const res = await generateSessions({
        academic_year_id: academicYearId,
        start_date: startDate,
        end_date: endDate,
      }).unwrap();
      toast.success(
        `Timetable generation completed: ${res.created_count} new session(s) generated.`,
      );
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to generate sessions');
    }
  };

  return (
    <PageContainer data-testid="admin-classroom-page">
      <PageHeader
        title="Institutional Classroom Oversight"
        description="Generate scheduled classroom sessions idempotently from published timetables and monitor school-wide classroom execution."
        badge={
          <Badge variant="outline" className="gap-1.5 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Academic Admin
          </Badge>
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {/* Bulk Generation Form */}
      <Card className="p-5 rounded-2xl border-slate-200/80 dark:border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold">Generate Sessions from Published Timetable</h2>
            <p className="text-xs text-muted-foreground">
              Invokes PostgreSQL procedure{' '}
              <code>s31_generate_classroom_sessions_for_date_range</code> (max 31 days per run;
              skips holidays and avoids duplicates).
            </p>
          </div>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Lock className="w-3 h-3" />
            Attendance remains Teacher-Only
          </Badge>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Academic Year</label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
            >
              {years.map((y: any) => (
                <option key={y.academic_year_id} value={y.academic_year_id}>
                  {y.academic_year_name} ({y.status}
                  {y.has_published_timetable ? ' • Published Timetable' : ''})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
            />
          </div>

          <Button type="submit" disabled={generating} className="h-10 rounded-xl gap-1.5">
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate Sessions'}
          </Button>
        </form>
      </Card>

      {/* Oversight Table */}
      <Card className="rounded-2xl overflow-hidden border-slate-200/80 dark:border-border">
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
          <div className="font-bold text-sm">
            Classroom Sessions Monitor ({sessionsData?.total ?? 0})
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-xl border border-input bg-background text-xs"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">Live Now</option>
              <option value="completed">Completed</option>
              <option value="not_conducted">Not Conducted</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={approachFilter}
              onChange={(e) => {
                setApproachFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-xl border border-input bg-background text-xs"
            >
              <option value="">All Approaches</option>
              <option value="traditional">Traditional</option>
              <option value="flipped">Flipped Classroom</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Date & Slot</th>
                <th className="text-left p-3">Grade & Section</th>
                <th className="text-left p-3">Subject & Teacher</th>
                <th className="text-left p-3">Mode</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!sessionsData || sessionsData.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No classroom sessions found for the selected filter.
                  </td>
                </tr>
              ) : (
                sessionsData.items.map((s) => (
                  <tr key={s.session_id}>
                    <td className="p-3 whitespace-nowrap text-xs">
                      <div className="font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {s.session_date}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {s.scheduled_start_time.slice(0, 5)} – {s.scheduled_end_time.slice(0, 5)}
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      <div className="font-semibold">{s.grade_name}</div>
                      <div className="text-muted-foreground">Section {s.section_name}</div>
                    </td>
                    <td className="p-3 text-xs">
                      <div className="font-semibold">{s.subject_name}</div>
                      <div className="text-muted-foreground">{s.teacher_name}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        <DeliveryModeBadge mode={s.delivery_mode} />
                        <TeachingApproachBadge approach={s.teaching_approach} />
                      </div>
                    </td>
                    <td className="p-3">
                      <SessionStatusBadge status={s.session_status} />
                    </td>
                    <td className="p-3 text-xs">
                      {s.attendance_summary ? (
                        <div className="flex items-center gap-1 font-medium">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          {s.attendance_summary.marked_count}/{s.attendance_summary.enrolled_count}{' '}
                          (P:{s.attendance_summary.present_count} L:
                          {s.attendance_summary.late_count} A:{s.attendance_summary.absent_count})
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
};

export default AdminClassroomPage;
