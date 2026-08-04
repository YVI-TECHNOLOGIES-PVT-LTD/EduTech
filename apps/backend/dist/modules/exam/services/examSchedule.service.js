"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamScheduleService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamScheduleService = {
    async createSchedule(payload) {
        // ========================================================
        // ARCHITECTURE ENFORCEMENT: DATE RANGE & CONFLICT DETECTION
        // ========================================================
        // 0. Fetch Exam Date Range & Status
        const { data: exam, error: examError } = await supabase_1.supabase
            .from('exams')
            .select('start_date, end_date, status')
            .eq('id', payload.exam_id)
            .single();
        if (examError || !exam) {
            throw new Error("Invalid Exam ID or exam not found.");
        }
        if (!exam.start_date || !exam.end_date) {
            throw new Error("Exam date range not configured. Please set start and end dates for the exam first.");
        }
        const examDate = payload.exam_date;
        if (examDate < exam.start_date || examDate > exam.end_date) {
            const error = new Error(`Exam date must be between ${exam.start_date} and ${exam.end_date}`);
            error.code = '400';
            throw error;
        }
        if (exam.status !== 'DRAFT') {
            const error = new Error("Cannot add schedules to an exam that is not in DRAFT status.");
            error.code = '403';
            throw error;
        }
        // 1. Get Class ID for the subject being scheduled
        const { data: subjectData, error: subjectError } = await supabase_1.supabase
            .from('subjects')
            .select('class_id')
            .eq('id', payload.subject_id)
            .single();
        if (subjectError || !subjectData) {
            console.error("Subject Lookup Error:", subjectError);
            throw new Error("Invalid subject ID or subject not found.");
        }
        const classId = subjectData.class_id;
        // 2. Fetch existing schedules for the same exam and day (Optimize: filter by class if possible, else fetch all for day)
        // We fetch ALL schedules for this exam on this day, then filter by class in memory to be safe against join syntax issues.
        const { data: existingSchedules, error: conflictQueryError } = await supabase_1.supabase
            .from('exam_schedules')
            .select(`
                id, 
                start_time, 
                end_time, 
                subject:subject_id (class_id)
            `)
            .eq('exam_id', payload.exam_id)
            .eq('exam_date', payload.exam_date)
            .neq('status', 'CANCELLED');
        if (conflictQueryError) {
            console.error("Conflict Check Query Failed:", conflictQueryError);
            throw new Error("Internal Error: Failed to check for schedule conflicts.");
        }
        // 3. Filter for Same Class & Check Time Overlap
        const newStart = payload.start_time;
        const newEnd = payload.end_time;
        const hasConflict = existingSchedules?.some((sch) => {
            // Filter: Only check matches for the same class
            if (sch.subject?.class_id !== classId)
                return false;
            // Time Overlap Logic: (StartA < EndB) AND (EndA > StartB)
            const existingStart = sch.start_time.slice(0, 5);
            const existingEnd = sch.end_time.slice(0, 5);
            return (newStart < existingEnd) && (newEnd > existingStart);
        });
        if (hasConflict) {
            const error = new Error("Another subject is already scheduled for this class during this time slot.");
            error.code = '409';
            throw error;
        }
        // 4. Clean Insert
        const insertPayload = {
            exam_id: payload.exam_id,
            subject_id: payload.subject_id,
            exam_date: payload.exam_date,
            start_time: payload.start_time,
            end_time: payload.end_time,
            max_marks: payload.max_marks || 100, // Default if undefined
            passing_marks: payload.passing_marks || 35 // Default if undefined
        };
        const { data, error } = await supabase_1.supabase
            .from('exam_schedules')
            .insert(insertPayload)
            .select()
            .single();
        if (error) {
            console.error("Insert Schedule Error:", error);
            throw error;
        }
        return data;
    },
    async getSchedulesByExam(examId) {
        const { data, error } = await supabase_1.supabase
            .from('exam_schedules')
            .select(`
                *,
                subject:subject_id (name, code, class_id)
            `)
            .eq('exam_id', examId)
            .order('exam_date', { ascending: true })
            .order('start_time', { ascending: true });
        if (error)
            throw error;
        return data;
    },
    async updateSchedule(scheduleId, payload) {
        // 0. Fetch Exam Date Range & Status
        const { data: exam, error: examError } = await supabase_1.supabase
            .from('exams')
            .select('start_date, end_date, status')
            .eq('id', payload.exam_id)
            .single();
        if (examError || !exam)
            throw new Error("Exam not found");
        if (!exam.start_date || !exam.end_date) {
            throw new Error("Exam date range not configured.");
        }
        const examDate = payload.exam_date;
        if (examDate < exam.start_date || examDate > exam.end_date) {
            const error = new Error(`Exam date must be between ${exam.start_date} and ${exam.end_date}`);
            error.code = '400';
            throw error;
        }
        if (exam.status !== 'DRAFT') {
            const error = new Error("Cannot update schedules for an exam that is not in DRAFT status.");
            error.code = '403';
            throw error;
        }
        // 1. Conflict Check (Exclude current ID)
        // Get Class ID
        const { data: subjectData, error: subError } = await supabase_1.supabase
            .from('subjects')
            .select('class_id')
            .eq('id', payload.subject_id)
            .single();
        if (subError || !subjectData)
            throw new Error("Invalid Subject");
        const classId = subjectData.class_id;
        // Fetch potential conflicts
        const { data: conflictingSchedules, error: conflictError } = await supabase_1.supabase
            .from('exam_schedules')
            .select(`
                id, start_time, end_time, 
                subject:subject_id (class_id)
            `)
            .eq('exam_id', payload.exam_id)
            .eq('exam_date', payload.exam_date)
            .neq('id', scheduleId) // Exclude self
            .neq('status', 'CANCELLED');
        if (conflictError)
            throw new Error("Conflict check failed");
        // Check Overlap
        const newStart = payload.start_time;
        const newEnd = payload.end_time;
        const hasConflict = conflictingSchedules?.some((sch) => {
            if (sch.subject?.class_id !== classId)
                return false;
            const existingStart = sch.start_time.slice(0, 5);
            const existingEnd = sch.end_time.slice(0, 5);
            return (newStart < existingEnd) && (newEnd > existingStart);
        });
        if (hasConflict) {
            const error = new Error("Time slot conflict detected with another subject.");
            error.code = '409';
            throw error;
        }
        // 2. Update
        const { data, error } = await supabase_1.supabase
            .from('exam_schedules')
            .update({
            exam_date: payload.exam_date,
            start_time: payload.start_time,
            end_time: payload.end_time,
            max_marks: payload.max_marks,
            passing_marks: payload.passing_marks
        })
            .eq('id', scheduleId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async deleteSchedule(scheduleId) {
        const { error } = await supabase_1.supabase
            .from('exam_schedules')
            .delete()
            .eq('id', scheduleId);
        if (error)
            throw error;
        return true;
    }
};
