import {
  AcademicCalendarRepository,
  CalendarOverviewRecord,
  CalendarEntryRecord,
} from '../repositories/academic-calendar.repository';
import {
  ListCalendarEntriesInput,
  ListCalendarEntriesRawInput,
  listCalendarEntriesSchema,
} from '../dto/request/calendar.dto';
import { AcademicError } from '../errors/academic.errors';

export class AcademicCalendarService {
  /**
   * Get academic calendar overview for active or requested academic year
   */
  static async getCalendar(
    orgId: string,
    academicYearId?: string,
  ): Promise<CalendarOverviewRecord> {
    const calendar = await AcademicCalendarRepository.getCalendar(orgId, academicYearId);
    if (!calendar) {
      throw new AcademicError(
        'No academic calendar found for the organization or specified academic year',
        404,
        'CALENDAR_NOT_FOUND',
      );
    }
    return calendar;
  }

  /**
   * List paginated calendar entries with date-range and type filters
   */
  static async listEntries(
    orgId: string,
    rawParams: ListCalendarEntriesRawInput,
  ): Promise<{
    items: CalendarEntryRecord[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const params = listCalendarEntriesSchema.parse(rawParams);
    const { items, total } = await AcademicCalendarRepository.findEntries(orgId, params);
    const page = params.page || 1;
    const limit = params.limit || 50;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get entry details by ID scoped to tenant
   */
  static async getEntryById(orgId: string, entryId: string): Promise<CalendarEntryRecord> {
    const entry = await AcademicCalendarRepository.findEntryById(orgId, entryId);
    if (!entry) {
      throw new AcademicError(
        `Calendar entry with ID '${entryId}' was not found`,
        404,
        'ENTRY_NOT_FOUND',
      );
    }
    return entry;
  }
}
