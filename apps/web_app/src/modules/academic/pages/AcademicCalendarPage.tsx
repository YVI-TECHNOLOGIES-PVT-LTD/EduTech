import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AcademicManagementService,
  AcademicYearItem,
  CalendarOverview,
  CalendarEntryItem,
  AcademicTermItem,
  extractAcademicApiError,
} from '../services/academic.service';
import {
  AcademicPageHeader,
  AcademicStatusBanner,
  formatShortDate,
  getAcademicStatusBadgeClass,
} from '../components/AcademicPageHeader';

const DAY_SHORT: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

export const AcademicCalendarPage: React.FC = () => {
  const [years, setYears] = useState<AcademicYearItem[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [calendarOverview, setCalendarOverview] = useState<CalendarOverview | null>(null);
  const [terms, setTerms] = useState<AcademicTermItem[]>([]);
  const [events, setEvents] = useState<CalendarEntryItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [entryType, setEntryType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCalendarData = useCallback(
    async (yearId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const [yearsRes, calRes, termsRes, eventsRes] = await Promise.all([
          AcademicManagementService.listAcademicYears({ limit: 50 }),
          AcademicManagementService.getCalendarOverview(yearId || undefined),
          AcademicManagementService.listTerms({
            academic_year_id: yearId || undefined,
          }),
          AcademicManagementService.listCalendarEvents({
            academic_year_id: yearId || undefined,
            entry_type: entryType || undefined,
            search: search.trim() || undefined,
            limit: 100,
          }),
        ]);

        setYears(Array.isArray(yearsRes.items) ? yearsRes.items : []);
        setCalendarOverview(calRes && !Array.isArray(calRes) ? calRes : null);
        setTerms(Array.isArray(termsRes) ? termsRes : []);
        setEvents(Array.isArray(eventsRes.items) ? eventsRes.items : []);
      } catch (err: any) {
        setError(extractAcademicApiError(err, 'Failed to load academic calendar & terms'));
      } finally {
        setLoading(false);
      }
    },
    [entryType, search],
  );

  useEffect(() => {
    loadCalendarData(selectedYearId);
  }, [loadCalendarData, selectedYearId]);

  return (
    <div data-testid="academic-calendar-page" className="p-6 max-w-7xl mx-auto space-y-6">
      <AcademicPageHeader
        title="Academic Calendar & Terms"
        subtitle="Master institutional calendar, active teaching working days, term boundaries, holidays, and academic events."
        icon={CalendarDays}
        onRefresh={() => loadCalendarData(selectedYearId)}
        loading={loading}
        actions={
          <select
            aria-label="Filter calendar by academic year"
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold"
          >
            <option value="">Active Academic Session</option>
            {years.map((y) => (
              <option key={y.academic_year_id} value={y.academic_year_id}>
                {y.academic_year_name} ({y.status})
              </option>
            ))}
          </select>
        }
      />

      <AcademicStatusBanner error={error} />

      {/* Master Calendar Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base font-bold">
                {calendarOverview
                  ? `${calendarOverview.academic_year_name} Master Calendar (v${calendarOverview.version})`
                  : 'Master Academic Calendar'}
              </CardTitle>
              <CardDescription>
                {calendarOverview
                  ? `${formatShortDate(calendarOverview.start_date)} – ${formatShortDate(calendarOverview.end_date)} · ${calendarOverview.terms_count} term(s) · ${calendarOverview.entries_count} scheduled entry(ies)`
                  : 'No academic calendar configured for the selected session'}
              </CardDescription>
            </div>
            {calendarOverview && (
              <Badge
                variant="outline"
                className={getAcademicStatusBadgeClass(calendarOverview.status)}
              >
                {calendarOverview.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        {calendarOverview && (
          <CardContent className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Working Days:</span>
            {!Array.isArray(calendarOverview.working_days) ||
            calendarOverview.working_days.length === 0 ? (
              <span className="text-xs text-muted-foreground">Not specified</span>
            ) : (
              calendarOverview.working_days.map((d) => (
                <Badge key={d} variant="outline">
                  {DAY_SHORT[d] || `Day ${d}`}
                </Badge>
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* Academic Terms Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Academic Terms ({terms.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {terms.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No academic terms configured for the selected session.
              </CardContent>
            </Card>
          ) : (
            terms.map((term) => (
              <Card key={term.academic_term_id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-indigo-600">
                      Term #{term.term_number}
                    </span>
                    <Badge
                      variant="outline"
                      className={getAcademicStatusBadgeClass(term.is_active ? 'active' : 'draft')}
                    >
                      {term.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold">{term.term_name}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  <div>
                    {formatShortDate(term.start_date)} — {formatShortDate(term.end_date)}
                  </div>
                  <div className="mt-1">{term.academic_year_name}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Calendar Entries */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold">
              Calendar Events & Holidays ({events.length})
            </CardTitle>
            <CardDescription>
              Search holidays, examinations, orientations, and academic events.
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-2.5" />
              <Input
                aria-label="Search calendar events"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 w-52"
              />
            </div>
            <select
              aria-label="Filter by event type"
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">All Types</option>
              <option value="holiday">Holidays</option>
              <option value="exam">Examinations</option>
              <option value="event">School Events</option>
              <option value="orientation">Orientation</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {events.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {loading
                ? 'Loading calendar events...'
                : 'No calendar events match the current filter.'}
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.academic_calendar_entry_id}
                className="p-3.5 rounded-xl border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{ev.entry_name}</span>
                    <Badge variant="outline">{ev.entry_type}</Badge>
                    {ev.term_name && <Badge variant="secondary">{ev.term_name}</Badge>}
                  </div>
                  {ev.description && (
                    <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>
                  )}
                </div>
                <div className="text-xs font-semibold text-muted-foreground shrink-0">
                  {formatShortDate(ev.start_date)}
                  {ev.end_date && ev.end_date !== ev.start_date
                    ? ` – ${formatShortDate(ev.end_date)}`
                    : ''}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcademicCalendarPage;
