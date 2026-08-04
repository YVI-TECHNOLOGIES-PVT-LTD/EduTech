"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamSeatingService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamSeatingService = {
    /**
     * Fetch students only from eligibility snapshots
     */
    async getEligibleStudents(examId, classId) {
        let query = supabase_1.supabase
            .from('exam_eligibility_snapshots')
            .select(`
                student_id,
                eligible,
                promoted_to_seating,
                student:student_id!inner (
                    id, full_name, student_code, status,
                    student_sections!inner(
                        section:section_id!inner(
                            class_id
                        )
                    )
                )
            `)
            .eq('exam_id', examId)
            .eq('eligible', true)
            .eq('promoted_to_seating', true); // Hardened Phase-2
        if (classId) {
            query = query.eq('student.student_sections.section.class_id', classId);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return (data || []).map(d => d.student).sort((a, b) => (a.student_code || '').localeCompare(b.student_code || ''));
    },
    /**
     * Auto-allocate seats for an EXAM (Lockable)
     */
    async generateSeating(examId, classId, userId, schoolId) {
        // Initial Check: Lock if published
        const { data: currentExam } = await supabase_1.supabase.from('exams').select('seating_status').eq('id', examId).single();
        if (currentExam?.seating_status === 'PUBLISHED') {
            throw new Error("SEATING_LOCKED: Cannot generate seating for a published exam.");
        }
        // STEP 4 GUARD: Fetch active halls count
        const { count: hallsCount, error: hallsError } = await supabase_1.supabase
            .from('exam_halls')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .eq('is_active', true);
        if (hallsError)
            throw hallsError;
        if (!hallsCount || hallsCount === 0) {
            throw new Error("NO_HALLS_CONFIGURED: Please create active halls before generating seating.");
        }
        // Validation and Allocation logic moved to Database RPC for Atomicity
        const { error } = await supabase_1.supabase.rpc('fn_generate_exam_seating', {
            p_exam_id: examId,
            p_school_id: schoolId,
            p_user_id: userId
        });
        if (error) {
            console.error("Atomic Seating Generation Failed:", error);
            if (error.message?.includes('SEATING_LOCKED'))
                throw new Error("SEATING_LOCKED: Cannot generate seating for a published exam.");
            if (error.message?.includes('ELIGIBILITY_NOT_FROZEN'))
                throw new Error("ELIGIBILITY_NOT_FROZEN: Please promote students to seating first.");
            if (error.message?.includes('INSUFFICIENT_CAPACITY'))
                throw new Error(error.message);
            if (error.message?.includes('NO_PROMOTED_STUDENTS'))
                throw new Error("NO_PROMOTED_STUDENTS: Please ensure students are promoted to seating first.");
            throw error;
        }
        return { success: true };
    },
    /**
     * Get Seating allocations for an Exam
     */
    async getSeatingView(examId, classId) {
        let query = supabase_1.supabase
            .from('exam_seating_allocations')
            .select(`
                id, seat_number,
                student:student_id!inner(
                    id, full_name, student_code,
                    student_sections!inner(
                        section:section_id!inner(
                            class_id
                        )
                    )
                ),
                hall:hall_id(id, hall_name, location)
            `)
            .eq('exam_id', examId);
        if (classId) {
            query = query.eq('student.student_sections.section.class_id', classId);
        }
        const { data, error } = await query
            .order('hall_id')
            .order('seat_number', { ascending: true });
        if (error)
            throw error;
        return data;
    },
    /**
     * Publish Seating (Critical Gate)
     */
    async publishSeating(examId, userId, schoolId) {
        // Validation and status update moved to Database RPC for atomicity and locking
        const { error } = await supabase_1.supabase.rpc('fn_publish_exam_seating', {
            p_exam_id: examId,
            p_user_id: userId
        });
        if (error) {
            console.error("Seating Publish Failed:", error);
            if (error.message?.includes('SEATING_ALREADY_PUBLISHED'))
                throw new Error("ALREADY_PUBLISHED: Seating is already published.");
            if (error.message?.includes('NO_SEATING_GENERATED'))
                throw new Error("NO_SEATING: Please generate seating allocation before publishing.");
            throw error;
        }
        return { success: true };
    },
    /**
     * Reset Seating (Admin Only)
     */
    async resetSeating(examId) {
        const { data: exam } = await supabase_1.supabase.from('exams').select('seating_status, result_status').eq('id', examId).single();
        if (exam?.seating_status === 'PUBLISHED') {
            throw new Error("SEATING_LOCKED: Cannot reset published seating.");
        }
        if (exam?.result_status === 'PUBLISHED') {
            throw new Error("RESULTS_PUBLISHED: Cannot reset seating after results are published.");
        }
        const { error } = await supabase_1.supabase.from('exam_seating_allocations').delete().eq('exam_id', examId);
        if (error)
            throw error;
        return { success: true };
    }
};
