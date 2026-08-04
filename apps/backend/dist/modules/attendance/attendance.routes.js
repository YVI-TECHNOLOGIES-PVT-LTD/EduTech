"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const permissions_1 = require("../../rbac/permissions");
const supabase_1 = require("../../config/supabase");
exports.attendanceRouter = (0, express_1.Router)();
// ======================================
// MARKING (Faculty)
// ======================================
// ======================================
// MARKING (Faculty)
// ======================================
// POST /session (Create session if not exists)
exports.attendanceRouter.post('/session', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ATTENDANCE_MARK), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const userId = req.context.user.id;
    const { academic_year_id, section_id, date, subject_id, start_time } = req.body; // Added params
    if (!academic_year_id || !section_id || !date)
        return res.status(400).json({ error: "Missing fields" });
    try {
        // 0. SECURITY: Current Year Only
        const { data: activeYear } = await supabase_1.supabase
            .from('academic_years')
            .select('id, status')
            .eq('school_id', schoolId)
            .eq('is_active', true)
            .single();
        if (!activeYear || activeYear.id !== academic_year_id) {
            return res.status(403).json({ error: "Attendance can only be marked for the active academic year." });
        }
        if (activeYear.status === 'CLOSED') {
            return res.status(403).json({ error: "Cannot mark attendance in a CLOSED academic year." });
        }
        // 1. SECURITY: ABAC Enforcement
        // "Use timetable_slots as source of truth"
        // If marking a Subject period, verify User teaches this Subject to this Section at this Time (or generally).
        if (subject_id) {
            // 1. Check specific Timetable Slot (Strongest Check)
            // Get Day of Week (1=Mon)
            const dayOfWeek = new Date(date).getDay() || 7;
            // We check if a slot exists for this Faculty + Section + Subject + Day
            // Note: start_time match is ideal but might drift slightly in practice. 
            // We'll check "Is assigned to this section+subject" generally via timetable OR faculty_section_subjects
            // Let's use timetable_slots for availability check
            const { count: slotCount } = await supabase_1.supabase
                .from('timetable_slots')
                .select('*', { count: 'exact', head: true })
                .eq('school_id', schoolId)
                .eq('faculty_user_id', userId)
                .eq('section_id', section_id)
                .eq('subject_id', subject_id)
                .eq('day_of_week', dayOfWeek);
            // If not in timetable, check manual assignment override (faculty_section_subjects)
            const { count: assignCount } = await supabase_1.supabase
                .from('faculty_section_subjects')
                .select('*', { count: 'exact', head: true })
                .eq('faculty_profile_id', userId); // Note: This table links faculty_profile_id which is NOT user_id. Wait.
            // schema 042 says: faculty_profile_id REFERENCES faculty_profiles(id). 
            // faculty_profiles has user_id. 
            // This is complex join. Let's rely on Timetable which uses `faculty_user_id` directly (Migration 008). 
            // Much safer.
            if (!slotCount && !req.context.user.roles.includes('ADMIN')) {
                // Start_time specific check could be added here if needed
                return res.status(403).json({ error: "You are not scheduled to teach this class today." });
            }
        }
        else {
            // Daily Attendance (Homeroom)
            // Check if Class Teacher (faculty_sections)
            const { count: ctCount } = await supabase_1.supabase
                .from('faculty_sections')
                .select('*', { count: 'exact', head: true })
                .eq('faculty_user_id', userId)
                .eq('section_id', section_id)
                .in('role', ['class_teacher']);
            if (!ctCount && !req.context.user.roles.includes('ADMIN')) {
                return res.status(403).json({ error: "Only Class Teacher can mark daily attendance." });
            }
        }
        // Create Session
        const { data, error } = await supabase_1.supabase
            .from('attendance_sessions')
            .insert({
            school_id: schoolId,
            academic_year_id,
            section_id,
            date,
            subject_id: subject_id || null, // New
            start_time: start_time || null, // New
            marked_by: userId
        })
            .select()
            .single();
        if (error) {
            if (error.code === '23505') { // Unique constraint violation (Daily or Period)
                // Fetch existing
                let query = supabase_1.supabase
                    .from('attendance_sessions')
                    .select('*')
                    .eq('section_id', section_id)
                    .eq('date', date);
                if (start_time)
                    query = query.eq('start_time', start_time);
                else
                    query = query.is('start_time', null);
                const { data: existing } = await query.single();
                return res.json(existing);
            }
            throw error;
        }
        res.status(201).json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// POST /session/:id/records (Bulk upsert records)
exports.attendanceRouter.post('/session/:id/records', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ATTENDANCE_MARK), async (req, res) => {
    const sessionId = req.params.id;
    const { records } = req.body; // Array of { student_id, status }
    if (!Array.isArray(records))
        return res.status(400).json({ error: "Records must be array" });
    // Validate Session Ownership/Access? 
    // We already did it in Create Session. 
    // But attacker could guess ID.
    // Let's rely on RLS 'Staff manage records' -> 'can_mark_attendance'.
    // STRICT: We should ideally verify session.marked_by == user OR admin.
    const { data: session } = await supabase_1.supabase.from('attendance_sessions').select('marked_by').eq('id', sessionId).single();
    if (session && session.marked_by !== req.context.user.id && !req.context.user.roles.includes('ADMIN')) {
        return res.status(403).json({ error: "You cannot modify a session marked by another faculty." });
    }
    const { data, error } = await supabase_1.supabase
        .from('attendance_records')
        .upsert(records.map((r) => ({
        session_id: sessionId,
        student_id: r.student_id,
        status: r.status,
        marked_at: new Date().toISOString()
    })), { onConflict: 'session_id,student_id' })
        .select();
    if (error) {
        console.error('[Attendance] Save Error:', error);
        return res.status(500).json({ error: error.message, details: error.details });
    }
    res.json({ message: "Attendance marked", count: data?.length || 0 });
});
// ======================================
// ADMIN INTELLIGENCE
// ======================================
exports.attendanceRouter.get('/admin/summary', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.DASHBOARD_VIEW_ADMIN), async (req, res) => {
    const schoolId = req.context.user.school_id;
    try {
        const today = new Date().toISOString().split('T')[0];
        // 1. Total Active Students
        const { count: totalStudents } = await supabase_1.supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .eq('status', 'active');
        // 2. Today's Stats (Sessions & Records)
        const { data: sessions } = await supabase_1.supabase
            .from('attendance_sessions')
            .select('id')
            .eq('school_id', schoolId)
            .eq('date', today);
        const sessionIds = sessions?.map(s => s.id) || [];
        let presentCount = 0;
        let absentCount = 0;
        if (sessionIds.length > 0) {
            const { data: records } = await supabase_1.supabase
                .from('attendance_records')
                .select('status')
                .in('session_id', sessionIds);
            records?.forEach(r => {
                if (r.status?.toLowerCase() === 'present')
                    presentCount++;
                else
                    absentCount++;
            });
        }
        const markedTotal = presentCount + absentCount;
        const rate = markedTotal > 0 ? ((presentCount / markedTotal) * 100).toFixed(1) : 0;
        res.json({
            totalStudents: totalStudents || 0,
            presentToday: presentCount,
            absentToday: absentCount,
            attendanceRateToday: rate,
            sessionsMarked: sessionIds.length
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.attendanceRouter.get('/admin/class-summary', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.DASHBOARD_VIEW_ADMIN), async (req, res) => {
    const schoolId = req.context.user.school_id;
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: sessions } = await supabase_1.supabase
            .from('attendance_sessions')
            .select(`
                    id, 
                    section:section_id(name, class:class_id(name)),
                    records:attendance_records(status)
                `)
            .eq('school_id', schoolId)
            .eq('date', today);
        if (!sessions)
            return res.json([]);
        const summary = sessions.map((s) => {
            const total = s.records?.length || 0;
            const present = s.records?.filter((r) => r.status?.toLowerCase() === 'present').length || 0;
            const percent = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
            return {
                class_name: s.section?.class?.name || 'Unknown',
                section_name: s.section?.name || 'Unknown',
                present_count: present,
                total_students: total,
                attendance_rate: percent
            };
        });
        res.json(summary);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.attendanceRouter.get('/admin/defaulters', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.DASHBOARD_VIEW_ADMIN), async (req, res) => {
    try {
        const { data: defaulters, error } = await supabase_1.supabase
            .from('student_attendance_summary')
            .select(`
                    student_id, 
                    attendance_percentage,
                    total_present,
                    total_absent,
                    total_late,
                    student:student_id(full_name, student_code, student_sections(section:section_id(name, class:class_id(name))))
                `)
            .lt('attendance_percentage', 75)
            .order('attendance_percentage', { ascending: true })
            .limit(100);
        if (error)
            throw error;
        const result = defaulters?.map((d) => {
            const total = (d.total_present || 0) + (d.total_absent || 0) + (d.total_late || 0);
            return {
                id: d.student_id,
                name: d.student?.full_name,
                code: d.student?.student_code,
                class_name: d.student?.student_sections?.[0]?.section?.class?.name || '-',
                section_name: d.student?.student_sections?.[0]?.section?.name || '-',
                percent: d.attendance_percentage,
                present: d.total_present || 0,
                total
            };
        });
        res.json(result || []);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ======================================
// VIEWS
// ======================================
// GET /section/:sectionId?date=...
exports.attendanceRouter.get('/section/:sectionId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ATTENDANCE_VIEW), async (req, res) => {
    const { sectionId } = req.params;
    const { date } = req.query;
    if (!date)
        return res.status(400).json({ error: "Date required" });
    // 1. Get Session
    const { data: session } = await supabase_1.supabase
        .from('attendance_sessions')
        .select('*, marker:marked_by(user_roles(role:role_id(name)))')
        .eq('section_id', sectionId)
        .eq('date', date)
        .single();
    if (!session)
        return res.json({ session: null, records: [] });
    // 2. Get Records with student info
    const { data: records, error } = await supabase_1.supabase
        .from('attendance_records')
        .select('*, student:student_id(full_name, student_code)')
        .eq('session_id', session.id);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ session, records });
});
// GET /my (Parent View)
exports.attendanceRouter.get('/my', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ATTENDANCE_VIEW_SELF), async (req, res) => {
    const userId = req.context.user.id;
    // 1. Find linked students
    const { data: links } = await supabase_1.supabase
        .from('student_parents')
        .select('student_id')
        .eq('parent_user_id', userId);
    if (!links || links.length === 0)
        return res.json([]);
    const studentIds = links.map(l => l.student_id);
    // 2. Fetch records
    const { data, error } = await supabase_1.supabase
        .from('attendance_records')
        .select(`
                status, marked_at,
                session:session_id(date),
                student:student_id(full_name)
            `)
        .in('student_id', studentIds)
        .order('marked_at', { ascending: false })
        .limit(50);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
