"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamConductController = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamConductController = {
    /**
     * Mark Attendance in Hall
     * Hall-specific and separate from daily attendance.
     */
    async markAttendance(req, res) {
        const userId = req.context.user.id;
        try {
            const { examScheduleId, studentId, status, hallId, remarks } = req.body;
            if (!examScheduleId || !studentId || !status) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            // 1. GATE: Check if student is seated for this schedule
            const { data: seating } = await supabase_1.supabase
                .from('exam_seating_allocations')
                .select('id, hall_id')
                .eq('exam_schedule_id', examScheduleId)
                .eq('student_id', studentId)
                .single();
            if (!seating) {
                return res.status(403).json({ error: "Student is not seated for this exam. Eligibility/Seating must be finalized first." });
            }
            // 2. Upsert Exam Attendance
            const { data, error } = await supabase_1.supabase
                .from('exam_attendance')
                .upsert({
                exam_schedule_id: examScheduleId,
                student_id: studentId,
                hall_id: hallId || seating.hall_id, // Default to seated hall
                status,
                remarks,
                marked_by: userId,
                marked_at: new Date().toISOString()
            })
                .select()
                .single();
            if (error)
                throw error;
            // 3. Hook: If Absent or Malpractice, automatically create a '0' mark entry if none exists?
            // "Marks entry restricted to seated students" - handled by trigger.
            // If status is not PRESENT, we might want to default the marks.
            if (status !== 'PRESENT') {
                const { data: schedule } = await supabase_1.supabase
                    .from('exam_schedules')
                    .select('exam_id, subject_id')
                    .eq('id', examScheduleId)
                    .single();
                if (schedule) {
                    await supabase_1.supabase
                        .from('marks')
                        .upsert({
                        student_id: studentId,
                        exam_id: schedule.exam_id,
                        subject_id: schedule.subject_id,
                        marks_obtained: 0,
                        status: status, // ABSENT or MALPRACTICE
                        remarks: `Auto-marked from exam attendance: ${status}`,
                        entered_by: userId
                    });
                }
            }
            res.json(data);
        }
        catch (err) {
            console.error("Exam Attendance Error:", err);
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * Get Attendance for a Hall
     */
    async getHallAttendance(req, res) {
        try {
            const { examScheduleId, hallId } = req.query;
            if (!examScheduleId)
                return res.status(400).json({ error: "examScheduleId required" });
            let query = supabase_1.supabase
                .from('exam_attendance')
                .select(`
                    *,
                    student:student_id(full_name, student_code)
                `)
                .eq('exam_schedule_id', examScheduleId);
            if (hallId)
                query = query.eq('hall_id', hallId);
            const { data, error } = await query;
            if (error)
                throw error;
            res.json(data);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
