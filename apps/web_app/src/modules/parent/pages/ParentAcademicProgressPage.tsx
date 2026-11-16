import React from 'react';
import { BookOpen, Calendar, Layers, Target } from 'lucide-react';
import { PageContainer, PageHeader, SectionHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetChildAcademicProgressQuery } from '@/shared/api/parentPortal.api';
import { useParentSelectedChild } from '../hooks/useParentSelectedChild';
import { ParentChildSelectorBar } from '../components/ParentChildSelectorBar';
import {
  ParentErrorState,
  ParentLoadingSkeleton,
  ParentNoChildrenState,
  ParentUnsupportedNotice,
} from '../components/ParentStates';

export const ParentAcademicProgressPage: React.FC = () => {
  const {
    children,
    selectedChildId,
    selectChild,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useParentSelectedChild();

  const { data, isLoading, isError, refetch } = useGetChildAcademicProgressQuery(
    { childId: selectedChildId || '' },
    { skip: !selectedChildId },
  );

  if (isListLoading) {
    return (
      <PageContainer data-testid="parent-academic-progress-page">
        <ParentLoadingSkeleton />
      </PageContainer>
    );
  }

  if (isListError) {
    return (
      <PageContainer data-testid="parent-academic-progress-page">
        <ParentErrorState onRetry={refetchList} />
      </PageContainer>
    );
  }

  return (
    <PageContainer data-testid="parent-academic-progress-page">
      <PageHeader
        title="Academic Progress"
        description="Scheduled syllabus timeline and curriculum learning outcomes coverage for published subjects."
        badge={
          <Badge variant="info" className="text-[10px] font-bold uppercase tracking-wider">
            Curriculum Timeline & Outcomes
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
            onSelectChild={selectChild}
          />

          {isLoading && !data ? (
            <ParentLoadingSkeleton />
          ) : isError ? (
            <ParentErrorState onRetry={refetch} />
          ) : data ? (
            <div className="space-y-6">
              {/* Transparent Database Governance Disclosure */}
              <ParentUnsupportedNotice
                title="Student Marks, Attendance & Verified Mastery Tracking Are Not Yet Enabled"
                description="To ensure complete academic integrity, this portal reports only verified school records. Student attendance logs, term examination marks/GPA, and assignment submission scores are not supported in the finalized Stage-1 database schema."
                details={[
                  'Available below: Published curriculum plans, scheduled syllabus unit timelines, and official learning outcome counts.',
                  'Unsupported in Stage-1 DB: Daily attendance percentages, report card marks, and individual topic completion checks.',
                ]}
              />

              {/* Summary Strip derived solely from published syllabus timelines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 rounded-2xl border-border bg-card space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
                    <span>Published Subjects</span>
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {data.pacing_summary.published_subjects_count}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    With published curriculum plans
                  </div>
                </Card>

                <Card className="p-5 rounded-2xl border-border bg-card space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
                    <span>Syllabus Units</span>
                    <Layers className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {data.pacing_summary.total_units}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {data.pacing_summary.scheduled_in_progress_units} currently in schedule window
                  </div>
                </Card>

                <Card className="p-5 rounded-2xl border-border bg-card space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
                    <span>Learning Outcomes</span>
                    <Target className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {data.pacing_summary.total_outcomes}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Mapped across published units
                  </div>
                </Card>

                <Card className="p-5 rounded-2xl border-border bg-card space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
                    <span>Scheduled Pacing</span>
                    <Calendar className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {data.pacing_summary.scheduled_timeline_percent !== null
                      ? `${data.pacing_summary.scheduled_timeline_percent}%`
                      : 'N/A'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Based strictly on planned unit dates
                  </div>
                </Card>
              </div>

              <SectionHeader
                title="Subject Syllabus Pacing Timeline"
                description="Read-only pacing calculated from planned unit start and end dates on published curriculum plans."
              />

              {data.plans.length === 0 ? (
                <Card className="p-8 rounded-2xl border-border bg-card text-center text-xs text-muted-foreground">
                  No published curriculum plans are available yet for{' '}
                  {data.grade_name || 'this grade'}.
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.plans.map((plan) => {
                    const pct = plan.schedule_pacing.scheduled_timeline_percent ?? 0;
                    return (
                      <Card
                        key={plan.curriculum_plan_id}
                        className="p-5 rounded-2xl border-border bg-card space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-primary uppercase">
                              {plan.subject_name} ({plan.subject_code})
                            </div>
                            <h3 className="text-base font-extrabold text-foreground mt-0.5">
                              {plan.plan_title}
                            </h3>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {plan.schedule_pacing.total_units} Units
                          </Badge>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">
                              Planned Calendar Progress
                            </span>
                            <span className="font-bold text-foreground">
                              {plan.schedule_pacing.scheduled_timeline_percent !== null
                                ? `${pct}%`
                                : 'Undated'}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                          <span>
                            Completed (by schedule):{' '}
                            <strong className="text-foreground">
                              {plan.schedule_pacing.completed_units_by_schedule}
                            </strong>
                          </span>
                          <span>
                            Active Window:{' '}
                            <strong className="text-foreground">
                              {plan.schedule_pacing.in_progress_units_by_schedule}
                            </strong>
                          </span>
                          <span>
                            Outcomes:{' '}
                            <strong className="text-foreground">
                              {plan.schedule_pacing.total_outcomes}
                            </strong>
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </PageContainer>
  );
};

export default ParentAcademicProgressPage;
