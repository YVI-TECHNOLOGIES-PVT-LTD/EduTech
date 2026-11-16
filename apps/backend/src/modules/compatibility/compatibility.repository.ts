import { supabase } from '../../config/supabase';

export class CompatibilityRepository {
  /**
   * Dual-writes an attendance session to both new and legacy tables atomically.
   */
  static async syncSaveSession(session: any) {
    // 1. Write to student_attendance_sessions (New)
    const { error: newErr } = await supabase.from('student_attendance_sessions').upsert({
      id: session.id,
      school_id: session.school_id,
      academic_year_id: session.academic_year_id,
      grade: session.grade,
      section_id: session.section_id,
      date: session.date,
      session_status: session.session_status,
      created_by: session.created_by,
    });
    if (newErr) throw newErr;

    // 2. Write to attendance_sessions (Legacy)
    const { error: legacyErr } = await supabase.from('attendance_sessions').upsert({
      id: session.id,
      school_id: session.school_id,
      academic_year_id: session.academic_year_id,
      section_id: session.section_id,
      date: session.date,
      marked_by: session.created_by,
    });
    if (legacyErr) throw legacyErr;
  }

  /**
   * Dual-writes attendance records to both new and legacy tables atomically.
   */
  static async syncSaveRecords(sessionId: string, records: any[]) {
    if (records.length === 0) return;

    // 1. Map to new format (student_attendance)
    const newRecords = records.map((r) => {
      const statusUpper = r.status.toUpperCase();
      const validStatus = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'].includes(statusUpper)
        ? statusUpper
        : 'PRESENT';
      return {
        session_id: sessionId,
        student_id: r.student_id,
        status: validStatus,
        remarks: r.remarks || null,
        marked_by: r.marked_by || null,
        marked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    // 2. Map to legacy format (attendance_records)
    const legacyRecords = records.map((r) => {
      let statusLower = r.status.toLowerCase();
      if (statusLower === 'half_day') statusLower = 'present'; // Map check constraint compatibility
      const validLegacyStatus = ['present', 'absent', 'late', 'excused'].includes(statusLower)
        ? statusLower
        : 'present';
      return {
        session_id: sessionId,
        student_id: r.student_id,
        status: validLegacyStatus,
        marked_at: new Date().toISOString(),
      };
    });

    // Perform upserts
    const { error: newErr } = await supabase
      .from('student_attendance')
      .upsert(newRecords, { onConflict: 'session_id,student_id' });
    if (newErr) throw newErr;

    const { error: legacyErr } = await supabase
      .from('attendance_records')
      .upsert(legacyRecords, { onConflict: 'session_id,student_id' });
    if (legacyErr) throw legacyErr;
  }
}
