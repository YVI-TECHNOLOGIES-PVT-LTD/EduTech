import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Wand2, CheckCircle2, FileText, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AcademicManagementService,
  AcademicYearItem,
  GradeItem,
  SubjectItem,
  CurriculumUnitItem,
  CurriculumOutcomeItem,
  SavedLessonPlanSummary,
  StructuredLessonPlan,
  extractAcademicApiError,
} from '../services/academic.service';
import {
  AcademicPageHeader,
  AcademicStatusBanner,
  formatShortDate,
  getAcademicStatusBadgeClass,
} from '../components/AcademicPageHeader';

export const LessonPlanningPage: React.FC = () => {
  const [years, setYears] = useState<AcademicYearItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [curriculumOptions, setCurriculumOptions] = useState<any[]>([]);
  const [units, setUnits] = useState<CurriculumUnitItem[]>([]);
  const [outcomes, setOutcomes] = useState<CurriculumOutcomeItem[]>([]);
  const [savedPlans, setSavedPlans] = useState<SavedLessonPlanSummary[]>([]);
  const [selectedSavedDetail, setSelectedSavedDetail] = useState<any>(null);

  const [form, setForm] = useState({
    academic_year_id: '',
    grade_id: '',
    subject_id: '',
    curriculum_plan_id: '',
    curriculum_unit_id: '',
    topic: '',
    duration_minutes: '45',
    difficulty_level: 'standard' as 'standard' | 'introductory' | 'advanced',
    preferred_methodology: 'Interactive Inquiry & Guided Practice',
  });

  const [generatedPlan, setGeneratedPlan] = useState<StructuredLessonPlan | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [refinementText, setRefinementText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [working, setWorking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadBootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [yearsRes, gradesRes, subjectsRes, plansRes] = await Promise.all([
        AcademicManagementService.listAcademicYears({ limit: 50 }),
        AcademicManagementService.listGrades({ limit: 100 }),
        AcademicManagementService.listSubjects({ limit: 100 }),
        AcademicManagementService.listSavedLessonPlans({ limit: 25 }),
      ]);

      setYears(yearsRes.items);
      setGrades(gradesRes.items);
      setSubjects(subjectsRes.items);
      setSavedPlans(plansRes.items);

      const defaultYear =
        yearsRes.items.find((y) => y.status === 'teaching')?.academic_year_id ||
        yearsRes.items[0]?.academic_year_id ||
        '';
      setForm((prev) => ({
        ...prev,
        academic_year_id: prev.academic_year_id || defaultYear,
        grade_id: prev.grade_id || gradesRes.items[0]?.grade_id || '',
        subject_id: prev.subject_id || subjectsRes.items[0]?.subject_id || '',
      }));
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load lesson planning workspace'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  // Resolve matching curriculum plans when grade & subject change
  useEffect(() => {
    if (!form.grade_id || !form.subject_id) return;
    AcademicManagementService.getLessonPlanningCurriculum({
      grade_id: form.grade_id,
      subject_id: form.subject_id,
      academic_year_id: form.academic_year_id || undefined,
    })
      .then((plans) => {
        setCurriculumOptions(plans);
        const firstPlanId = plans[0]?.curriculum_plan_id || '';
        setForm((prev) => ({ ...prev, curriculum_plan_id: firstPlanId, curriculum_unit_id: '' }));
        setUnits([]);
        setOutcomes([]);
      })
      .catch(() => {
        setCurriculumOptions([]);
      });
  }, [form.grade_id, form.subject_id, form.academic_year_id]);

  // Load syllabus units when curriculum plan changes
  useEffect(() => {
    if (!form.curriculum_plan_id) return;
    AcademicManagementService.getLessonPlanningUnits(form.curriculum_plan_id)
      .then((uList) => {
        setUnits(uList);
        const firstUnit = uList[0]?.curriculum_unit_id || '';
        setForm((prev) => ({ ...prev, curriculum_unit_id: firstUnit }));
      })
      .catch(() => {
        setUnits([]);
      });
  }, [form.curriculum_plan_id]);

  // Load learning outcomes when unit changes
  useEffect(() => {
    if (!form.curriculum_unit_id) return;
    AcademicManagementService.getLessonPlanningOutcomes(form.curriculum_unit_id)
      .then(setOutcomes)
      .catch(() => setOutcomes([]));
  }, [form.curriculum_unit_id]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.academic_year_id || !form.grade_id || !form.subject_id || !form.curriculum_unit_id) {
      setError('Please select an Academic Year, Grade, Subject, and Syllabus Unit first.');
      return;
    }
    if (form.topic.trim().length < 3) {
      setError('Lesson topic must be at least 3 characters.');
      return;
    }
    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await AcademicManagementService.generateLessonPlan({
        academic_year_id: form.academic_year_id,
        grade_id: form.grade_id,
        subject_id: form.subject_id,
        curriculum_plan_id: form.curriculum_plan_id || undefined,
        curriculum_unit_id: form.curriculum_unit_id,
        topic: form.topic.trim(),
        duration_minutes: Number(form.duration_minutes) || 45,
        difficulty_level: form.difficulty_level,
        preferred_methodology: form.preferred_methodology.trim() || undefined,
      });
      setGeneratedPlan(result?.generated_plan || result?.plan || result);
      setValidationResult(result?.quality_validation || null);
      setSuccess('Structured AI lesson plan draft generated.');
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to generate AI lesson plan'));
    } finally {
      setWorking(false);
    }
  };

  const handleRefine = async () => {
    if (!generatedPlan || refinementText.trim().length < 5) {
      setError('Provide at least 5 characters of refinement instructions.');
      return;
    }
    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await AcademicManagementService.refineLessonPlan({
        current_plan: generatedPlan,
        refinement_instructions: refinementText.trim(),
      });
      setGeneratedPlan(result?.refined_plan || result?.plan || result);
      setRefinementText('');
      setSuccess('Lesson plan draft refined.');
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to refine lesson plan'));
    } finally {
      setWorking(false);
    }
  };

  const handleValidate = async () => {
    if (!generatedPlan) return;
    setWorking(true);
    setError(null);
    try {
      const res = await AcademicManagementService.validateLessonPlan({
        plan: generatedPlan,
        curriculum_unit_id: form.curriculum_unit_id || undefined,
      });
      setValidationResult(res);
      setSuccess('Quality & pedagogy alignment check completed.');
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to validate lesson plan'));
    } finally {
      setWorking(false);
    }
  };

  const handleInspectSaved = async (planId: string) => {
    setError(null);
    try {
      const detail = await AcademicManagementService.getSavedLessonPlanById(planId);
      setSelectedSavedDetail(detail);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load saved lesson plan detail'));
    }
  };

  return (
    <div data-testid="academic-lesson-planning-page" className="p-6 max-w-7xl mx-auto space-y-6">
      <AcademicPageHeader
        title="AI Lesson Planning"
        subtitle="Curriculum-grounded AI lesson generator, pedagogical quality validator, and saved lesson plans library."
        icon={Sparkles}
        onRefresh={loadBootstrap}
        loading={loading}
      />

      <AcademicStatusBanner error={error} success={success} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Lesson Generator Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-600" />
              Generate Lesson Plan Draft
            </CardTitle>
            <CardDescription>
              Anchored to tenant curriculum units and official learning outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="lp-year">Academic Year</Label>
                <select
                  id="lp-year"
                  value={form.academic_year_id}
                  onChange={(e) => setForm((p) => ({ ...p, academic_year_id: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                >
                  <option value="">-- Select Year --</option>
                  {years.map((y) => (
                    <option key={y.academic_year_id} value={y.academic_year_id}>
                      {y.academic_year_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="lp-grade">Grade</Label>
                  <select
                    id="lp-grade"
                    value={form.grade_id}
                    onChange={(e) => setForm((p) => ({ ...p, grade_id: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="">-- Grade --</option>
                    {grades.map((g) => (
                      <option key={g.grade_id} value={g.grade_id}>
                        {g.grade_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lp-subject">Subject</Label>
                  <select
                    id="lp-subject"
                    value={form.subject_id}
                    onChange={(e) => setForm((p) => ({ ...p, subject_id: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="">-- Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.subject_id} value={s.subject_id}>
                        {s.subject_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="lp-plan">Curriculum Plan</Label>
                <select
                  id="lp-plan"
                  value={form.curriculum_plan_id}
                  onChange={(e) => setForm((p) => ({ ...p, curriculum_plan_id: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                >
                  {curriculumOptions.length === 0 ? (
                    <option value="">No mapped curriculum plan</option>
                  ) : (
                    curriculumOptions.map((c: any) => (
                      <option key={c.curriculum_plan_id} value={c.curriculum_plan_id}>
                        {c.plan_title}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="lp-unit">Syllabus Unit</Label>
                <select
                  id="lp-unit"
                  value={form.curriculum_unit_id}
                  onChange={(e) => setForm((p) => ({ ...p, curriculum_unit_id: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                >
                  {units.length === 0 ? (
                    <option value="">No units available</option>
                  ) : (
                    units.map((u) => (
                      <option key={u.curriculum_unit_id} value={u.curriculum_unit_id}>
                        Unit {u.sequence_number}: {u.unit_title}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="lp-topic">Lesson Topic</Label>
                <Input
                  id="lp-topic"
                  placeholder="e.g. Introduction to Quadratic Equations"
                  value={form.topic}
                  onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="lp-dur">Duration (min)</Label>
                  <Input
                    id="lp-dur"
                    type="number"
                    min={15}
                    max={180}
                    value={form.duration_minutes}
                    onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lp-diff">Level</Label>
                  <select
                    id="lp-diff"
                    value={form.difficulty_level}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, difficulty_level: e.target.value as any }))
                    }
                    className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="introductory">Introductory</option>
                    <option value="standard">Standard</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              {outcomes.length > 0 && (
                <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  {outcomes.length} syllabus learning outcome(s) linked to selected unit.
                </div>
              )}
              <Button type="submit" disabled={working} className="w-full">
                {working ? 'Generating...' : 'Generate AI Lesson Plan'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Draft / Saved Plan Inspector */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold">
                {generatedPlan
                  ? generatedPlan.lesson_title
                  : selectedSavedDetail
                    ? selectedSavedDetail.lesson_title
                    : 'Lesson Plan Workspace'}
              </CardTitle>
              <CardDescription>
                {generatedPlan
                  ? `${generatedPlan.grade} · ${generatedPlan.subject} · ${generatedPlan.estimated_duration_minutes} mins · ${generatedPlan.teaching_approach}`
                  : 'Generate a new AI lesson plan draft or select a saved plan below.'}
              </CardDescription>
            </div>
            {generatedPlan && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={working}
                onClick={handleValidate}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Validate Quality
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {validationResult && (
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs space-y-1">
                <div className="font-bold">
                  Quality Check: {validationResult.is_valid ? 'Passed' : 'Review Recommended'}{' '}
                  {validationResult.quality_score !== undefined
                    ? `(${validationResult.quality_score}/100)`
                    : ''}
                </div>
              </div>
            )}

            {generatedPlan ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Learning Objectives ({generatedPlan.learning_objectives?.length || 0})
                  </div>
                  {(generatedPlan.learning_objectives || []).map((obj, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-border/60 text-xs flex justify-between gap-2"
                    >
                      <span>{obj.description}</span>
                      <Badge variant="outline">{obj.bloom_level}</Badge>
                    </div>
                  ))}
                </div>

                {(generatedPlan.lesson_activities || []).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Timed Classroom Activities
                    </div>
                    {generatedPlan.lesson_activities!.map((act) => (
                      <div
                        key={act.sequence_number}
                        className="p-3 rounded-xl border border-border/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>
                            {act.sequence_number}. {act.activity_title}
                          </span>
                          <Badge variant="secondary">{act.duration_minutes} min</Badge>
                        </div>
                        <p className="text-muted-foreground">{act.teacher_instructions}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row gap-2">
                  <Input
                    aria-label="Refinement instructions"
                    placeholder="Ask AI to refine duration, add group activity, simplify language..."
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                  />
                  <Button type="button" variant="outline" disabled={working} onClick={handleRefine}>
                    Refine Draft
                  </Button>
                </div>
              </div>
            ) : selectedSavedDetail ? (
              <div className="space-y-3 text-sm">
                <div className="text-xs text-muted-foreground">
                  {selectedSavedDetail.grade_name} · {selectedSavedDetail.subject_name} ·{' '}
                  {selectedSavedDetail.teacher_name}
                </div>
                <p className="text-xs">
                  {selectedSavedDetail.lesson_summary || 'No summary provided.'}
                </p>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Use the form on the left to generate a curriculum-aligned lesson plan draft, or
                choose a saved plan below.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Lesson Plans Library */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Saved Lesson Plans ({savedPlans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedPlans.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {loading ? 'Loading saved lesson plans...' : 'No saved lesson plans recorded yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedPlans.map((plan) => (
                <button
                  type="button"
                  key={plan.lesson_plan_id}
                  onClick={() => handleInspectSaved(plan.lesson_plan_id)}
                  className="text-left p-3.5 rounded-xl border border-border/70 hover:border-indigo-400 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-indigo-600">
                      {plan.grade_name} · {plan.subject_code}
                    </span>
                    <Badge
                      variant="outline"
                      className={getAcademicStatusBadgeClass(plan.is_active ? 'active' : 'draft')}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="font-bold text-sm">{plan.lesson_title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    <span>{plan.unit_title}</span>
                    <span>· {formatShortDate(plan.planned_date)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonPlanningPage;
