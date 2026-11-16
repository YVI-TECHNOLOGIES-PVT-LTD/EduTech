import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, Info } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  useGetChildTodayTimetableQuery,
  useGetChildWeeklyTimetableQuery,
} from '@/shared/api/parentPortal.api';
import { useParentSelectedChild } from '../hooks/useParentSelectedChild';
import { ParentChildSelectorBar } from '../components/ParentChildSelectorBar';
import {
  ParentErrorState,
  ParentLoadingSkeleton,
  ParentNoChildrenState,
} from '../components/ParentStates';
import { TodayScheduleWidget, WeeklyTimetableMatrix } from '../components/ParentTimetableWidgets';

const DAY_LABELS: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

export const ParentTimetablePage: React.FC = () => {
  const {
    children,
    selectedChildId,
    selectChild,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useParentSelectedChild();

  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedWeekday, setSelectedWeekday] = useState<number | undefined>(undefined);

  const {
    data: weekly,
    isLoading: isWeeklyLoading,
    isError: isWeeklyError,
    refetch: refetchWeekly,
  } = useGetChildWeeklyTimetableQuery(selectedChildId || '', {
    skip: !selectedChildId,
  });

  const {
    data: daily,
    isLoading: isDailyLoading,
    isError: isDailyError,
    refetch: refetchDaily,
  } = useGetChildTodayTimetableQuery(
    { childId: selectedChildId || '', weekday: selectedWeekday },
    { skip: !selectedChildId },
  );

  useEffect(() => {
    setSelectedWeekday(undefined);
  }, [selectedChildId]);

  if (isListLoading) {
    return (
      <PageContainer data-testid="parent-timetable-page">
        <ParentLoadingSkeleton />
      </PageContainer>
    );
  }

  if (isListError) {
    return (
      <PageContainer data-testid="parent-timetable-page">
        <ParentErrorState onRetry={refetchList} />
      </PageContainer>
    );
  }

  const workingDays =
    weekly?.working_weekdays && weekly.working_weekdays.length > 0
      ? weekly.working_weekdays
      : [1, 2, 3, 4, 5];

  return (
    <PageContainer data-testid="parent-timetable-page">
      <PageHeader
        title="Timetable"
        description="Published daily class timings, period schedule, break and lunch slots, faculty, and classrooms."
        badge={
          <Badge variant="info" className="text-[10px] font-bold uppercase tracking-wider">
            Published Class Schedule
          </Badge>
        }
        actions={
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
                viewMode === 'weekly'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Weekly View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
                viewMode === 'daily'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Daily Detail</span>
            </button>
          </div>
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

          {(isWeeklyLoading || isDailyLoading) && !weekly && !daily ? (
            <ParentLoadingSkeleton cards={2} />
          ) : isWeeklyError || isDailyError ? (
            <ParentErrorState
              onRetry={() => {
                refetchWeekly();
                refetchDaily();
              }}
            />
          ) : (
            <div className="space-y-6">
              {weekly?.published_version && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    <span>
                      Showing published timetable{' '}
                      <strong className="text-foreground">
                        {weekly.published_version.version_name ||
                          `v${weekly.published_version.version_number}`}
                      </strong>{' '}
                      for {weekly.grade_name} • Sec {weekly.section_name}
                    </span>
                  </span>
                  {weekly.published_version.published_at && (
                    <span>
                      Published:{' '}
                      {new Date(weekly.published_version.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {viewMode === 'daily' ? (
                <Card className="p-5 sm:p-6 rounded-3xl border-border bg-card space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-foreground">
                        {daily?.weekday_name || 'Daily Schedule'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Includes teaching periods, co-teachers, classrooms, breaks, and lunch.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {workingDays.map((dayNum) => {
                        const activeDay = selectedWeekday ?? daily?.weekday;
                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => setSelectedWeekday(dayNum)}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer',
                              activeDay === dayNum
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/40 text-muted-foreground hover:text-foreground border-border',
                            )}
                          >
                            {DAY_LABELS[dayNum] || `D${dayNum}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <TodayScheduleWidget timetable={daily} />
                </Card>
              ) : (
                <div className="space-y-6">
                  <WeeklyTimetableMatrix weekly={weekly} />
                  {daily && (
                    <Card className="p-5 sm:p-6 rounded-3xl border-border bg-card space-y-4">
                      <h3 className="text-base font-extrabold text-foreground">
                        Today&apos;s Class Highlights ({daily.weekday_name})
                      </h3>
                      <TodayScheduleWidget timetable={daily} />
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default ParentTimetablePage;
