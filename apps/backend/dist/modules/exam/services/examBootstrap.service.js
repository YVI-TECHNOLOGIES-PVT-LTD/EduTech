"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamBootstrapService = void 0;
const env_1 = require("../../../config/env");
const supabase_1 = require("../../../config/supabase");
exports.ExamBootstrapService = {
    /**
     * Bootstraps the integrity of an exam workflow by generating missing
     * snapshot data (Attendance, Eligibility) to unblock testing/production
     * where historical data is missing.
     *
     * @param examId The exam to bootstrap
     * @param userId The admin user performing the action
     */
    async bootstrapExam(examId, userId) {
        console.log(`[BOOTSTRAP] Starting bootstrap for Exam: ${examId} by User: ${userId}`);
        // GUARD: Environment Lock
        if (env_1.env.SYSTEM_MODE === 'PRODUCTION') {
            console.error(`[BOOTSTRAP] BLOCKED: Cannot bootstrap in PRODUCTION mode.`);
            throw new Error("OPERATION_FORBIDDEN: Bootstrapping is disabled in PRODUCTION.");
        }
        // 1. Validate Exam & Get Context
        const { data: exam, error: examError } = await supabase_1.supabase
            .from('exams')
            .select('id, academic_year_id, term, applicable_classes, eligibility_frozen, name, status')
            .eq('id', examId)
            .single();
        if (examError || !exam)
            throw new Error("Exam not found");
        // GUARD: Exam State Lock
        if (['LOCKED', 'COMPLETED'].includes(exam.status)) {
            console.error(`[BOOTSTRAP] BLOCKED: Exam ${exam.name} is in ${exam.status} state.`);
            throw new Error(`OPERATION_FORBIDDEN: Cannot bootstrap an exam in ${exam.status} state.`);
        }
        // GUARD: Strict One-Time Execution
        // Check if ANY bootstrap data exists for this exam
        const { count: existingCount } = await supabase_1.supabase
            .from('exam_eligibility_snapshots')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', examId)
            .eq('source', 'BOOTSTRAP');
        if (existingCount && existingCount > 0) {
            console.warn(`[BOOTSTRAP] BLOCKED: Exam ${exam.name} already has bootstrapped data.`);
            throw new Error("BOOTSTRAP_EXISTS: This exam has already been bootstrapped. Cannot re-run.");
        }
        if (exam.eligibility_frozen) {
            console.warn(`[BOOTSTRAP] Exam ${exam.name} is already frozen. Skipping bootstrap to avoid overwriting final data.`);
            return { skipped: true, reason: "Exam already frozen" };
        }
        // 2. Identify Target Population (All Students in Applicable Classes)
        let classIds = exam.applicable_classes;
        if (!classIds || classIds.length === 0) {
            // Find all classes in this academic year if not specified
            const { data: allClasses } = await supabase_1.supabase
                .from('classes')
                .select('id')
                .eq('academic_year_id', exam.academic_year_id);
            classIds = allClasses?.map(c => c.id) || [];
        }
        if (classIds.length === 0)
            throw new Error("No classes found for this exam context.");
        const { data: enrollments, error: stuError } = await supabase_1.supabase
            .from('student_sections')
            .select(`
                student_id,
                section:section_id!inner(class_id)
            `)
            .in('section.class_id', classIds);
        if (stuError)
            throw stuError;
        if (!enrollments || enrollments.length === 0)
            return { count: 0, message: "No students found." };
        const studentIds = enrollments.map(e => e.student_id);
        const uniqueStudentIds = [...new Set(studentIds)];
        console.log(`[BOOTSTRAP] Found ${uniqueStudentIds.length} students to process.`);
        // 3. Prepare Data Payloads
        const now = new Date();
        const term = exam.term || 'ANNUAL';
        // A. Attendance Summaries (100% Attendance)
        const attendancePayloads = uniqueStudentIds.map(sid => ({
            student_id: sid,
            academic_year_id: exam.academic_year_id,
            term: term,
            total_working_days: 100,
            present_days: 100,
            source: 'BOOTSTRAP',
            updated_at: now.toISOString()
        }));
        // B. Eligibility Snapshots (All Eligible, Fees Cleared)
        const snapshotPayloads = uniqueStudentIds.map(sid => ({
            exam_id: examId,
            student_id: sid,
            eligible: true,
            attendance_percentage: 100.00,
            fees_status: 'CLEARED',
            reasons: [], // No reasons for ineligibility
            captured_at: now.toISOString(),
            is_overridden: false,
            source: 'BOOTSTRAP'
        }));
        // 4. Batch Operations (Using Upsert with Ignore to Preserve REAL Data)
        // Upsert Attendance Cache (Ignore if exists)
        const { error: attError } = await supabase_1.supabase
            .from('student_attendance_cache')
            .upsert(attendancePayloads, {
            onConflict: 'student_id, academic_year_id, term',
            ignoreDuplicates: true
        });
        if (attError) {
            console.error("Attendance Bootstrap Failed", attError);
            throw new Error("Failed to bootstrap attendance cache");
        }
        // Upsert Exam Snapshots (Ignore if exists)
        const { error: snapError } = await supabase_1.supabase
            .from('exam_eligibility_snapshots')
            .upsert(snapshotPayloads, {
            onConflict: 'exam_id, student_id',
            ignoreDuplicates: true
        });
        if (snapError) {
            console.error("Snapshot Bootstrap Failed", snapError);
            throw new Error("Failed to bootstrap eligibility snapshots");
        }
        // 5. Freeze the Exam (To ensure the snapshots are used)
        const { error: freezeError } = await supabase_1.supabase
            .from('exams')
            .update({
            eligibility_frozen: true,
            updated_at: now.toISOString()
        })
            .eq('id', examId);
        if (freezeError)
            throw freezeError;
        return {
            success: true,
            students_processed: uniqueStudentIds.length,
            exam_name: exam.name,
            mode: 'BOOTSTRAP'
        };
    },
    async validateBootstrap(examId) {
        const { data: snapshots, count } = await supabase_1.supabase
            .from('exam_eligibility_snapshots')
            .select('source', { count: 'exact' })
            .eq('exam_id', examId);
        const breakdown = snapshots?.reduce((acc, curr) => {
            acc[curr.source || 'REAL'] = (acc[curr.source || 'REAL'] || 0) + 1;
            return acc;
        }, {});
        return {
            total_snapshots: count,
            breakdown
        };
    }
};
