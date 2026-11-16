import prisma from '../../../lib/prismaClient';
import { ListCalendarEntriesInput } from '../dto/request/calendar.dto';

export interface CalendarOverviewRecord {
  academic_calendar_id: string;
  academic_year_id: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  status: string;
  version: number;
  published_at: string | null;
  working_days: number[];
  terms_count: number;
  entries_count: number;
}

export interface CalendarEntryRecord {
  academic_calendar_entry_id: string;
  academic_calendar_id: string;
  academic_term_id: string | null;
  term_name: string | null;
  entry_name: string;
  entry_type: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  target_grades?: Array<{ grade_id: string; grade_name: string }>;
}

const ALLOWED_SORT_COLUMNS: Record<string, string> = {
  start_date: 'ace.start_date',
  entry_name: 'ace.entry_name',
  entry_type: 'ace.entry_type',
  created_at: 'ace.created_at',
};

export class AcademicCalendarRepository {
  /**
   * Get academic calendar for active or specified academic year scoped to tenant
   */
  static async getCalendar(
    orgId: string,
    academicYearId?: string,
  ): Promise<CalendarOverviewRecord | null> {
    let yearFilter = '';
    const params: any[] = [orgId];

    if (academicYearId) {
      params.push(academicYearId);
      yearFilter = `AND ay.academic_year_id = $${params.length}::uuid`;
    } else {
      yearFilter = `AND ay.status IN ('teaching', 'open')`;
    }

    const sql = `
      SELECT
        ac.academic_calendar_id,
        ac.academic_year_id,
        ay.academic_year_name,
        ay.start_date::text as start_date,
        ay.end_date::text as end_date,
        ac.status::text as status,
        ac.version,
        ac.published_at::text as published_at,
        COALESCE(
          (SELECT array_agg(weekday ORDER BY weekday) FROM academic_calendar_working_days acwd WHERE acwd.academic_calendar_id = ac.academic_calendar_id),
          ARRAY[]::smallint[]
        ) as working_days,
        (SELECT COUNT(*)::int FROM academic_terms at WHERE at.academic_calendar_id = ac.academic_calendar_id) as terms_count,
        (SELECT COUNT(*)::int FROM academic_calendar_entries ace WHERE ace.academic_calendar_id = ac.academic_calendar_id) as entries_count
      FROM academic_calendars ac
      JOIN academic_years ay ON ay.academic_year_id = ac.academic_year_id
      WHERE ay.org_id = $1::uuid ${yearFilter}
      ORDER BY ay.start_date DESC
      LIMIT 1
    `;

    const res = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
    if (!res || res.length === 0) return null;

    const row = res[0];
    return {
      academic_calendar_id: row.academic_calendar_id,
      academic_year_id: row.academic_year_id,
      academic_year_name: row.academic_year_name,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      version: row.version,
      published_at: row.published_at,
      working_days: row.working_days || [],
      terms_count: row.terms_count || 0,
      entries_count: row.entries_count || 0,
    };
  }

  /**
   * Find paginated calendar entries with date-range and type filters
   */
  static async findEntries(
    orgId: string,
    params: ListCalendarEntriesInput,
  ): Promise<{ items: CalendarEntryRecord[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['ay.org_id = $1::uuid'];
    const queryParams: any[] = [orgId];

    if (params.calendar_id) {
      queryParams.push(params.calendar_id);
      conditions.push(`ace.academic_calendar_id = $${queryParams.length}::uuid`);
    }

    if (params.academic_year_id) {
      queryParams.push(params.academic_year_id);
      conditions.push(`ay.academic_year_id = $${queryParams.length}::uuid`);
    }

    if (params.term_id) {
      queryParams.push(params.term_id);
      conditions.push(`ace.academic_term_id = $${queryParams.length}::uuid`);
    }

    if (params.entry_type) {
      queryParams.push(params.entry_type);
      conditions.push(`ace.entry_type = $${queryParams.length}::academic_calendar_entry_type`);
    }

    if (params.start_date) {
      queryParams.push(params.start_date);
      conditions.push(`ace.end_date >= $${queryParams.length}::date`);
    }

    if (params.end_date) {
      queryParams.push(params.end_date);
      conditions.push(`ace.start_date <= $${queryParams.length}::date`);
    }

    if (params.grade_id) {
      queryParams.push(params.grade_id);
      const gradeIdx = queryParams.length;
      conditions.push(`
        EXISTS (
          SELECT 1 FROM academic_calendar_entry_grades aceg
          JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aceg.academic_year_grade_id
          WHERE aceg.academic_calendar_entry_id = ace.academic_calendar_entry_id
            AND ayg.grade_id = $${gradeIdx}::uuid
        )
      `);
    }

    if (params.search && params.search.trim().length > 0) {
      queryParams.push(`%${params.search.trim()}%`);
      const idx = queryParams.length;
      conditions.push(`(ace.entry_name ILIKE $${idx} OR ace.description ILIKE $${idx})`);
    }

    const whereClause = conditions.join(' AND ');
    const sortColumn = (params.sortBy && ALLOWED_SORT_COLUMNS[params.sortBy]) || 'ace.start_date';
    const sortOrder = params.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countSql = `
      SELECT COUNT(*)::text as total
      FROM academic_calendar_entries ace
      JOIN academic_calendars ac ON ac.academic_calendar_id = ace.academic_calendar_id
      JOIN academic_years ay ON ay.academic_year_id = ac.academic_year_id
      WHERE ${whereClause}
    `;

    const countRes = await prisma.$queryRawUnsafe<Array<{ total: string }>>(
      countSql,
      ...queryParams,
    );
    const total = parseInt(countRes[0]?.total || '0', 10);

    queryParams.push(limit);
    const limitIdx = queryParams.length;
    queryParams.push(offset);
    const offsetIdx = queryParams.length;

    const dataSql = `
      SELECT
        ace.academic_calendar_entry_id,
        ace.academic_calendar_id,
        ace.academic_term_id,
        at.term_name,
        ace.entry_name,
        ace.entry_type::text as entry_type,
        ace.start_date::text as start_date,
        ace.end_date::text as end_date,
        ace.is_all_day,
        ace.start_time::text as start_time,
        ace.end_time::text as end_time,
        ace.description,
        ace.created_at::text as created_at,
        ace.updated_at::text as updated_at
      FROM academic_calendar_entries ace
      JOIN academic_calendars ac ON ac.academic_calendar_id = ace.academic_calendar_id
      JOIN academic_years ay ON ay.academic_year_id = ac.academic_year_id
      LEFT JOIN academic_terms at ON at.academic_term_id = ace.academic_term_id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${limitIdx}::integer OFFSET $${offsetIdx}::integer
    `;

    const items = await prisma.$queryRawUnsafe<CalendarEntryRecord[]>(dataSql, ...queryParams);
    return { items, total };
  }

  /**
   * Find entry by ID with target grades scoped to tenant
   */
  static async findEntryById(orgId: string, entryId: string): Promise<CalendarEntryRecord | null> {
    const sql = `
      SELECT
        ace.academic_calendar_entry_id,
        ace.academic_calendar_id,
        ace.academic_term_id,
        at.term_name,
        ace.entry_name,
        ace.entry_type::text as entry_type,
        ace.start_date::text as start_date,
        ace.end_date::text as end_date,
        ace.is_all_day,
        ace.start_time::text as start_time,
        ace.end_time::text as end_time,
        ace.description,
        ace.created_at::text as created_at,
        ace.updated_at::text as updated_at
      FROM academic_calendar_entries ace
      JOIN academic_calendars ac ON ac.academic_calendar_id = ace.academic_calendar_id
      JOIN academic_years ay ON ay.academic_year_id = ac.academic_year_id
      LEFT JOIN academic_terms at ON at.academic_term_id = ace.academic_term_id
      WHERE ace.academic_calendar_entry_id = $1::uuid AND ay.org_id = $2::uuid
      LIMIT 1
    `;

    const res = await prisma.$queryRawUnsafe<CalendarEntryRecord[]>(sql, entryId, orgId);
    if (!res || res.length === 0) return null;

    const entry = res[0];

    const gradesSql = `
      SELECT g.grade_id, g.grade_name
      FROM academic_calendar_entry_grades aceg
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aceg.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      WHERE aceg.academic_calendar_entry_id = $1::uuid
      ORDER BY g.display_order ASC
    `;
    const grades = await prisma.$queryRawUnsafe<Array<{ grade_id: string; grade_name: string }>>(
      gradesSql,
      entryId,
    );
    entry.target_grades = grades;

    return entry;
  }

  /**
   * Calendar metrics for academic overview
   */
  static async getMetrics(orgId: string): Promise<{
    has_calendar: boolean;
    calendar_status: string | null;
    total_entries: number;
    total_holidays: number;
    upcoming_events_30_days: number;
  }> {
    const sql = `
      SELECT
        ac.status::text as calendar_status,
        (SELECT COUNT(*)::int FROM academic_calendar_entries ace JOIN academic_calendars c ON c.academic_calendar_id = ace.academic_calendar_id JOIN academic_years y ON y.academic_year_id = c.academic_year_id WHERE y.org_id = $1::uuid) as total_entries,
        (SELECT COUNT(*)::int FROM academic_calendar_entries ace JOIN academic_calendars c ON c.academic_calendar_id = ace.academic_calendar_id JOIN academic_years y ON y.academic_year_id = c.academic_year_id WHERE y.org_id = $1::uuid AND ace.entry_type IN ('holiday', 'vacation')) as total_holidays,
        (SELECT COUNT(*)::int FROM academic_calendar_entries ace JOIN academic_calendars c ON c.academic_calendar_id = ace.academic_calendar_id JOIN academic_years y ON y.academic_year_id = c.academic_year_id WHERE y.org_id = $1::uuid AND ace.start_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')) as upcoming_events_30_days
      FROM academic_calendars ac
      JOIN academic_years ay ON ay.academic_year_id = ac.academic_year_id
      WHERE ay.org_id = $1::uuid
      ORDER BY ay.start_date DESC
      LIMIT 1
    `;

    const res = await prisma.$queryRawUnsafe<any[]>(sql, orgId);
    if (!res || res.length === 0) {
      return {
        has_calendar: false,
        calendar_status: null,
        total_entries: 0,
        total_holidays: 0,
        upcoming_events_30_days: 0,
      };
    }

    const row = res[0];
    return {
      has_calendar: true,
      calendar_status: row.calendar_status,
      total_entries: row.total_entries || 0,
      total_holidays: row.total_holidays || 0,
      upcoming_events_30_days: row.upcoming_events_30_days || 0,
    };
  }
}
