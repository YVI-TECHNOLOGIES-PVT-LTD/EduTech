"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultProcessorService = void 0;
const supabase_1 = require("../../../config/supabase");
const grading_service_1 = require("./grading.service");
exports.ResultProcessorService = {
    async processStudentResult(studentId, examId, schoolId) {
        try {
            console.log(`[ResultProcessor] Processing result for Student: ${studentId}, Exam: ${examId}`);
            // 1. Fetch Operations (Parallel)
            const [marksRes, schedulesRes] = await Promise.all([
                // Fetch all marks for this student in this exam
                supabase_1.supabase
                    .from('marks')
                    .select('subject_id, marks_obtained')
                    .eq('student_id', studentId)
                    .eq('exam_id', examId),
                // Fetch passing criteria for all subjects in this exam
                supabase_1.supabase
                    .from('exam_schedules')
                    .select('subject_id, max_marks, passing_marks')
                    .eq('exam_id', examId)
            ]);
            if (marksRes.error)
                throw marksRes.error;
            if (schedulesRes.error)
                throw schedulesRes.error;
            const marksObtained = marksRes.data || [];
            const schedules = schedulesRes.data || [];
            // 2. Aggregation & Logic
            let totalObtained = 0;
            let totalMax = 0;
            let isFail = false;
            // Map schedule for easy lookup
            const scheduleMap = new Map();
            schedules.forEach(s => scheduleMap.set(s.subject_id, s));
            // Iterate over schedules to account for all subjects (even if marks not entered yet, treat as 0 or ignore? 
            // Result Processor usually runs when marks are entered. If incomplete, it shows partial.
            // We iterate over entered marks mainly, but to be accurate we should summing up based on schedules logic?
            // "Summary" usually implies what they got so far or out of total.
            // Let's sum based on what they appeared for (marks entered).
            for (const mark of marksObtained) {
                const sch = scheduleMap.get(mark.subject_id);
                if (sch) {
                    totalObtained += Number(mark.marks_obtained);
                    // Only add to totalMax if we are counting this subject. 
                    // Actually, totalMax should be the exam total? 
                    // Usually Percentage = Obtained / TotalPossible * 100.
                    // If a student hasn't taken a test yet, their percentage drops. This is correct for "Result".
                    // So we should iterate over SCHEDULES to get Total Max, and check if mark exists.
                }
            }
            // Correct Strategy: Iterate over Schedules (The Exam Definition)
            totalObtained = 0;
            totalMax = 0;
            const subjectsDetails = [];
            for (const sch of schedules) {
                totalMax += Number(sch.max_marks || 100);
                const markEntry = marksObtained.find(m => m.subject_id === sch.subject_id);
                const obtained = markEntry ? Number(markEntry.marks_obtained) : 0;
                totalObtained += obtained;
                // Pass/Fail Check
                if (obtained < Number(sch.passing_marks || 35)) {
                    isFail = true;
                }
                // If mark entry is missing, strictly it's Absent (0) -> Fail
                if (!markEntry) {
                    // isFail = true; // Uncomment if absent means fail immediately. Usually yes.
                    // For now, if no mark, we treat as 0.
                }
            }
            // 3. Calc Metrics
            // Avoid division by zero
            const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
            // 4. Get Grade
            const gradeInfo = await grading_service_1.GradingService.calculateGrade(schoolId, percentage);
            // Override Grade if Fail?
            // Usually if Fail, Grade is F regardless of percentage (e.g. failed one subject but got 90% in others).
            const finalStatus = isFail ? 'FAIL' : 'PASS';
            const finalGrade = isFail ? 'F' : gradeInfo.label;
            // 5. Upsert Summary
            const { error: upsertError } = await supabase_1.supabase
                .from('student_result_summaries')
                .upsert({
                exam_id: examId,
                student_id: studentId,
                total_obtained: totalObtained,
                total_max: totalMax,
                percentage: parseFloat(percentage.toFixed(2)),
                grade: finalGrade,
                result_status: finalStatus,
                updated_at: new Date().toISOString()
            }, { onConflict: 'exam_id, student_id' });
            if (upsertError)
                throw upsertError;
            console.log(`[ResultProcessor] Updated result for Student ${studentId}: ${finalStatus} (${percentage.toFixed(2)}%)`);
        }
        catch (err) {
            console.error("[ResultProcessor] Error:", err);
            // Don't throw, just log. We don't want to block the marks API response.
        }
    }
};
