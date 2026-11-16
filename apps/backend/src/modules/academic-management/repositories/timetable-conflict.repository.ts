import prisma from '../../../lib/prismaClient';

export interface ConflictItem {
  conflict_type:
    | 'TEACHER_DOUBLE_BOOKING'
    | 'SECTION_DOUBLE_BOOKING'
    | 'ROOM_DOUBLE_BOOKING'
    | 'STAFF_UNAVAILABLE'
    | 'QUALIFICATION_MISSING';
  severity: 'ERROR' | 'WARNING';
  weekday: number;
  time_range: string;
  entity_id: string;
  entity_name: string;
  conflicting_entries: string[];
  details: string;
}

export interface ConflictAnalysisResult {
  timetable_version_id: string;
  version_name: string | null;
  status: string;
  total_conflicts: number;
  conflict_summary: {
    teacher_collisions: number;
    section_collisions: number;
    room_collisions: number;
    availability_conflicts: number;
    qualification_warnings: number;
  };
  conflicts: ConflictItem[];
  is_valid_for_publication: boolean;
}

export class TimetableConflictRepository {
  /**
   * Run comprehensive conflict detection across a timetable version
   */
  static async analyzeConflicts(
    orgId: string,
    versionId: string,
  ): Promise<ConflictAnalysisResult | null> {
    // 1. Verify timetable version belongs to tenant
    const versionRes = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT tv.timetable_version_id, tv.version_name, tv.status::text as status
      FROM timetable_versions tv
      JOIN academic_years ay ON ay.academic_year_id = tv.academic_year_id
      WHERE tv.timetable_version_id = $1::uuid AND ay.org_id = $2::uuid
      LIMIT 1
      `,
      versionId,
      orgId,
    );

    if (!versionRes || versionRes.length === 0) {
      return null;
    }

    const version = versionRes[0];
    const conflicts: ConflictItem[] = [];

    // 2. Teacher double-booking conflicts
    const teacherClashesSql = `
      SELECT
        t1.timetable_entry_id as entry1_id,
        t2.timetable_entry_id as entry2_id,
        a1.staff_id,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as staff_name,
        t1.weekday,
        p1.start_time::text as p1_start,
        p1.end_time::text as p1_end,
        s1.section_name as sec1_name,
        s2.section_name as sec2_name,
        sub1.subject_name as sub1_name,
        sub2.subject_name as sub2_name
      FROM timetable_entries t1
      JOIN section_subject_faculty_assignments a1 ON a1.faculty_assignment_id = t1.faculty_assignment_id
      JOIN staff st ON st.staff_id = a1.staff_id
      JOIN users u ON u.user_id = st.user_id
      JOIN bell_schedule_periods p1 ON p1.bell_schedule_period_id = t1.bell_schedule_period_id
      JOIN sections s1 ON s1.section_id = t1.section_id
      JOIN academic_year_grade_subjects aygs1 ON aygs1.academic_year_grade_subject_id = t1.academic_year_grade_subject_id
      JOIN subjects sub1 ON sub1.subject_id = aygs1.subject_id

      JOIN timetable_entries t2 ON t2.timetable_version_id = t1.timetable_version_id
        AND t2.timetable_entry_id > t1.timetable_entry_id
        AND t2.weekday = t1.weekday
      JOIN section_subject_faculty_assignments a2 ON a2.faculty_assignment_id = t2.faculty_assignment_id
        AND a2.staff_id = a1.staff_id
      JOIN bell_schedule_periods p2 ON p2.bell_schedule_period_id = t2.bell_schedule_period_id
      JOIN sections s2 ON s2.section_id = t2.section_id
      JOIN academic_year_grade_subjects aygs2 ON aygs2.academic_year_grade_subject_id = t2.academic_year_grade_subject_id
      JOIN subjects sub2 ON sub2.subject_id = aygs2.subject_id

      WHERE t1.timetable_version_id = $1::uuid
        AND (p1.start_time, p1.end_time) OVERLAPS (p2.start_time, p2.end_time)
      ORDER BY t1.weekday ASC, p1.start_time ASC
    `;

    const teacherClashes = await prisma.$queryRawUnsafe<any[]>(teacherClashesSql, versionId);
    for (const c of teacherClashes) {
      conflicts.push({
        conflict_type: 'TEACHER_DOUBLE_BOOKING',
        severity: 'ERROR',
        weekday: c.weekday,
        time_range: `${c.p1_start} - ${c.p1_end}`,
        entity_id: c.staff_id,
        entity_name: c.staff_name,
        conflicting_entries: [c.entry1_id, c.entry2_id],
        details: `Teacher ${c.staff_name} is double-booked on weekday ${c.weekday} during ${c.p1_start}-${c.p1_end} for section ${c.sec1_name} (${c.sub1_name}) and section ${c.sec2_name} (${c.sub2_name}).`,
      });
    }

    // 3. Section double-booking conflicts
    const sectionClashesSql = `
      SELECT
        t1.timetable_entry_id as entry1_id,
        t2.timetable_entry_id as entry2_id,
        t1.section_id,
        s.section_name,
        g.grade_name,
        t1.weekday,
        p1.start_time::text as p1_start,
        p1.end_time::text as p1_end,
        sub1.subject_name as sub1_name,
        sub2.subject_name as sub2_name
      FROM timetable_entries t1
      JOIN sections s ON s.section_id = t1.section_id
      JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = s.academic_year_grade_id
      JOIN grades g ON g.grade_id = ayg.grade_id
      JOIN bell_schedule_periods p1 ON p1.bell_schedule_period_id = t1.bell_schedule_period_id
      JOIN academic_year_grade_subjects aygs1 ON aygs1.academic_year_grade_subject_id = t1.academic_year_grade_subject_id
      JOIN subjects sub1 ON sub1.subject_id = aygs1.subject_id

      JOIN timetable_entries t2 ON t2.timetable_version_id = t1.timetable_version_id
        AND t2.timetable_entry_id > t1.timetable_entry_id
        AND t2.weekday = t1.weekday
        AND t2.section_id = t1.section_id
      JOIN bell_schedule_periods p2 ON p2.bell_schedule_period_id = t2.bell_schedule_period_id
      JOIN academic_year_grade_subjects aygs2 ON aygs2.academic_year_grade_subject_id = t2.academic_year_grade_subject_id
      JOIN subjects sub2 ON sub2.subject_id = aygs2.subject_id

      WHERE t1.timetable_version_id = $1::uuid
        AND (p1.start_time, p1.end_time) OVERLAPS (p2.start_time, p2.end_time)
      ORDER BY t1.weekday ASC, p1.start_time ASC
    `;

    const sectionClashes = await prisma.$queryRawUnsafe<any[]>(sectionClashesSql, versionId);
    for (const c of sectionClashes) {
      conflicts.push({
        conflict_type: 'SECTION_DOUBLE_BOOKING',
        severity: 'ERROR',
        weekday: c.weekday,
        time_range: `${c.p1_start} - ${c.p1_end}`,
        entity_id: c.section_id,
        entity_name: `${c.grade_name} - Section ${c.section_name}`,
        conflicting_entries: [c.entry1_id, c.entry2_id],
        details: `Section ${c.grade_name} - ${c.section_name} has multiple simultaneous lessons on weekday ${c.weekday} during ${c.p1_start}-${c.p1_end} (${c.sub1_name} and ${c.sub2_name}).`,
      });
    }

    // 4. Room double-booking conflicts
    const roomClashesSql = `
      SELECT
        t1.timetable_entry_id as entry1_id,
        t2.timetable_entry_id as entry2_id,
        t1.classroom_id,
        c.room_code,
        c.room_name,
        t1.weekday,
        p1.start_time::text as p1_start,
        p1.end_time::text as p1_end,
        s1.section_name as sec1_name,
        s2.section_name as sec2_name
      FROM timetable_entries t1
      JOIN classrooms c ON c.classroom_id = t1.classroom_id
      JOIN bell_schedule_periods p1 ON p1.bell_schedule_period_id = t1.bell_schedule_period_id
      JOIN sections s1 ON s1.section_id = t1.section_id

      JOIN timetable_entries t2 ON t2.timetable_version_id = t1.timetable_version_id
        AND t2.timetable_entry_id > t1.timetable_entry_id
        AND t2.weekday = t1.weekday
        AND t2.classroom_id = t1.classroom_id
      JOIN bell_schedule_periods p2 ON p2.bell_schedule_period_id = t2.bell_schedule_period_id
      JOIN sections s2 ON s2.section_id = t2.section_id

      WHERE t1.timetable_version_id = $1::uuid
        AND t1.classroom_id IS NOT NULL
        AND (p1.start_time, p1.end_time) OVERLAPS (p2.start_time, p2.end_time)
      ORDER BY t1.weekday ASC, p1.start_time ASC
    `;

    const roomClashes = await prisma.$queryRawUnsafe<any[]>(roomClashesSql, versionId);
    for (const c of roomClashes) {
      conflicts.push({
        conflict_type: 'ROOM_DOUBLE_BOOKING',
        severity: 'ERROR',
        weekday: c.weekday,
        time_range: `${c.p1_start} - ${c.p1_end}`,
        entity_id: c.classroom_id,
        entity_name: `${c.room_code} (${c.room_name})`,
        conflicting_entries: [c.entry1_id, c.entry2_id],
        details: `Room ${c.room_code} (${c.room_name}) is double-booked on weekday ${c.weekday} during ${c.p1_start}-${c.p1_end} for section ${c.sec1_name} and section ${c.sec2_name}.`,
      });
    }

    // 5. Staff unavailability slot conflicts
    const unavailableClashesSql = `
      SELECT
        te.timetable_entry_id,
        st.staff_id,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as staff_name,
        te.weekday,
        bsp.start_time::text as period_start,
        bsp.end_time::text as period_end,
        sus.start_time::text as unavail_start,
        sus.end_time::text as unavail_end,
        sus.reason
      FROM timetable_entries te
      JOIN section_subject_faculty_assignments ssfa ON ssfa.faculty_assignment_id = te.faculty_assignment_id
      JOIN staff st ON st.staff_id = ssfa.staff_id
      JOIN users u ON u.user_id = st.user_id
      JOIN bell_schedule_periods bsp ON bsp.bell_schedule_period_id = te.bell_schedule_period_id
      JOIN staff_unavailable_slots sus ON sus.staff_id = st.staff_id
        AND sus.weekday = te.weekday
        AND sus.is_active = true
      WHERE te.timetable_version_id = $1::uuid
        AND (bsp.start_time, bsp.end_time) OVERLAPS (sus.start_time, sus.end_time)
    `;

    const unavailableClashes = await prisma.$queryRawUnsafe<any[]>(
      unavailableClashesSql,
      versionId,
    );
    for (const c of unavailableClashes) {
      conflicts.push({
        conflict_type: 'STAFF_UNAVAILABLE',
        severity: 'ERROR',
        weekday: c.weekday,
        time_range: `${c.period_start} - ${c.period_end}`,
        entity_id: c.staff_id,
        entity_name: c.staff_name,
        conflicting_entries: [c.timetable_entry_id],
        details: `Teacher ${c.staff_name} is assigned on weekday ${c.weekday} during ${c.period_start}-${c.period_end}, overlapping with registered unavailable slot (${c.unavail_start}-${c.unavail_end}: ${c.reason || 'No reason specified'}).`,
      });
    }

    // 6. Unverified qualifications (Warnings)
    const qualificationWarningsSql = `
      SELECT DISTINCT
        te.timetable_entry_id,
        st.staff_id,
        TRIM(CONCAT(u.first_name, ' ', u.last_name)) as staff_name,
        sub.subject_name,
        sub.subject_code
      FROM timetable_entries te
      JOIN section_subject_faculty_assignments ssfa ON ssfa.faculty_assignment_id = te.faculty_assignment_id
      JOIN staff st ON st.staff_id = ssfa.staff_id
      JOIN users u ON u.user_id = st.user_id
      JOIN academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = te.academic_year_grade_subject_id
      JOIN subjects sub ON sub.subject_id = aygs.subject_id
      WHERE te.timetable_version_id = $1::uuid
        AND ssfa.is_qualification_override = false
        AND NOT EXISTS (
          SELECT 1
          FROM staff_subject_qualifications q
          WHERE q.staff_id = st.staff_id
            AND q.subject_id = sub.subject_id
            AND q.is_active = true
            AND q.is_verified = true
        )
    `;

    const qualWarnings = await prisma.$queryRawUnsafe<any[]>(qualificationWarningsSql, versionId);
    for (const c of qualWarnings) {
      conflicts.push({
        conflict_type: 'QUALIFICATION_MISSING',
        severity: 'WARNING',
        weekday: 0,
        time_range: 'ALL_PERIODS',
        entity_id: c.staff_id,
        entity_name: c.staff_name,
        conflicting_entries: [c.timetable_entry_id],
        details: `Teacher ${c.staff_name} lacks verified qualifications for subject ${c.subject_name} (${c.subject_code}) without an approved qualification override.`,
      });
    }

    const summary = {
      teacher_collisions: teacherClashes.length,
      section_collisions: sectionClashes.length,
      room_collisions: roomClashes.length,
      availability_conflicts: unavailableClashes.length,
      qualification_warnings: qualWarnings.length,
    };

    const totalErrors =
      summary.teacher_collisions +
      summary.section_collisions +
      summary.room_collisions +
      summary.availability_conflicts;

    return {
      timetable_version_id: version.timetable_version_id,
      version_name: version.version_name,
      status: version.status,
      total_conflicts: conflicts.length,
      conflict_summary: summary,
      conflicts,
      is_valid_for_publication: totalErrors === 0,
    };
  }
}
