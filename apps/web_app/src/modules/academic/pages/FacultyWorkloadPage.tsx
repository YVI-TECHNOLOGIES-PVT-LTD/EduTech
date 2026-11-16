import React, { useCallback, useEffect, useState } from 'react';
import { UserCheck, Search, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AcademicManagementService,
  AcademicYearItem,
  FacultyWorkloadItem,
  TimetableEntryDetail,
  extractAcademicApiError,
} from '../services/academic.service';
import {
  AcademicPageHeader,
  AcademicStatusBanner,
  getAcademicStatusBadgeClass,
} from '../components/AcademicPageHeader';

const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const FacultyWorkloadPage: React.FC = () => {
  const [years, setYears] = useState<AcademicYearItem[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [faculty, setFaculty] = useState<FacultyWorkloadItem[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyWorkloadItem | null>(null);
  const [teacherEntries, setTeacherEntries] = useState<TimetableEntryDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkload = useCallback(
    async (yearId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const [yearsRes, workloadRes] = await Promise.all([
          AcademicManagementService.listAcademicYears({ limit: 50 }),
          AcademicManagementService.listFacultyWorkload({
            search: search.trim() || undefined,
            academic_year_id: yearId || undefined,
            limit: 100,
          }),
        ]);
        setYears(yearsRes.items);
        setFaculty(workloadRes.items);
      } catch (err: any) {
        setError(extractAcademicApiError(err, 'Failed to load faculty workload metrics'));
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    loadWorkload(selectedYearId);
  }, [loadWorkload, selectedYearId]);

  const handleInspectFaculty = async (member: FacultyWorkloadItem) => {
    setSelectedFaculty(member);
    try {
      const timetableRes = await AcademicManagementService.getTeacherTimetable(member.staff_id);
      const scheduleMap = timetableRes?.schedule_by_day || {};
      const flattened: TimetableEntryDetail[] = Object.values(
        scheduleMap,
      ).flat() as TimetableEntryDetail[];
      setTeacherEntries(flattened);
    } catch {
      setTeacherEntries([]);
    }
  };

  const filteredFaculty = faculty.filter((f) =>
    statusFilter === 'ALL' ? true : f.workload_status === statusFilter,
  );

  const summary = {
    total: faculty.length,
    heavy: faculty.filter((f) => f.workload_status === 'HEAVY').length,
    balanced: faculty.filter((f) => f.workload_status === 'BALANCED').length,
    light: faculty.filter((f) => f.workload_status === 'LIGHT').length,
  };

  return (
    <div data-testid="academic-faculty-page" className="p-6 max-w-7xl mx-auto space-y-6">
      <AcademicPageHeader
        title="Faculty Scheduling & Workload"
        subtitle="Weekly period allocation, load balance distribution, subject assignments, and individual faculty schedules."
        icon={UserCheck}
        onRefresh={() => loadWorkload(selectedYearId)}
        loading={loading}
      />

      <AcademicStatusBanner error={error} />

      {/* Distribution Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Active Faculty</CardDescription>
            <CardTitle className="text-2xl font-black">{summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Balanced Load</CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-600">
              {summary.balanced}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Heavy Load</CardDescription>
            <CardTitle className="text-2xl font-black text-red-600">{summary.heavy}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Light Load</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-600">{summary.light}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              aria-label="Search faculty"
              placeholder="Search faculty name or employee code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            aria-label="Filter by academic year"
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Latest Published Session</option>
            {years.map((y) => (
              <option key={y.academic_year_id} value={y.academic_year_id}>
                {y.academic_year_name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by workload status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="ALL">All Workload Levels</option>
            <option value="HEAVY">Heavy</option>
            <option value="BALANCED">Balanced</option>
            <option value="LIGHT">Light</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Faculty Workload Roster ({filteredFaculty.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredFaculty.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {loading ? 'Loading faculty workload...' : 'No faculty workload records found.'}
              </div>
            ) : (
              filteredFaculty.map((member) => {
                const isSelected = selectedFaculty?.staff_id === member.staff_id;
                return (
                  <button
                    type="button"
                    key={member.staff_id}
                    onClick={() => handleInspectFaculty(member)}
                    className={`w-full text-left p-4 rounded-xl border transition space-y-2 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                        : 'border-border/70 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm">{member.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {[member.designation_name, member.department_name, member.employee_id]
                            .filter(Boolean)
                            .join(' · ') ||
                            member.email ||
                            'Teaching Faculty'}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={getAcademicStatusBadgeClass(member.workload_status)}
                      >
                        {member.workload_status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {member.weekly_periods} periods/wk
                      </span>
                      <span>{member.distinct_sections_count} section(s)</span>
                      <span>{member.distinct_subjects_count} subject(s)</span>
                      <span>Max/day: {member.max_daily_periods}</span>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Assigned Subjects & Timetable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedFaculty ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Select a faculty member to inspect assigned subjects and weekly periods.
              </p>
            ) : (
              <>
                <div>
                  <div className="font-black text-base">{selectedFaculty.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Primary: {selectedFaculty.primary_assignments_count} · Co-teacher:{' '}
                    {selectedFaculty.co_teacher_assignments_count}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Subjects ({selectedFaculty.assigned_subjects.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFaculty.assigned_subjects.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No subject allocations</span>
                    ) : (
                      selectedFaculty.assigned_subjects.map((sub) => (
                        <Badge key={sub.subject_id} variant="outline">
                          {sub.subject_code}: {sub.subject_name}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Scheduled Entries ({teacherEntries.length})
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1.5">
                    {teacherEntries.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No published timetable entries.
                      </p>
                    ) : (
                      teacherEntries.map((entry) => (
                        <div
                          key={entry.timetable_entry_id}
                          className="p-2 rounded-lg bg-muted/30 border border-border/50 text-xs"
                        >
                          <div className="font-semibold">
                            {WEEKDAY_NAMES[entry.weekday] || `Day ${entry.weekday}`} · P
                            {entry.period_number} ({entry.start_time.slice(0, 5)}–
                            {entry.end_time.slice(0, 5)})
                          </div>
                          <div className="text-muted-foreground">
                            {entry.subject_name} · {entry.grade_name} {entry.section_name}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacultyWorkloadPage;
