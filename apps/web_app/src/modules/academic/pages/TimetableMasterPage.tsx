import React, { useCallback, useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle2, DoorOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AcademicManagementService,
  TimetableOverview,
  TimetableVersionItem,
  TimetableEntryDetail,
  ClassroomItem,
  SectionItem,
  extractAcademicApiError,
} from '../services/academic.service';
import {
  AcademicPageHeader,
  AcademicStatusBanner,
  formatShortDate,
  getAcademicStatusBadgeClass,
} from '../components/AcademicPageHeader';

const DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

export const TimetableMasterPage: React.FC = () => {
  const [overview, setOverview] = useState<TimetableOverview | null>(null);
  const [versions, setVersions] = useState<TimetableVersionItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [sectionSchedule, setSectionSchedule] = useState<Record<number, TimetableEntryDetail[]>>(
    {},
  );
  const [conflicts, setConflicts] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'versions' | 'matrix' | 'conflicts' | 'rooms'>(
    'versions',
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMaster = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, versionsRes, sectionsRes, roomsRes] = await Promise.all([
        AcademicManagementService.getTimetableOverview(),
        AcademicManagementService.listTimetables({ limit: 50 }),
        AcademicManagementService.listSections({ limit: 100 }),
        AcademicManagementService.listClassrooms({ limit: 100 }),
      ]);

      setOverview(overviewRes);
      setVersions(versionsRes.items);
      setSections(sectionsRes.items);
      setClassrooms(roomsRes.items);

      const defaultVersion =
        versionsRes.items.find((v) => v.status === 'published')?.timetable_version_id ||
        versionsRes.items[0]?.timetable_version_id ||
        '';
      setSelectedVersionId(defaultVersion);

      const defaultSection = sectionsRes.items[0]?.section_id || '';
      setSelectedSectionId(defaultSection);

      if (defaultVersion) {
        const conflictRes = await AcademicManagementService.getTimetableConflicts(
          defaultVersion,
        ).catch(() => null);
        setConflicts(conflictRes);
      }

      if (defaultSection) {
        const secTt = await AcademicManagementService.getSectionTimetable(
          defaultSection,
          defaultVersion || undefined,
        ).catch(() => null);
        setSectionSchedule(secTt?.schedule_by_day || {});
      }
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load timetable master data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaster();
  }, [loadMaster]);

  const handleSelectSection = async (sectionId: string, versionId = selectedVersionId) => {
    setSelectedSectionId(sectionId);
    if (!sectionId) {
      setSectionSchedule({});
      return;
    }
    try {
      const res = await AcademicManagementService.getSectionTimetable(
        sectionId,
        versionId || undefined,
      );
      setSectionSchedule(res.schedule_by_day || {});
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load section timetable'));
    }
  };

  const handleSelectVersion = async (versionId: string) => {
    setSelectedVersionId(versionId);
    try {
      const [conflictRes, secRes] = await Promise.all([
        AcademicManagementService.getTimetableConflicts(versionId).catch(() => null),
        selectedSectionId
          ? AcademicManagementService.getSectionTimetable(selectedSectionId, versionId).catch(
              () => null,
            )
          : Promise.resolve(null),
      ]);
      setConflicts(conflictRes);
      if (secRes) setSectionSchedule(secRes.schedule_by_day || {});
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load timetable version details'));
    }
  };

  const conflictItems: any[] = conflicts?.conflicts || conflicts?.items || [];

  return (
    <div data-testid="academic-timetable-page" className="p-6 max-w-7xl mx-auto space-y-6">
      <AcademicPageHeader
        title="Timetable Master"
        subtitle="Institutional timetable versions, section weekly schedules, conflict diagnostics, and classroom utilization."
        icon={Clock}
        onRefresh={loadMaster}
        loading={loading}
        badgeText={overview ? `${overview.coverage_percentage}% Section Coverage` : undefined}
      />

      <AcademicStatusBanner error={error} />

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Total Versions</CardDescription>
            <CardTitle className="text-2xl font-black">{overview?.total_timetables ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {overview?.published_timetables ?? 0} published · {overview?.draft_timetables ?? 0}{' '}
            draft
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Scheduled Entries</CardDescription>
            <CardTitle className="text-2xl font-black">
              {overview?.total_scheduled_entries ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Across {overview?.total_sections_scheduled ?? 0} / {overview?.total_sections_count ?? 0}{' '}
            sections
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Scheduled Faculty</CardDescription>
            <CardTitle className="text-2xl font-black">
              {overview?.total_teachers_scheduled ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Active teaching assignments
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Classrooms Utilized</CardDescription>
            <CardTitle className="text-2xl font-black">
              {overview?.total_classrooms_utilized ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {classrooms.length} registered rooms
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-4 flex-wrap">
        {[
          { id: 'versions', label: `Timetable Versions (${versions.length})` },
          { id: 'matrix', label: 'Section Schedule Matrix' },
          { id: 'conflicts', label: `Conflict Inspection (${conflictItems.length})` },
          { id: 'rooms', label: `Classrooms (${classrooms.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-bold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'versions' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Timetable Versions</CardTitle>
            <CardDescription>
              Select any version to inspect its schedule matrix and conflict telemetry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {versions.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {loading ? 'Loading timetable versions...' : 'No timetable versions found.'}
              </div>
            ) : (
              versions.map((ver) => {
                const isSelected = selectedVersionId === ver.timetable_version_id;
                return (
                  <button
                    type="button"
                    key={ver.timetable_version_id}
                    onClick={() => handleSelectVersion(ver.timetable_version_id)}
                    className={`w-full text-left p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                        : 'border-border/70 hover:border-indigo-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {ver.version_name || `Version #${ver.version_number}`}
                        </span>
                        <Badge
                          variant="outline"
                          className={getAcademicStatusBadgeClass(ver.status)}
                        >
                          {ver.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {ver.academic_year_name} · Published: {formatShortDate(ver.published_at)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ver.total_entries ?? 0} entries · {ver.sections_count ?? 0} sections
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'matrix' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold">Section Weekly Timetable</CardTitle>
              <CardDescription>Filter by section and timetable version</CardDescription>
            </div>
            <select
              aria-label="Select section for timetable"
              value={selectedSectionId}
              onChange={(e) => handleSelectSection(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">-- Select Section --</option>
              {sections.map((s) => (
                <option key={s.section_id} value={s.section_id}>
                  {s.grade_name || 'Grade'} - Section {s.section_name}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {DAYS.map((day) => {
                const entries = sectionSchedule[day.id] || [];
                return (
                  <div
                    key={day.id}
                    className="rounded-xl border border-border/70 p-3 space-y-2 bg-muted/15"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      {day.label}
                    </div>
                    {entries.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground py-4">No periods</div>
                    ) : (
                      entries.map((entry) => (
                        <div
                          key={entry.timetable_entry_id}
                          className="p-2 rounded-lg bg-background border border-border/60 text-xs space-y-0.5"
                        >
                          <div className="font-bold truncate">{entry.subject_name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            P{entry.period_number} ({entry.start_time.slice(0, 5)}–
                            {entry.end_time.slice(0, 5)})
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {entry.teacher_name} {entry.room_code ? `· ${entry.room_code}` : ''}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'conflicts' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Timetable Conflict Analysis</CardTitle>
            <CardDescription>
              Detects overlapping teacher, classroom, and section allocations in the selected
              timetable version.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conflictItems.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Zero scheduling conflicts detected in the selected timetable version.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {conflictItems.map((c: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 text-sm flex items-start gap-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-red-700 dark:text-red-300">
                        {c.type || c.conflict_type || 'Schedule Conflict'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.message || c.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'rooms' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-indigo-600" />
              Institutional Classrooms
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classrooms.length === 0 ? (
              <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                No classrooms configured yet.
              </div>
            ) : (
              classrooms.map((room) => (
                <div
                  key={room.classroom_id}
                  className="p-3.5 rounded-xl border border-border/70 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-indigo-600">
                      {room.room_code}
                    </span>
                    <Badge variant="outline">{room.room_type}</Badge>
                  </div>
                  <div className="font-bold text-sm">{room.room_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Capacity: {room.capacity ?? '—'} ·{' '}
                    {[room.building_name, room.floor_name].filter(Boolean).join(', ') ||
                      'Main Campus'}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimetableMasterPage;
