import React, { useCallback, useEffect, useState } from 'react';
import { Layers, Plus, Trash2, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AcademicManagementService,
  AcademicYearItem,
  GradeItem,
  AcademicYearGradeItem,
  SectionItem,
  extractAcademicApiError,
} from '../services/academic.service';
import {
  AcademicPageHeader,
  AcademicStatusBanner,
  getAcademicStatusBadgeClass,
} from '../components/AcademicPageHeader';

export const GradesAndSectionsPage: React.FC = () => {
  const [years, setYears] = useState<AcademicYearItem[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [yearGrades, setYearGrades] = useState<AcademicYearGradeItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'sections' | 'offerings' | 'grades'>('sections');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [gradeForm, setGradeForm] = useState({
    grade_code: '',
    grade_name: '',
    board: 'CBSE',
    display_order: '1',
  });
  const [offeringForm, setOfferingForm] = useState({ grade_id: '', intake_capacity: '120' });
  const [sectionForm, setSectionForm] = useState({
    academic_year_grade_id: '',
    section_name: '',
    room_no: '',
    capacity: '40',
    class_teacher_id: '',
  });

  const loadData = useCallback(async (preferredYearId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [yearsRes, gradesRes, staffRes] = await Promise.all([
        AcademicManagementService.listAcademicYears({ limit: 50 }),
        AcademicManagementService.listGrades({ limit: 100 }),
        AcademicManagementService.listStaffDirectory().catch(() => []),
      ]);

      setYears(yearsRes.items);
      setGrades(gradesRes.items);
      setStaffList(staffRes);

      const yearId =
        preferredYearId ||
        yearsRes.items.find((y) => y.status === 'teaching')?.academic_year_id ||
        yearsRes.items[0]?.academic_year_id ||
        '';
      setSelectedYearId(yearId);

      if (yearId) {
        const [ygList, secRes] = await Promise.all([
          AcademicManagementService.listYearGrades(yearId),
          AcademicManagementService.listSections({ academic_year_id: yearId, limit: 100 }),
        ]);
        setYearGrades(ygList);
        setSections(secRes.items);
      } else {
        const secRes = await AcademicManagementService.listSections({ limit: 100 });
        setYearGrades([]);
        setSections(secRes.items);
      }
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load grades & sections'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleYearChange = async (yearId: string) => {
    setSelectedYearId(yearId);
    await loadData(yearId);
  };

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeForm.grade_code.trim() || !gradeForm.grade_name.trim()) {
      setError('Grade code and grade name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await AcademicManagementService.createGrade({
        grade_code: gradeForm.grade_code.trim(),
        grade_name: gradeForm.grade_name.trim(),
        board: gradeForm.board.trim() || null,
        display_order: Number(gradeForm.display_order) || 1,
      });
      setSuccess(`Created grade "${created.grade_name}".`);
      setGradeForm({ grade_code: '', grade_name: '', board: 'CBSE', display_order: '1' });
      await loadData(selectedYearId);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to create grade'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYearId || !offeringForm.grade_id) {
      setError('Select both an academic year and a master grade.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await AcademicManagementService.createYearGrade(selectedYearId, {
        grade_id: offeringForm.grade_id,
        intake_capacity: offeringForm.intake_capacity ? Number(offeringForm.intake_capacity) : null,
      });
      setSuccess('Mapped grade offering to selected academic year.');
      setOfferingForm({ grade_id: '', intake_capacity: '120' });
      await loadData(selectedYearId);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to map grade offering'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.academic_year_grade_id || !sectionForm.section_name.trim()) {
      setError('Select a grade offering and enter a section name.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await AcademicManagementService.createSection({
        academic_year_grade_id: sectionForm.academic_year_grade_id,
        section_name: sectionForm.section_name.trim(),
        room_no: sectionForm.room_no.trim() || null,
        capacity: sectionForm.capacity ? Number(sectionForm.capacity) : null,
        class_teacher_id: sectionForm.class_teacher_id || null,
      });
      setSuccess(`Created Section "${created.section_name}".`);
      setSectionForm({
        academic_year_grade_id: sectionForm.academic_year_grade_id,
        section_name: '',
        room_no: '',
        capacity: '40',
        class_teacher_id: '',
      });
      await loadData(selectedYearId);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to create section'));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTeacher = async (sectionId: string, staffId: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await AcademicManagementService.assignClassTeacher(sectionId, staffId || null);
      setSuccess('Updated section class teacher assignment.');
      await loadData(selectedYearId);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to update class teacher assignment'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId: string, name: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await AcademicManagementService.deleteSection(sectionId);
      setSuccess(`Deleted section "${name}".`);
      await loadData(selectedYearId);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to delete section'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="academic-classes-page" className="p-6 max-w-7xl mx-auto space-y-6">
      <AcademicPageHeader
        title="Grades & Sections"
        subtitle="Manage master grade definitions, academic-year grade offerings, classroom sections, and class teacher assignments."
        icon={Layers}
        onRefresh={() => loadData(selectedYearId)}
        loading={loading}
        actions={
          <select
            aria-label="Filter by academic year"
            value={selectedYearId}
            onChange={(e) => handleYearChange(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold"
          >
            <option value="">All Academic Years</option>
            {years.map((y) => (
              <option key={y.academic_year_id} value={y.academic_year_id}>
                {y.academic_year_name} ({y.status})
              </option>
            ))}
          </select>
        }
      />

      <AcademicStatusBanner error={error} success={success} />

      {/* Section Tabs */}
      <div className="flex border-b border-border gap-4">
        {[
          { id: 'sections', label: `Sections & Class Teachers (${sections.length})` },
          { id: 'offerings', label: `Year Grade Offerings (${yearGrades.length})` },
          { id: 'grades', label: `Master Grades Catalog (${grades.length})` },
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

      {activeTab === 'sections' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Allocate New Section
              </CardTitle>
              <CardDescription>
                Create a section under an academic year grade offering.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSection} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sec-offering">Grade Offering</Label>
                  <select
                    id="sec-offering"
                    value={sectionForm.academic_year_grade_id}
                    onChange={(e) =>
                      setSectionForm((p) => ({ ...p, academic_year_grade_id: e.target.value }))
                    }
                    className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="">-- Select Grade Offering --</option>
                    {yearGrades.map((yg) => (
                      <option key={yg.academic_year_grade_id} value={yg.academic_year_grade_id}>
                        {yg.grade_name || yg.grade_code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sec-name">Section</Label>
                    <Input
                      id="sec-name"
                      placeholder="e.g. A"
                      value={sectionForm.section_name}
                      onChange={(e) =>
                        setSectionForm((p) => ({ ...p, section_name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sec-cap">Capacity</Label>
                    <Input
                      id="sec-cap"
                      type="number"
                      min={1}
                      value={sectionForm.capacity}
                      onChange={(e) => setSectionForm((p) => ({ ...p, capacity: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sec-room">Room Number</Label>
                  <Input
                    id="sec-room"
                    placeholder="e.g. B-104"
                    value={sectionForm.room_no}
                    onChange={(e) => setSectionForm((p) => ({ ...p, room_no: e.target.value }))}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={saving || yearGrades.length === 0}
                  className="w-full"
                >
                  Create Section
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold">Configured Sections</CardTitle>
              <CardDescription>
                Assign class teachers and inspect section capacities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sections.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {loading
                    ? 'Loading sections...'
                    : 'No sections found for the selected academic year.'}
                </div>
              ) : (
                sections.map((sec) => (
                  <div
                    key={sec.section_id}
                    className="p-3.5 rounded-xl border border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {sec.grade_name || 'Grade'} — Section {sec.section_name}
                        </span>
                        <Badge
                          variant="outline"
                          className={getAcademicStatusBadgeClass(
                            sec.is_active ? 'active' : 'draft',
                          )}
                        >
                          {sec.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Room: {sec.room_no || '—'} · Capacity: {sec.capacity ?? '—'} · Class
                        Teacher:{' '}
                        <span className="font-semibold text-foreground">
                          {sec.class_teacher_name || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {staffList.length > 0 && (
                        <select
                          aria-label={`Assign class teacher for Section ${sec.section_name}`}
                          value={sec.class_teacher_id || ''}
                          disabled={saving}
                          onChange={(e) => handleAssignTeacher(sec.section_id, e.target.value)}
                          className="h-8 rounded-lg border border-input bg-background px-2 text-xs max-w-[180px]"
                        >
                          <option value="">Unassigned</option>
                          {staffList.map((st: any) => (
                            <option key={st.staff_id || st.id} value={st.staff_id || st.id}>
                              {st.full_name ||
                                `${st.first_name || ''} ${st.last_name || ''}`.trim() ||
                                st.email}
                            </option>
                          ))}
                        </select>
                      )}
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDeleteSection(sec.section_id, sec.section_name)}
                        title="Delete section"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'offerings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Map Grade to Academic Year</CardTitle>
              <CardDescription>Enable a master grade for admissions and teaching.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOffering} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="off-grade">Master Grade</Label>
                  <select
                    id="off-grade"
                    value={offeringForm.grade_id}
                    onChange={(e) => setOfferingForm((p) => ({ ...p, grade_id: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="">-- Select Grade --</option>
                    {grades.map((g) => (
                      <option key={g.grade_id} value={g.grade_id}>
                        {g.grade_name} ({g.grade_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="off-cap">Intake Capacity</Label>
                  <Input
                    id="off-cap"
                    type="number"
                    min={1}
                    value={offeringForm.intake_capacity}
                    onChange={(e) =>
                      setOfferingForm((p) => ({ ...p, intake_capacity: e.target.value }))
                    }
                  />
                </div>
                <Button type="submit" disabled={saving || !selectedYearId} className="w-full">
                  Add Grade Offering
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold">Year Grade Offerings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {yearGrades.length === 0 ? (
                <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                  No grade offerings mapped to the selected academic year.
                </div>
              ) : (
                yearGrades.map((yg) => (
                  <div
                    key={yg.academic_year_grade_id}
                    className="p-3.5 rounded-xl border border-border/70 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm">{yg.grade_name || yg.grade_code}</div>
                      <div className="text-xs text-muted-foreground">
                        Intake: {yg.intake_capacity ?? 'Unlimited'} · {(yg.sections || []).length}{' '}
                        section(s)
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={getAcademicStatusBadgeClass(yg.is_active ? 'active' : 'draft')}
                    >
                      {yg.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Create Master Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGrade} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="g-code">Grade Code</Label>
                  <Input
                    id="g-code"
                    placeholder="e.g. G10"
                    value={gradeForm.grade_code}
                    onChange={(e) => setGradeForm((p) => ({ ...p, grade_code: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-name">Grade Name</Label>
                  <Input
                    id="g-name"
                    placeholder="e.g. Grade 10"
                    value={gradeForm.grade_name}
                    onChange={(e) => setGradeForm((p) => ({ ...p, grade_name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="g-board">Board</Label>
                    <Input
                      id="g-board"
                      value={gradeForm.board}
                      onChange={(e) => setGradeForm((p) => ({ ...p, board: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="g-order">Order</Label>
                    <Input
                      id="g-order"
                      type="number"
                      min={1}
                      value={gradeForm.display_order}
                      onChange={(e) =>
                        setGradeForm((p) => ({ ...p, display_order: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  Create Grade
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold">Master Grades Directory</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grades.map((g) => (
                <div
                  key={g.grade_id}
                  className="p-3.5 rounded-xl border border-border/70 flex items-center justify-between"
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase text-indigo-600">
                      {g.grade_code} {g.board ? `· ${g.board}` : ''}
                    </div>
                    <div className="font-bold text-sm">{g.grade_name}</div>
                  </div>
                  <Badge variant="outline">#{g.display_order}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GradesAndSectionsPage;
