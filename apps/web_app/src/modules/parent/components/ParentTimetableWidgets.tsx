import React, { useState, useEffect } from 'react';
import {
  Clock,
  Coffee,
  Utensils,
  User,
  MapPin,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  TimetableSlotDto,
  TodayTimetableResponse,
  WeeklyTimetableResponse,
} from '@/shared/api/parentPortal.api';

function StatusBadge({ status }: { status: TimetableSlotDto['status'] }) {
  switch (status) {
    case 'ongoing':
      return <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Ongoing</Badge>;
    case 'upcoming':
      return (
        <Badge variant="info" className="text-[10px] font-bold">
          Upcoming
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="secondary" className="text-[10px] font-bold">
          Completed
        </Badge>
      );
    case 'break':
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-bold text-amber-700 dark:text-amber-400 border-amber-300"
        >
          Break
        </Badge>
      );
    case 'lunch':
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-bold text-orange-700 dark:text-orange-400 border-orange-300"
        >
          Lunch
        </Badge>
      );
    case 'free':
      return (
        <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
          Free Period
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] font-semibold">
          Scheduled
        </Badge>
      );
  }
}

export const TodayScheduleWidget: React.FC<{
  timetable?: TodayTimetableResponse | null;
  onViewFullTimetable?: () => void;
  compact?: boolean;
}> = ({ timetable, onViewFullTimetable, compact = false }) => {
  if (!timetable) return null;

  if (!timetable.has_active_enrollment) {
    return (
      <Card className="p-6 rounded-2xl border-border bg-card">
        <p className="text-xs text-muted-foreground">
          Active grade and section enrollment is required before today&apos;s timetable can be
          displayed.
        </p>
      </Card>
    );
  }

  if (!timetable.has_section_assignment) {
    return (
      <Card className="p-6 rounded-2xl border-border bg-card">
        <p className="text-xs text-muted-foreground">
          Section allocation is pending for {timetable.grade_name || 'this grade'}. Once a section
          is assigned, the class schedule will appear here.
        </p>
      </Card>
    );
  }

  if (!timetable.has_published_timetable) {
    return (
      <Card className="p-6 rounded-2xl border-border bg-card space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">No Published Timetable Yet</span>
          <Badge variant="secondary" className="text-[10px]">
            {timetable.grade_name} • Sec {timetable.section_name}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          The school has not yet published a timetable version for {timetable.academic_year_name}.
        </p>
      </Card>
    );
  }

  if (!timetable.is_working_day || timetable.slots.length === 0) {
    return (
      <Card className="p-6 rounded-2xl border-border bg-card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {timetable.weekday_name} ({timetable.date})
            </h4>
            <p className="text-xs text-muted-foreground">
              No scheduled classes on {timetable.weekday_name} for {timetable.grade_name} • Sec{' '}
              {timetable.section_name}.
            </p>
          </div>
          {onViewFullTimetable && (
            <Button variant="outline" size="sm" onClick={onViewFullTimetable} className="gap-1.5">
              <span>View Weekly Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {(timetable.current_class || timetable.next_class) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {timetable.current_class && (
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/20 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <span className="inline-flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5" />
                  Ongoing Class
                </span>
                <span>
                  {timetable.current_class.start_time} – {timetable.current_class.end_time}
                </span>
              </div>
              <div className="text-base font-extrabold text-foreground">
                {timetable.current_class.subject_name}
              </div>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                {timetable.current_class.teacher_name && (
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" /> {timetable.current_class.teacher_name}
                  </span>
                )}
                {timetable.current_class.classroom_label && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {timetable.current_class.classroom_label}
                  </span>
                )}
              </div>
            </div>
          )}

          {timetable.next_class && (
            <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/20 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Next Class
                </span>
                <span>
                  {timetable.next_class.start_time} – {timetable.next_class.end_time}
                </span>
              </div>
              <div className="text-base font-extrabold text-foreground">
                {timetable.next_class.subject_name}
              </div>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                {timetable.next_class.teacher_name && (
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" /> {timetable.next_class.teacher_name}
                  </span>
                )}
                {timetable.next_class.classroom_label && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {timetable.next_class.classroom_label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {(compact ? timetable.slots.slice(0, 7) : timetable.slots).map((slot) => {
          const isBreak = slot.is_break;
          return (
            <div
              key={`${slot.weekday}-${slot.period_number}-${slot.period_name}`}
              className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:px-4 rounded-xl border transition-colors',
                slot.status === 'ongoing'
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : isBreak
                    ? 'border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10'
                    : 'border-border/80 bg-card',
              )}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="text-center min-w-[68px] px-2 py-1.5 rounded-lg bg-muted/60 text-[11px] font-bold text-foreground shrink-0">
                  <div>{slot.start_time}</div>
                  <div className="text-[10px] text-muted-foreground">{slot.end_time}</div>
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {slot.period_name || `Period ${slot.period_number}`}
                    </span>
                    <StatusBadge status={slot.status} />
                  </div>
                  {isBreak ? (
                    <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      {slot.period_type === 'lunch' ? (
                        <Utensils className="w-3.5 h-3.5" />
                      ) : (
                        <Coffee className="w-3.5 h-3.5" />
                      )}
                      <span>{slot.period_name}</span>
                    </div>
                  ) : slot.subject_name ? (
                    <div className="text-sm font-bold text-foreground flex items-center gap-2 flex-wrap">
                      <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{slot.subject_name}</span>
                      {slot.subject_code && (
                        <span className="text-[11px] font-normal text-muted-foreground">
                          ({slot.subject_code})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">
                      No class scheduled in this period
                    </div>
                  )}

                  {!isBreak && (slot.teacher_name || slot.classroom_label) && (
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                      {slot.teacher_name && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {slot.teacher_name}
                          {slot.co_teachers?.length > 0 && `, ${slot.co_teachers.join(', ')}`}
                        </span>
                      )}
                      {slot.classroom_label && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {slot.classroom_label}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {slot.status === 'completed' && !isBreak && (
                <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 hidden sm:block shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {onViewFullTimetable && (
        <div className="flex justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onViewFullTimetable} className="gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>View Full Timetable</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export const WeeklyTimetableMatrix: React.FC<{
  weekly?: WeeklyTimetableResponse | null;
  compact?: boolean;
}> = ({ weekly, compact = false }) => {
  const [mobileWeekday, setMobileWeekday] = useState<number>(weekly?.current_weekday || 1);

  useEffect(() => {
    if (weekly?.days && weekly.days.length > 0) {
      const todayMatch = weekly.days.find((d) => d.is_today);
      setMobileWeekday(todayMatch ? todayMatch.weekday : weekly.days[0].weekday);
    }
  }, [weekly?.child_id, weekly?.days]);

  if (!weekly) return null;

  if (!weekly.has_published_timetable || weekly.days.length === 0) {
    return (
      <Card className="p-6 rounded-2xl border-border bg-card">
        <p className="text-xs text-muted-foreground">
          {weekly.has_section_assignment === false
            ? 'Section allocation is pending before a weekly timetable can be shown.'
            : 'No published weekly timetable is currently available for this academic year.'}
        </p>
      </Card>
    );
  }

  // Derive union of periods ordered by period_number
  const periodRows =
    weekly.periods.length > 0
      ? weekly.periods.map((p) => ({
          period_number: p.period_number,
          period_name: p.period_name,
          period_type: p.period_type,
          start_time: p.start_time,
          end_time: p.end_time,
        }))
      : Array.from(
          new Map(
            weekly.days
              .flatMap((d) => d.slots)
              .map((s) => [
                s.period_number,
                {
                  period_number: s.period_number,
                  period_name: s.period_name,
                  period_type: s.period_type,
                  start_time: s.start_time,
                  end_time: s.end_time,
                },
              ]),
          ).values(),
        ).sort((a, b) => a.period_number - b.period_number);

  const activeMobileDay = weekly.days.find((d) => d.weekday === mobileWeekday) || weekly.days[0];

  return (
    <div className="space-y-4">
      {/* Mobile / Narrow Day Selector View */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {weekly.days.map((day) => (
            <button
              key={day.weekday}
              type="button"
              onClick={() => setMobileWeekday(day.weekday)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer',
                day.weekday === activeMobileDay.weekday
                  ? 'bg-primary text-primary-foreground border-primary'
                  : day.is_today
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-card text-muted-foreground border-border',
              )}
            >
              {day.weekday_name.slice(0, 3)}
              {day.is_today ? ' (Today)' : ''}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {activeMobileDay.slots.map((slot) => (
            <div
              key={`${activeMobileDay.weekday}-${slot.period_number}`}
              className={cn(
                'p-3 rounded-xl border text-xs',
                slot.is_break
                  ? 'bg-amber-50/50 dark:bg-amber-950/15 border-amber-200/70'
                  : 'bg-card border-border/80',
              )}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>
                  {slot.period_name} ({slot.start_time}–{slot.end_time})
                </span>
                <StatusBadge status={slot.status} />
              </div>
              {slot.is_break ? (
                <div className="text-amber-700 dark:text-amber-300 font-semibold">
                  {slot.period_name}
                </div>
              ) : slot.subject_name ? (
                <div>
                  <div className="font-bold text-foreground text-sm">{slot.subject_name}</div>
                  <div className="text-muted-foreground mt-0.5 flex flex-wrap gap-3">
                    {slot.teacher_name && <span>{slot.teacher_name}</span>}
                    {slot.classroom_label && <span>Room: {slot.classroom_label}</span>}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground italic">Free / Unscheduled</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop / Tablet Matrix */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
        <table className="w-full text-xs border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="p-3 text-left font-bold text-muted-foreground w-[150px] border-r border-border">
                Period / Time
              </th>
              {weekly.days.map((day) => (
                <th
                  key={day.weekday}
                  className={cn(
                    'p-3 text-left font-bold border-r last:border-r-0 border-border',
                    day.is_today ? 'bg-primary/10 text-primary' : 'text-foreground',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{day.weekday_name}</span>
                    {day.is_today && (
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">
                        Today
                      </Badge>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodRows.map((period) => {
              const isBreakRow = period.period_type !== 'teaching';
              return (
                <tr
                  key={period.period_number}
                  className={cn(
                    'border-b last:border-b-0 border-border/80',
                    isBreakRow ? 'bg-amber-50/40 dark:bg-amber-950/15' : '',
                  )}
                >
                  <td className="p-3 border-r border-border align-top bg-muted/20">
                    <div className="font-bold text-foreground">{period.period_name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {period.start_time} – {period.end_time}
                    </div>
                  </td>

                  {isBreakRow ? (
                    <td
                      colSpan={weekly.days.length}
                      className="p-2.5 text-center font-bold text-amber-700 dark:text-amber-300 tracking-wide uppercase text-[11px]"
                    >
                      {period.period_name} ({period.period_type})
                    </td>
                  ) : (
                    weekly.days.map((day) => {
                      const slot = day.slots.find((s) => s.period_number === period.period_number);
                      return (
                        <td
                          key={`${day.weekday}-${period.period_number}`}
                          className={cn(
                            'p-2.5 border-r last:border-r-0 border-border/70 align-top',
                            day.is_today ? 'bg-primary/[0.03]' : '',
                          )}
                        >
                          {slot?.subject_name ? (
                            <div className="space-y-1">
                              <div className="font-bold text-foreground leading-snug">
                                {slot.subject_name}
                              </div>
                              {!compact && slot.teacher_name && (
                                <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                                  {slot.teacher_name}
                                </div>
                              )}
                              {compact && slot.teacher_name && (
                                <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                                  {slot.teacher_name}
                                </div>
                              )}
                              {slot.classroom_label && (
                                <div className="text-[10px] font-medium text-primary/80">
                                  {slot.classroom_label}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60">—</span>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
