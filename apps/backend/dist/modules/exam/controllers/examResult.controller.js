"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamResultController = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamResultController = {
    async getStudentResult(req, res) {
        try {
            const { examId, studentId } = req.query;
            if (!examId || !studentId) {
                return res.status(400).json({ error: "Missing required params" });
            }
            // 1. Fetch Summary
            const { data: summary, error: sumError } = await supabase_1.supabase
                .from('student_result_summaries')
                .select('*')
                .eq('exam_id', examId)
                .eq('student_id', studentId)
                .single();
            // 2. Fetch Detailed Marks with Subject Names
            const { data: details, error: detError } = await supabase_1.supabase
                .from('marks')
                .select(`
                    marks_obtained,
                    subject:subject_id(name, code, type)
                `)
                .eq('exam_id', examId)
                .eq('student_id', studentId);
            if (detError)
                throw detError;
            res.json({
                summary: summary || null,
                details: details || []
            });
        }
        catch (err) {
            console.error("Get Result Error:", err);
            res.status(500).json({ error: err.message });
        }
    }
};
