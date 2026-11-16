import {
  TimetableRepository,
  TimetableVersionRecord,
  TimetableEntryDetailRecord,
  ClassroomRecord,
} from '../repositories/timetable.repository';
import { ListTimetableVersionsRawInput, ListClassroomsInput } from '../dto/request/timetable.dto';
import { AcademicError } from '../errors/academic.errors';

export class TimetableService {
  /**
   * List paginated timetable versions for tenant
   */
  static async listTimetables(
    orgId: string,
    params: ListTimetableVersionsRawInput = {},
  ): Promise<{
    items: TimetableVersionRecord[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = params.page !== undefined ? Number(params.page) : 1;
    const limit = params.limit !== undefined ? Number(params.limit) : 20;

    const { items, total } = await TimetableRepository.findVersions(orgId, params);

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
   * Get single timetable version by ID scoped to tenant
   */
  static async getTimetableById(orgId: string, versionId: string): Promise<TimetableVersionRecord> {
    const version = await TimetableRepository.findVersionById(orgId, versionId);
    if (!version) {
      throw new AcademicError(`Timetable version '${versionId}' was not found`, 404, 'NOT_FOUND');
    }
    return version;
  }

  /**
   * Get timetable operational overview metrics
   */
  static async getOverview(orgId: string) {
    return TimetableRepository.getOverview(orgId);
  }

  /**
   * Get timetable for a section grouped by weekday
   */
  static async getSectionTimetable(
    orgId: string,
    sectionId: string,
    versionId?: string,
  ): Promise<{
    section_id: string;
    timetable_version_id: string | null;
    total_entries: number;
    schedule_by_day: Record<number, TimetableEntryDetailRecord[]>;
  }> {
    const entries = await TimetableRepository.getSectionEntries(orgId, sectionId, versionId);
    if (entries.length === 0) {
      // Check if section exists in tenant
      const activeVersion = await TimetableRepository.findPublishedVersion(orgId);
      return {
        section_id: sectionId,
        timetable_version_id: versionId || activeVersion?.timetable_version_id || null,
        total_entries: 0,
        schedule_by_day: { 1: [], 2: [], 3: [], 4: [], 5: [] },
      };
    }

    const scheduleByDay: Record<number, TimetableEntryDetailRecord[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };
    for (const entry of entries) {
      if (!scheduleByDay[entry.weekday]) {
        scheduleByDay[entry.weekday] = [];
      }
      scheduleByDay[entry.weekday].push(entry);
    }

    return {
      section_id: sectionId,
      timetable_version_id: entries[0]?.timetable_version_id || null,
      total_entries: entries.length,
      schedule_by_day: scheduleByDay,
    };
  }

  /**
   * Get timetable for an academic-year grade offering (class)
   */
  static async getClassTimetable(
    orgId: string,
    academicYearGradeId: string,
    versionId?: string,
  ): Promise<{
    academic_year_grade_id: string;
    timetable_version_id: string | null;
    total_entries: number;
    entries: TimetableEntryDetailRecord[];
  }> {
    const entries = await TimetableRepository.getClassEntries(
      orgId,
      academicYearGradeId,
      versionId,
    );

    return {
      academic_year_grade_id: academicYearGradeId,
      timetable_version_id: entries[0]?.timetable_version_id || null,
      total_entries: entries.length,
      entries,
    };
  }

  /**
   * Get timetable for a specific teacher
   */
  static async getTeacherTimetable(
    orgId: string,
    staffId: string,
    versionId?: string,
    academicYearId?: string,
  ): Promise<{
    staff_id: string;
    timetable_version_id: string | null;
    weekly_teaching_periods: number;
    schedule_by_day: Record<number, TimetableEntryDetailRecord[]>;
  }> {
    const entries = await TimetableRepository.getTeacherEntries(
      orgId,
      staffId,
      versionId,
      academicYearId,
    );

    if (entries.length === 0) {
      return {
        staff_id: staffId,
        timetable_version_id: versionId || null,
        weekly_teaching_periods: 0,
        schedule_by_day: { 1: [], 2: [], 3: [], 4: [], 5: [] },
      };
    }

    const scheduleByDay: Record<number, TimetableEntryDetailRecord[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };
    for (const entry of entries) {
      if (!scheduleByDay[entry.weekday]) {
        scheduleByDay[entry.weekday] = [];
      }
      scheduleByDay[entry.weekday].push(entry);
    }

    return {
      staff_id: staffId,
      timetable_version_id: entries[0]?.timetable_version_id || null,
      weekly_teaching_periods: entries.length,
      schedule_by_day: scheduleByDay,
    };
  }

  /**
   * List classrooms for tenant
   */
  static async listClassrooms(
    orgId: string,
    params: ListClassroomsInput,
  ): Promise<ClassroomRecord[]> {
    return TimetableRepository.findClassrooms(orgId, params);
  }

  /**
   * Get room utilization schedule
   */
  static async getClassroomSchedule(
    orgId: string,
    classroomId: string,
    versionId?: string,
  ): Promise<{
    classroom_id: string;
    room_code: string;
    room_name: string;
    capacity: number | null;
    total_scheduled_periods: number;
    schedule_by_day: Record<number, TimetableEntryDetailRecord[]>;
  }> {
    const classroom = await TimetableRepository.findClassroomById(orgId, classroomId);
    if (!classroom) {
      throw new AcademicError(`Classroom '${classroomId}' was not found`, 404, 'NOT_FOUND');
    }

    const entries = await TimetableRepository.getClassroomSchedule(orgId, classroomId, versionId);

    const scheduleByDay: Record<number, TimetableEntryDetailRecord[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };
    for (const entry of entries) {
      if (!scheduleByDay[entry.weekday]) {
        scheduleByDay[entry.weekday] = [];
      }
      scheduleByDay[entry.weekday].push(entry);
    }

    return {
      classroom_id: classroom.classroom_id,
      room_code: classroom.room_code,
      room_name: classroom.room_name,
      capacity: classroom.capacity,
      total_scheduled_periods: entries.length,
      schedule_by_day: scheduleByDay,
    };
  }

  // ── Explicit 501 Handlers for Unsupported Write Operations ──────────────
  static handleTimetableCreateUnsupported(): never {
    throw new AcademicError(
      'Timetable creation writes are outside the finalized Stage-1 baseline and require Stage-2/Stage-3 database migration approval.',
      501,
      'FEATURE_NOT_IMPLEMENTED',
    );
  }

  static handleTimetableUpdateUnsupported(): never {
    throw new AcademicError(
      'Timetable version updates are outside the finalized Stage-1 baseline and require Stage-2/Stage-3 database migration approval.',
      501,
      'FEATURE_NOT_IMPLEMENTED',
    );
  }

  static handleTimetablePublishUnsupported(): never {
    throw new AcademicError(
      'Timetable publication writes are outside the finalized Stage-1 baseline and require Stage-2/Stage-3 database migration approval.',
      501,
      'FEATURE_NOT_IMPLEMENTED',
    );
  }

  static handleEntryMutationUnsupported(): never {
    throw new AcademicError(
      'Timetable entry mutations are outside the finalized Stage-1 baseline and require Stage-2/Stage-3 database migration approval.',
      501,
      'FEATURE_NOT_IMPLEMENTED',
    );
  }
}
