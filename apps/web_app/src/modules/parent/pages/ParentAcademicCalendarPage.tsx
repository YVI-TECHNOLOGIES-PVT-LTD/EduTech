import React, { useState } from 'react';
import { Calendar, CalendarDays, Clock, Filter, GraduationCap, Sparkles } from 'lucide-react';
import { PageContainer, PageHeader, SectionHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChildCalendarEntryDto, useGetChildCalendarQuery } from '@/shared/api/parentPortal.api';
import { useParentSelectedChild } from '../hooks/useParentSelectedChild';
import { ParentChildSelectorBar } from '../components/ParentChildSelectorBar';
import {
  ParentErrorState,
  ParentLoadingSkeleton,
  ParentNoChildrenState,
} from '../components/ParentStates';

const ENTRY_TYPE_OPTIONS: Array<{
  value: '' | ChildCalendarEntryDto['entry_type'];
  label: string;
}> = [
  { value: '', label: 'All Events' },
  { value: 'holiday', label: 'Holidays' },
  { value: 'vacation', label: 'Vacations' },
  { value: 'exam', label: 'Exams' },
  { value: 'school_event', label: 'School Events' },
  { value: 'school_closure', label: 'Closures' },
];

const WEEKDAY_NAMES: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

function getEntryTypeMeta(type: ChildCalendarEntryDto['entry_type']) {
  switch (type) {
    case 'holiday':
      return {
        label: 'Holiday',
        badgeClass:
          'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      };
    case 'vacation':
      return {
        label: 'Vacation',
        badgeClass:
          'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      };
    case 'exam':
      return {
        label: 'Examination',
        badgeClass:
          'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      };
    case 'school_closure':
      return {
        label: 'School Closure',
        badgeClass:
          'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
      };
    case 'school_event':
    default:
      return {
        label: 'School Event',
        badgeClass:
          'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      };
  }
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime())) return start;
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const startStr = s.toLocaleDateString('en-IN', opts);
  if (Number.isNaN(e.getTime()) || start.slice(0, 10) === end.slice(0, 10)) {
    return startStr;
  }
  return `${startStr} – ${e.toLocaleDateString('en-IN', opts)}`;
}

export const ParentAcademicCalendarPage: React.FC = () => {
  const {
    children,
    selectedChildId,
    selectChild,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useParentSelectedChild();

  const [entryTypeFilter, setEntryTypeFilter] = useState<'' | ChildCalendarEntryDto['entry_type']>(
    '',
  );

  const { data, isLoading, isError, refetch } = useGetChildCalendarQuery(
    {
      childId: selectedChildId || '',
      entryType: entryTypeFilter || undefined,
    },
    { skip: !selectedChildId },
  );

  if (isListLoading) {
    return (
      <PageContainer data-testid="parent-academic-calendar-page">
        <ParentLoadingSkeleton />
      </PageContainer>
    );
  }

  if (isListError) {
    return (
      <PageContainer data-testid="parent-academic-calendar-page">
        <ParentErrorState onRetry={refetchList} />
      </PageContainer>
    );
  }

  return (
    <PageContainer data-testid="parent-academic-calendar-page">
      <PageHeader
        title="Academic Calendar"
        description="Published school terms, configured working days, holidays, vacations, and grade-applicable academic events."
        badge={
          <Badge variant="info" className="text-[10px] font-bold uppercase tracking-wider">
            Published School Calendar
          </Badge>
        }
      />

      {children.length === 0 ? (
        <ParentNoChildrenState />
      ) : (
        <div className="space-y-6">
          <ParentChildSelectorBar
            childrenList={children}
            selectedChildId={selectedChildId}
            onSelectChild={selectChild}
          />

          {isLoading ? (
            <ParentLoadingSkeleton cards={2} />
          ) : isError ? (
            <ParentErrorState onRetry={refetch} />
          ) : !data?.has_active_enrollment ? (
            <Card className="p-8 rounded-2xl border-border bg-card text-center space-y-2">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold text-foreground">No Active Enrollment</p>
              <p className="text-xs text-muted-foreground">
                An active grade enrollment is required to resolve applicable academic calendar terms
                and grade-specific events.
              </p>
            </Card>
          ) : !data.is_published ? (
            <Card className="p-8 rounded-2xl border-border bg-card text-center space-y-2">
              <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold text-foreground">
                Academic Calendar Not Published Yet
              </p>
              <p className="text-xs text-muted-foreground">
                The school administration has not yet published the academic calendar for{' '}
                {data.academic_year_name || 'the active academic year'}.
              </p>
            </Card>
          ) : (
            <>
              {/* Terms & Working Days Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="p-5 rounded-2xl border-border bg-card lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Academic Terms</span>
                    </h2>
                    {data.academic_year_name && (
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        {data.academic_year_name}
                      </Badge>
                    )}
                  </div>

                  {data.terms.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No term windows are configured for this academic year.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.terms.map((term) => (
                        <div
                          key={term.academic_term_id}
                          className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {term.term_name}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              Term {term.term_number}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            {formatDateRange(term.start_date, term.end_date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-5 rounded-2xl border-border bg-card space-y-3">
                  <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Configured Working Days</span>
                  </h2>
                  {data.working_days.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Standard weekly working days have not been published separately.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                        const isWorking = data.working_days.includes(dayNum);
                        return (
                          <div
                            key={dayNum}
                            className={cn(
                              'px-3 py-1.5 rounded-xl text-xs font-bold border',
                              isWorking
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-muted/40 text-muted-foreground border-border/60 opacity-60',
                            )}
                          >
                            {WEEKDAY_NAMES[dayNum] || `Day ${dayNum}`}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {data.grade_name && (
                    <p className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        Showing school-wide and {data.grade_name}-specific calendar events.
                      </span>
                    </p>
                  )}
                </Card>
              </div>

              {/* Filter Bar */}
              <div className="space-y-3">
                <SectionHeader
                  title={`Calendar Entries (${data.entries.length})`}
                  description="Chronological schedule of holidays, vacations, exams, and important school activities."
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground mr-1">
                    <Filter className="w-3.5 h-3.5" />
                    Filter:
                  </span>
                  {ENTRY_TYPE_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value || 'all'}
                      size="sm"
                      variant={entryTypeFilter === opt.value ? 'default' : 'outline'}
                      onClick={() => setEntryTypeFilter(opt.value)}
                      className="rounded-xl text-xs"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Calendar Entries List */}
              {data.entries.length === 0 ? (
                <Card className="p-8 rounded-2xl border-border bg-card text-center space-y-2">
                  <Sparkles className="w-7 h-7 text-muted-foreground mx-auto" />
                  <p className="text-sm font-bold text-foreground">No Matching Calendar Events</p>
                  <p className="text-xs text-muted-foreground">
                    No published calendar entries match the selected filter criteria.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {data.entries.map((entry) => {
                    const meta = getEntryTypeMeta(entry.entry_type);
                    return (
                      <Card
                        key={entry.academic_calendar_entry_id}
                        className="p-4 sm:p-5 rounded-2xl border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-extrabold text-foreground">
                              {entry.entry_name}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] font-bold', meta.badgeClass)}
                            >
                              {meta.label}
                            </Badge>
                            {entry.is_grade_specific ? (
                              <Badge variant="secondary" className="text-[10px] font-semibold">
                                Grade Specific
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-medium text-muted-foreground"
                              >
                                School-Wide
                              </Badge>
                            )}
                            {entry.term_name && (
                              <Badge variant="outline" className="text-[10px] font-medium">
                                {entry.term_name}
                              </Badge>
                            )}
                          </div>

                          {entry.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {entry.description}
                            </p>
                          )}
                        </div>

                        <div className="sm:text-right shrink-0 space-y-0.5">
                          <div className="text-xs font-bold text-foreground">
                            {formatDateRange(entry.start_date, entry.end_date)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {entry.is_all_day
                              ? 'All Day'
                              : entry.start_time && entry.end_time
                                ? `${entry.start_time} – ${entry.end_time}`
                                : 'Scheduled Time'}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default ParentAcademicCalendarPage;
