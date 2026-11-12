import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, Search, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AcademicManagementService,
  CurriculumOverview,
  CurriculumPlanItem,
  CurriculumUnitItem,
  extractAcademicApiError,
} from '../services/academic.service';
import {
  AcademicPageHeader,
  AcademicStatusBanner,
  formatShortDate,
  getAcademicStatusBadgeClass,
} from '../components/AcademicPageHeader';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['review', 'published', 'archived'],
  review: ['draft', 'approved', 'published', 'archived'],
  approved: ['published', 'archived'],
  published: ['archived'],
  archived: [],
};

export const CurriculumSyllabusPage: React.FC = () => {
  const { id: routePlanId } = useParams<{ id: string }>();
  const [overview, setOverview] = useState<CurriculumOverview | null>(null);
  const [plans, setPlans] = useState<CurriculumPlanItem[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<
    (CurriculumPlanItem & { units: CurriculumUnitItem[] }) | null
  >(null);
  const [coverage, setCoverage] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const inspectPlan = useCallback(async (planId: string) => {
    setError(null);
    try {
      const [detail, cov] = await Promise.all([
        AcademicManagementService.getCurriculumDetail(planId),
        AcademicManagementService.getSyllabusCoverage(planId).catch(() => null),
      ]);
      setSelectedPlan(detail);
      setCoverage(cov);
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load curriculum plan structure'));
    }
  }, []);

  const loadCurriculum = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, plansRes] = await Promise.all([
        AcademicManagementService.getCurriculumOverview(),
        AcademicManagementService.listCurriculum({
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          limit: 50,
        }),
      ]);
      setOverview(overviewRes);
      setPlans(plansRes.items);

      const targetId = routePlanId || plansRes.items[0]?.curriculum_plan_id;
      if (targetId) {
        await inspectPlan(targetId);
      } else {
        setSelectedPlan(null);
        setCoverage(null);
      }
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to load curriculum & syllabus plans'));
    } finally {
      setLoading(false);
    }
  }, [inspectPlan, routePlanId, search, statusFilter]);

  useEffect(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  const handleStatusTransition = async (planId: string, nextStatus: string) => {
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      await AcademicManagementService.updateCurriculumStatus(planId, nextStatus);
      setSuccess(`Curriculum plan transitioned to "${nextStatus}".`);
      await loadCurriculum();
    } catch (err: any) {
      setError(extractAcademicApiError(err, 'Failed to update curriculum status'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div data-testid="academic-curriculum-page" className="p-6 max-w-7xl mx-auto space-y-6">
      <AcademicPageHeader
        title="Curriculum & Syllabus"
        subtitle="Inspect curriculum plan versions, unit sequences, learning outcomes, Bloom taxonomy alignment, and syllabus progression."
        icon={FileText}
        onRefresh={loadCurriculum}
        loading={loading}
      />

      <AcademicStatusBanner error={error} success={success} />

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Total Plans</CardDescription>
            <CardTitle className="text-2xl font-black">
              {overview?.curriculum?.total_plans ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-600">
              {overview?.curriculum?.published_plans ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Syllabus Units</CardDescription>
            <CardTitle className="text-2xl font-black">
              {overview?.curriculum?.total_units ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Learning Outcomes</CardDescription>
            <CardTitle className="text-2xl font-black">
              {overview?.curriculum?.total_learning_outcomes ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              aria-label="Search curriculum plans"
              placeholder="Search plan title, grade, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            aria-label="Filter by curriculum status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All Plan Statuses</option>
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Curriculum Plans List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Curriculum Plans ({plans.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {plans.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {loading ? 'Loading curriculum plans...' : 'No curriculum plans found.'}
              </div>
            ) : (
              plans.map((plan) => {
                const isSelected = selectedPlan?.curriculum_plan_id === plan.curriculum_plan_id;
                return (
                  <button
                    type="button"
                    key={plan.curriculum_plan_id}
                    onClick={() => inspectPlan(plan.curriculum_plan_id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition space-y-1.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                        : 'border-border/70 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase text-indigo-600">
                        {plan.grade_name} · {plan.subject_code}
                      </span>
                      <Badge variant="outline" className={getAcademicStatusBadgeClass(plan.status)}>
                        {plan.status}
                      </Badge>
                    </div>
                    <div className="font-bold text-sm">{plan.plan_title}</div>
                    <div className="text-xs text-muted-foreground">
                      {plan.academic_year_name} · {plan.unit_count} unit(s)
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Detailed Structure & Coverage */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">
                  {selectedPlan ? selectedPlan.plan_title : 'Syllabus Units & Learning Outcomes'}
                </CardTitle>
                <CardDescription>
                  {selectedPlan
                    ? `${selectedPlan.grade_name} · ${selectedPlan.subject_name} · Coordinator: ${selectedPlan.coordinator_name || 'Unassigned'}`
                    : 'Select a curriculum plan to inspect units, outcomes, and syllabus schedule coverage.'}
                </CardDescription>
              </div>
              {selectedPlan && (
                <div className="flex items-center gap-2 flex-wrap">
                  {(STATUS_TRANSITIONS[selectedPlan.status] || []).map((next) => (
                    <Button
                      key={next}
                      type="button"
                      size="xs"
                      variant="outline"
                      disabled={updating}
                      onClick={() => handleStatusTransition(selectedPlan.curriculum_plan_id, next)}
                    >
                      Mark {next}
                    </Button>
                  ))}
                  <Link
                    to="/app/academic/lesson-planning"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline ml-1"
                  >
                    Plan Lesson <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPlan && coverage?.schedule_progression && (
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-wrap gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Total Planned Periods:</span>{' '}
                  <span className="font-bold">{coverage.total_planned_periods ?? 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Schedule Coverage:</span>{' '}
                  <span className="font-bold">
                    {coverage.schedule_progression.scheduled_coverage_percent ?? 0}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Window:</span>{' '}
                  <span className="font-bold">
                    {formatShortDate(selectedPlan.planned_start_date)} –{' '}
                    {formatShortDate(selectedPlan.planned_end_date)}
                  </span>
                </div>
              </div>
            )}

            {!selectedPlan ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No curriculum plan selected.
              </div>
            ) : !selectedPlan.units || selectedPlan.units.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No syllabus units defined under this curriculum plan yet.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPlan.units.map((unit) => (
                  <div
                    key={unit.curriculum_unit_id}
                    className="p-4 rounded-xl border border-border/70 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>
                          Unit {unit.sequence_number}: {unit.unit_title}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {unit.planned_duration_periods
                          ? `${unit.planned_duration_periods} periods`
                          : 'Unscheduled'}
                      </Badge>
                    </div>
                    {unit.unit_description && (
                      <p className="text-xs text-muted-foreground">{unit.unit_description}</p>
                    )}
                    {(unit.outcomes || []).length > 0 && (
                      <div className="pt-2 space-y-1">
                        {unit.outcomes!.map((outcome) => (
                          <div
                            key={outcome.learning_outcome_id}
                            className="flex items-start justify-between gap-2 text-xs p-2 rounded-lg bg-muted/20"
                          >
                            <div className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                              <span>{outcome.outcome_statement}</span>
                            </div>
                            {outcome.bloom_level && (
                              <Badge variant="secondary" className="shrink-0">
                                {outcome.bloom_level}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CurriculumSyllabusPage;
