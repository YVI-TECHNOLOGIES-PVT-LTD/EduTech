import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Building2, GitBranch, Plus, Archive, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AcademicManagementService,
  AcademicYearItem,
  BoardOverview,
  AcademicStructureTree,
  extractAcademicApiError,
} from '../services/academic.service';
import {
  AcademicPageHeader,
  AcademicStatusBanner,
  formatShortDate,
  getAcademicStatusBadgeClass,
} from '../components/AcademicPageHeader';

export const AcademicStructurePage: React.FC = () => {
  const [years, setYears] = useState<AcademicYearItem[]>([]);
  const [boardsOverview, setBoardsOverview] = useState<BoardOverview | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [structureTree, setStructureTree] = useState<AcademicStructureTree | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newYearForm, setNewYearForm] = useState({
    academic_year_name: '',
    start_date: '',
    end_date: '',
    status: 'planning',
  });
  const [selectedBoardAffiliation, setSelectedBoardAffiliation] = useState<string>('');

  const loadStructure = useCallback(async (preferredYearId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [yearsRes, boardsRes] = await Promise.all([
        AcademicManagementService.listAcademicYears({ limit: 50 }),
        AcademicManagementService.getBoardsOverview(),
      ]);

      setYears(yearsRes.items);
      setBoardsOverview(boardsRes);
      setSelectedBoardAffiliation(boardsRes?.institutional_affiliation || '');

      const targetYearId =
        preferredYearId ||
        yearsRes.items.find((y) => y.status === 'teaching')?.academic_year_id ||
        yearsRes.items[0]?.academic_year_id ||
        '';

      setSelectedYearId(targetYearId);
      if (targetYearId) {
        const tree = await AcademicManagementService.getStructureTree(targetYearId);
        setStructureTree(tree);
      } else {
        setStructureTree(null);
      }
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load academic years & structure'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStructure();
  }, [loadStructure]);

  const handleSelectYearTree = async (yearId: string) => {
    setSelectedYearId(yearId);
    setError(null);
    if (!yearId) {
      setStructureTree(null);
      return;
    }
    try {
      const tree = await AcademicManagementService.getStructureTree(yearId);
      setStructureTree(tree);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load academic structure tree'));
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newYearForm.academic_year_name.trim() ||
      !newYearForm.start_date ||
      !newYearForm.end_date
    ) {
      setError('Academic year name, start date, and end date are required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await AcademicManagementService.createAcademicYear(newYearForm);
      setSuccess(`Created academic year "${created.academic_year_name}".`);
      setNewYearForm({ academic_year_name: '', start_date: '', end_date: '', status: 'planning' });
      await loadStructure(created.academic_year_id);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to create academic year'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrent = async (yearId: string, name: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await AcademicManagementService.setCurrentAcademicYear(yearId);
      setSuccess(`"${name}" is now set as the active teaching academic year.`);
      await loadStructure(yearId);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to set active academic year'));
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveYear = async (yearId: string, name: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await AcademicManagementService.archiveAcademicYear(yearId);
      setSuccess(`Archived academic year "${name}".`);
      await loadStructure(yearId);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to archive academic year'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAffiliation = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await AcademicManagementService.updateBoardAffiliation(
        selectedBoardAffiliation.trim() || null,
      );
      setSuccess('Updated institutional board affiliation.');
      await loadStructure(selectedYearId);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to update institutional board affiliation'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="academic-structure-page" className="p-6 max-w-7xl mx-auto space-y-6">
      <AcademicPageHeader
        title="Years & Structure"
        subtitle="Manage academic sessions, institutional board affiliation, and hierarchical grade-section structure."
        icon={Calendar}
        onRefresh={() => loadStructure(selectedYearId)}
        loading={loading}
      />

      <AcademicStatusBanner error={error} success={success} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create New Academic Year */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Create Academic Year
            </CardTitle>
            <CardDescription>Register a new academic session in PostgreSQL.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateYear} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="year-name">Session Name</Label>
                <Input
                  id="year-name"
                  placeholder="e.g. 2026-2027"
                  value={newYearForm.academic_year_name}
                  onChange={(e) =>
                    setNewYearForm((p) => ({ ...p, academic_year_name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="year-start">Start Date</Label>
                  <Input
                    id="year-start"
                    type="date"
                    value={newYearForm.start_date}
                    onChange={(e) => setNewYearForm((p) => ({ ...p, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="year-end">End Date</Label>
                  <Input
                    id="year-end"
                    type="date"
                    value={newYearForm.end_date}
                    onChange={(e) => setNewYearForm((p) => ({ ...p, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year-status">Initial Status</Label>
                <select
                  id="year-status"
                  value={newYearForm.status}
                  onChange={(e) => setNewYearForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="planning">Planning</option>
                  <option value="open">Open for Admissions</option>
                  <option value="teaching">Active Teaching</option>
                </select>
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                Create Session
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Institutional Board Affiliation */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Institutional Board & Curriculum Affiliation
            </CardTitle>
            <CardDescription>
              {boardsOverview
                ? `${boardsOverview.organization_name} · ${boardsOverview.total_configured_boards} configured grade board(s)`
                : 'Primary educational board mapping across tenant grades'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                aria-label="Institutional board affiliation"
                value={selectedBoardAffiliation}
                onChange={(e) => setSelectedBoardAffiliation(e.target.value)}
                className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">-- Select Primary Board Affiliation --</option>
                {(boardsOverview?.supported_standards || []).map((std) => (
                  <option key={std.code} value={std.code}>
                    {std.code} — {std.name}
                  </option>
                ))}
              </select>
              <Button type="button" onClick={handleSaveAffiliation} disabled={saving}>
                Update Affiliation
              </Button>
            </div>

            {boardsOverview?.configured_boards && boardsOverview.configured_boards.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {boardsOverview.configured_boards.map((b, idx) => (
                  <div
                    key={`${b.board || 'unassigned'}-${idx}`}
                    className="p-3 rounded-xl border border-border/60 bg-muted/20"
                  >
                    <div className="text-xs font-bold">{b.board || 'Unassigned'}</div>
                    <div className="text-lg font-black mt-0.5">{b.grades_count}</div>
                    <div className="text-[11px] text-muted-foreground">Mapped Grades</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Academic Years Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Registered Academic Sessions</CardTitle>
          <CardDescription>
            Select a session to inspect its grade offerings and section hierarchy, or activate a
            session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {years.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {loading ? 'Loading academic years...' : 'No academic years configured yet.'}
            </div>
          ) : (
            <div className="space-y-2">
              {years.map((year) => {
                const isSelected = selectedYearId === year.academic_year_id;
                return (
                  <div
                    key={year.academic_year_id}
                    className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                        : 'border-border/70 bg-card'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{year.academic_year_name}</span>
                        <Badge
                          variant="outline"
                          className={getAcademicStatusBadgeClass(year.status)}
                        >
                          {year.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatShortDate(year.start_date)} — {formatShortDate(year.end_date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => handleSelectYearTree(year.academic_year_id)}
                      >
                        <GitBranch className="w-3.5 h-3.5 mr-1" />
                        Inspect Structure
                      </Button>
                      {year.status !== 'teaching' && year.status !== 'archived' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() =>
                            handleSetCurrent(year.academic_year_id, year.academic_year_name)
                          }
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Set Active
                        </Button>
                      )}
                      {year.status !== 'archived' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={saving}
                          onClick={() =>
                            handleArchiveYear(year.academic_year_id, year.academic_year_name)
                          }
                        >
                          <Archive className="w-3.5 h-3.5 mr-1" />
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hierarchical Structure Tree */}
      {structureTree && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Academic Structure Tree — {structureTree.academic_year.academic_year_name}
            </CardTitle>
            <CardDescription>
              {structureTree.grades.length} grade offering(s) configured for this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {structureTree.grades.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No grades have been offered in {structureTree.academic_year.academic_year_name} yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {structureTree.grades.map((offering) => (
                  <div
                    key={offering.academic_year_grade_id}
                    className="p-4 rounded-xl border border-border/70 bg-muted/15 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          {offering.grade_code}
                        </span>
                        <h3 className="font-bold text-sm">
                          {offering.grade_name || offering.grade_id}
                        </h3>
                      </div>
                      <Badge variant="outline">Cap: {offering.intake_capacity ?? '∞'}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {(offering.sections || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No sections allocated</p>
                      ) : (
                        offering.sections!.map((sec) => (
                          <div
                            key={sec.section_id}
                            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-background border border-border/60"
                          >
                            <span className="font-semibold">Section {sec.section_name}</span>
                            <span className="text-muted-foreground truncate max-w-[140px]">
                              {sec.class_teacher_name || 'No Teacher'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AcademicStructurePage;
