import React, { useState, useMemo } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Layers, Target, User, Clock } from 'lucide-react';
import { PageContainer, PageHeader, SectionHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  useGetChildCurriculumQuery,
  useGetChildSubjectsQuery,
} from '@/shared/api/parentPortal.api';
import { useParentSelectedChild } from '../hooks/useParentSelectedChild';
import { ParentChildSelectorBar } from '../components/ParentChildSelectorBar';
import {
  ParentErrorState,
  ParentLoadingSkeleton,
  ParentNoChildrenState,
  ParentUnsupportedNotice,
} from '../components/ParentStates';

export const ParentSubjectsCurriculumPage: React.FC = () => {
  const {
    children,
    selectedChildId,
    selectChild,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useParentSelectedChild();

  const [requirementFilter, setRequirementFilter] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({});

  const {
    data: subjectsData,
    isLoading: isSubjectsLoading,
    isError: isSubjectsError,
    refetch: refetchSubjects,
  } = useGetChildSubjectsQuery(selectedChildId || '', {
    skip: !selectedChildId,
  });

  const {
    data: curriculumData,
    isLoading: isCurriculumLoading,
    isError: isCurriculumError,
    refetch: refetchCurriculum,
  } = useGetChildCurriculumQuery(
    { childId: selectedChildId || '', subjectId: selectedSubjectId || undefined },
    { skip: !selectedChildId },
  );

  const filteredSubjects = useMemo(() => {
    const items = subjectsData?.subjects || [];
    if (requirementFilter === 'all') return items;
    return items.filter((s) => s.subject_requirement === requirementFilter);
  }, [subjectsData?.subjects, requirementFilter]);

  const hasSelectionGroups = useMemo(
    () => (subjectsData?.subjects || []).some((s) => Boolean(s.subject_selection_group_id)),
    [subjectsData?.subjects],
  );

  if (isListLoading) {
    return (
      <PageContainer data-testid="parent-subjects-page">
        <ParentLoadingSkeleton />
      </PageContainer>
    );
  }

  if (isListError) {
    return (
      <PageContainer data-testid="parent-subjects-page">
        <ParentErrorState onRetry={refetchList} />
      </PageContainer>
    );
  }

  const togglePlan = (planId: string) => {
    setExpandedPlanIds((prev) => ({ ...prev, [planId]: !prev[planId] }));
  };

  return (
    <PageContainer data-testid="parent-subjects-page">
      <PageHeader
        title="Subjects & Curriculum"
        description="Grade-applicable subjects, assigned faculty, board affiliation, published curriculum units, and learning outcomes."
        badge={
          <Badge variant="info" className="text-[10px] font-bold uppercase tracking-wider">
            Curriculum & Syllabus
          </Badge>
        }
      />

      {children.length === 0 ? (
        <ParentNoChildrenState />
      ) : (
        <>
          <ParentChildSelectorBar
            childrenList={children}
            selectedChildId={selectedChildId}
            onSelectChild={(id) => {
              setSelectedSubjectId(null);
              selectChild(id);
            }}
          />

          {(isSubjectsLoading || isCurriculumLoading) && !subjectsData ? (
            <ParentLoadingSkeleton />
          ) : isSubjectsError || isCurriculumError ? (
            <ParentErrorState
              onRetry={() => {
                refetchSubjects();
                refetchCurriculum();
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Board Affiliation & Academic Context */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-muted/40 border border-border text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    <strong className="text-foreground">Board Affiliation:</strong>{' '}
                    {subjectsData?.board_affiliation || 'Not specified'}
                  </span>
                  {subjectsData?.grade_name && (
                    <span>
                      <strong className="text-foreground">Grade Offering:</strong>{' '}
                      {subjectsData.grade_name}{' '}
                      {subjectsData.section_name ? `• Section ${subjectsData.section_name}` : ''}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'mandatory', 'elective', 'optional', 'extra_curricular'] as const).map(
                    (req) => (
                      <button
                        key={req}
                        type="button"
                        onClick={() => setRequirementFilter(req)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize border cursor-pointer',
                          requirementFilter === req
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground border-border hover:text-foreground',
                        )}
                      >
                        {req.replace('_', ' ')}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {hasSelectionGroups &&
                subjectsData?.individual_elective_selection_supported === false && (
                  <ParentUnsupportedNotice
                    title="Grade-Level Elective Options Shown"
                    description="This grade offers elective subject groups. Because individual per-student elective choices are not persisted in the Stage-1 database, all active grade-level options are displayed."
                  />
                )}

              {/* Subject Grid */}
              <div className="space-y-3">
                <SectionHeader
                  title="Enrolled Subjects & Faculty"
                  description="Click any subject card to filter its published curriculum & syllabus below."
                />

                {filteredSubjects.length === 0 ? (
                  <Card className="p-6 rounded-2xl border-border bg-card text-xs text-muted-foreground">
                    No active subjects match this filter for the current grade offering.
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSubjects.map((sub) => {
                      const isSelected = selectedSubjectId === sub.subject_id;
                      return (
                        <Card
                          key={sub.academic_year_grade_subject_id}
                          onClick={() => setSelectedSubjectId(isSelected ? null : sub.subject_id)}
                          className={cn(
                            'p-5 rounded-2xl border transition-all cursor-pointer space-y-3',
                            isSelected
                              ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.03]'
                              : 'border-border bg-card hover:border-primary/40',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-[11px] font-bold text-primary uppercase">
                                {sub.subject_code}
                                {sub.category_name ? ` • ${sub.category_name}` : ''}
                              </div>
                              <h3 className="text-base font-extrabold text-foreground">
                                {sub.subject_name}
                              </h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                              {sub.subject_requirement.replace('_', ' ')}
                            </Badge>
                          </div>

                          {sub.group_name && (
                            <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg inline-block">
                              Selection Group: {sub.group_name}
                            </div>
                          )}

                          {sub.subject_description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {sub.subject_description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                            {sub.weekly_periods !== null && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {sub.weekly_periods} periods/wk
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Layers className="w-3 h-3" /> {sub.published_curriculum_count}{' '}
                              published syllabus
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {sub.published_resources_count}{' '}
                              resources
                            </span>
                          </div>

                          <div className="pt-2 border-t border-border/60 text-xs">
                            {sub.teachers.length > 0 ? (
                              <div className="space-y-1">
                                {sub.teachers.map((t) => (
                                  <div
                                    key={t.staff_id}
                                    className="flex items-center justify-between gap-2 text-muted-foreground"
                                  >
                                    <span className="inline-flex items-center gap-1 font-semibold text-foreground truncate">
                                      <User className="w-3 h-3 text-primary shrink-0" />
                                      {t.teacher_name}
                                    </span>
                                    <span className="text-[10px] capitalize">
                                      {t.assignment_role}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                Section teacher pending assignment
                              </span>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Published Curriculum Plans & Units */}
              <div className="space-y-3">
                <SectionHeader
                  title="Published Curriculum & Syllabus"
                  description={
                    selectedSubjectId
                      ? 'Filtered to the selected subject. Click the subject card again to show all subjects.'
                      : 'Read-only view of school-published curriculum units and learning outcomes.'
                  }
                />

                {!curriculumData || curriculumData.plans.length === 0 ? (
                  <Card className="p-8 rounded-2xl border-border bg-card text-center text-xs text-muted-foreground">
                    No published curriculum plans exist yet for{' '}
                    {selectedSubjectId ? 'this subject' : 'this grade'}.
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {curriculumData.plans.map((plan) => {
                      const isExpanded = expandedPlanIds[plan.curriculum_plan_id] ?? true;
                      return (
                        <Card
                          key={plan.curriculum_plan_id}
                          className="overflow-hidden rounded-2xl border-border bg-card"
                        >
                          <button
                            type="button"
                            onClick={() => togglePlan(plan.curriculum_plan_id)}
                            className="w-full p-5 flex items-start justify-between gap-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] font-bold">
                                  {plan.subject_name} ({plan.subject_code})
                                </Badge>
                                {plan.framework_name && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {plan.framework_name}
                                    {plan.framework_version_code
                                      ? ` • ${plan.framework_version_code}`
                                      : ''}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-[10px]">
                                  v{plan.version_number} Published
                                </Badge>
                              </div>
                              <h3 className="text-base font-extrabold text-foreground">
                                {plan.plan_title}
                              </h3>
                              {plan.plan_description && (
                                <p className="text-xs text-muted-foreground">
                                  {plan.plan_description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                              <span>{plan.units.length} Units</span>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-border p-5 space-y-4 bg-muted/10">
                              {plan.units.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  No syllabus units recorded inside this curriculum plan.
                                </p>
                              ) : (
                                plan.units.map((unit) => (
                                  <div
                                    key={unit.curriculum_unit_id}
                                    className="p-4 rounded-xl border border-border bg-card space-y-3"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div>
                                        <span className="text-[11px] font-bold text-primary uppercase">
                                          Unit {unit.sequence_number}
                                          {unit.unit_code ? ` • ${unit.unit_code}` : ''}
                                        </span>
                                        <h4 className="text-sm font-bold text-foreground">
                                          {unit.unit_title}
                                        </h4>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                        {unit.planned_duration_periods !== null && (
                                          <Badge variant="outline" className="text-[10px]">
                                            {unit.planned_duration_periods} periods
                                          </Badge>
                                        )}
                                        {unit.planned_start_date && unit.planned_end_date && (
                                          <span>
                                            {new Date(unit.planned_start_date).toLocaleDateString()}{' '}
                                            – {new Date(unit.planned_end_date).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {unit.unit_description && (
                                      <p className="text-xs text-muted-foreground">
                                        {unit.unit_description}
                                      </p>
                                    )}

                                    {unit.outcomes.length > 0 && (
                                      <div className="space-y-1.5 pt-1">
                                        <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                                          <Target className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Learning Outcomes</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                          {unit.outcomes.map((o) => (
                                            <li
                                              key={o.learning_outcome_id}
                                              className="text-xs text-foreground flex items-start justify-between gap-2 bg-muted/40 px-3 py-2 rounded-lg"
                                            >
                                              <span>
                                                {o.outcome_code && (
                                                  <strong className="mr-1.5 text-primary">
                                                    [{o.outcome_code}]
                                                  </strong>
                                                )}
                                                {o.outcome_statement}
                                              </span>
                                              {o.bloom_level && (
                                                <Badge
                                                  variant="outline"
                                                  className="text-[10px] capitalize shrink-0"
                                                >
                                                  {o.bloom_level}
                                                </Badge>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default ParentSubjectsCurriculumPage;
