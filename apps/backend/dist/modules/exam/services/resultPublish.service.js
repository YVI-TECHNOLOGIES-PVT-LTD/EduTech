"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultPublishService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ResultPublishService = {
    async publishExamResults(examId, userId) {
        // --- PHASE-5 GATE: ALL SUBJECTS MUST BE LOCKED ---
        const { data: unlockedSchedules } = await supabase_1.supabase
            .from('exam_schedules')
            .select('id')
            .eq('exam_id', examId)
            .eq('results_locked', false);
        if (unlockedSchedules && unlockedSchedules.length > 0) {
            throw new Error(`CANNOT_PUBLISH: ${unlockedSchedules.length} subjects are not yet finalized/locked.`);
        }
        // -------------------------------------------------
        // Phase-R4 SNAPSHOT logic remains but we use the RPC for final lock
        // A. Get Exam's Academic Year
        const { data: examData } = await supabase_1.supabase.from('exams').select('academic_year_id, academic_year:academic_year_id(year_label)').eq('id', examId).single();
        if (!examData)
            throw new Error("Exam context missing");
        const examYearId = examData.academic_year_id;
        const examYearLabel = examData.academic_year?.year_label;
        // B. Fetch Student Contexts for this Exam Year
        const { data: contexts } = await supabase_1.supabase
            .from('student_result_summaries')
            .select('student_id')
            .eq('exam_id', examId);
        const studentIds = contexts?.map(c => c.student_id) || [];
        if (studentIds.length > 0) {
            const { data: sections } = await supabase_1.supabase
                .from('student_sections')
                .select(`
                    student_id,
                    section:section_id(
                        name,
                        class:class_id(name)
                    )
                `)
                .in('student_id', studentIds)
                .eq('academic_year_id', examYearId);
            const contextMap = new Map();
            sections?.forEach((s) => {
                if (s.section && s.section.class) {
                    contextMap.set(s.student_id, {
                        className: s.section.class.name,
                        sectionName: s.section.name
                    });
                }
            });
            await Promise.all(studentIds.map(async (sid) => {
                const ctx = contextMap.get(sid);
                if (ctx) {
                    await supabase_1.supabase
                        .from('student_result_summaries')
                        .update({
                        class_name_snapshot: ctx.className,
                        section_name_snapshot: ctx.sectionName,
                        academic_year_label_snapshot: examYearLabel,
                        is_published: true, // Mark as published in summary
                        published_at: new Date().toISOString(),
                        published_by: userId
                    })
                        .eq('exam_id', examId)
                        .eq('student_id', sid)
                        .is('class_name_snapshot', null);
                }
            }));
        }
        // ATOMIC RPC: Finalize result_status and set exam status to COMPLETED
        const { error } = await supabase_1.supabase.rpc('fn_publish_exam_results', {
            p_exam_id: examId,
            p_user_id: userId
        });
        if (error)
            throw error;
        return { success: true };
    },
    async isExamPublished(examId) {
        // Check if ANY result in this exam is published. 
        // We assume atomic publish for whole exam, but structure allows per-student.
        // We check one record to be fast.
        const { data } = await supabase_1.supabase
            .from('student_result_summaries')
            .select('is_published')
            .eq('exam_id', examId)
            .eq('is_published', true)
            .limit(1);
        return !!(data && data.length > 0);
    },
    // Check specifically for a student (for marks entry guard)
    async isStudentResultPublished(examId, studentId) {
        const { data } = await supabase_1.supabase
            .from('student_result_summaries')
            .select('is_published')
            .eq('exam_id', examId)
            .eq('student_id', studentId)
            .single();
        return !!data?.is_published;
    }
};
