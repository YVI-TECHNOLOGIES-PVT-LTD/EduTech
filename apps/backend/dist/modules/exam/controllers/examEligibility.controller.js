"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamEligibilityController = void 0;
const supabase_1 = require("../../../config/supabase");
const examEligibility_service_1 = require("../services/examEligibility.service");
const examBootstrap_service_1 = require("../services/examBootstrap.service");
exports.ExamEligibilityController = {
    async checkEligibility(req, res) {
        try {
            const { examId, studentId } = req.query;
            if (!examId || !studentId) {
                return res.status(400).json({ error: "Missing examId or studentId" });
            }
            const result = await examEligibility_service_1.ExamEligibilityService.checkEligibility(studentId, examId);
            res.json(result);
        }
        catch (err) {
            console.error("Eligibility Check Error:", err);
            res.status(500).json({ error: err.message });
        }
    },
    async freezeEligibility(req, res) {
        const schoolId = req.context.user.school_id;
        const userId = req.context.user.id;
        try {
            const { examId } = req.body;
            if (!examId)
                return res.status(400).json({ error: "examId required" });
            // 1. Get Exam + Classes
            const { data: exam, error: examErr } = await supabase_1.supabase
                .from('exams')
                .select('id, academic_year_id, applicable_classes')
                .eq('id', examId)
                .eq('school_id', schoolId)
                .single();
            if (examErr || !exam)
                return res.status(404).json({ error: "Exam not found" });
            // 2. Fetch Students
            let query = supabase_1.supabase
                .from('student_sections')
                .select('student_id');
            if (exam.applicable_classes && exam.applicable_classes.length > 0) {
                // Resolve section_ids for these classes
                const { data: sections } = await supabase_1.supabase
                    .from('sections')
                    .select('id')
                    .in('class_id', exam.applicable_classes);
                if (sections && sections.length > 0) {
                    query = query.in('section_id', sections.map(s => s.id));
                }
                else {
                    // Fallback to academic year if sections are not resolved
                    query = query.eq('academic_year_id', exam.academic_year_id);
                }
            }
            else {
                // Fallback to academic year if no specific classes are defined
                query = query.eq('academic_year_id', exam.academic_year_id);
            }
            const { data: enrollments } = await query;
            const studentIds = enrollments?.map(e => e.student_id) || [];
            if (studentIds.length === 0)
                return res.status(400).json({ error: "No students found for this exam's classes." });
            // 3. Compute Live Bulk Eligibility
            const eligibilityMap = await examEligibility_service_1.ExamEligibilityService.checkEligibilityBulk(studentIds, examId);
            // 4. Transform to JSONB for RPC
            const payload = Object.entries(eligibilityMap).map(([sid, data]) => ({
                student_id: sid,
                ...data
            }));
            // 5. Atomic RPC Freeze
            const { error: freezeErr } = await supabase_1.supabase.rpc('fn_freeze_exam_eligibility', {
                p_exam_id: examId,
                p_performed_by: userId,
                p_eligibility_data: payload
            });
            if (freezeErr)
                throw freezeErr;
            res.json({ success: true, count: studentIds.length });
        }
        catch (err) {
            console.error("Freeze Eligibility Error:", err);
            res.status(500).json({ error: err.message });
        }
    },
    async overrideEligibility(req, res) {
        const userId = req.context?.user?.id;
        try {
            const { snapshotId, eligible, reason } = req.body;
            if (!snapshotId || eligible === undefined || !reason) {
                return res.status(400).json({ error: "Missing fields (snapshotId, eligible, reason)" });
            }
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const { error } = await supabase_1.supabase.rpc('fn_override_eligibility', {
                p_snapshot_id: snapshotId,
                p_new_eligible: eligible,
                p_reason: reason,
                p_performed_by: userId
            });
            if (error)
                throw error;
            res.json({ success: true });
        }
        catch (err) {
            console.error("Override Eligibility Error:", err);
            res.status(500).json({ error: err.message });
        }
    },
    async bootstrapEligibility(req, res) {
        try {
            const { examId } = req.body;
            const userId = req.context?.user?.id;
            if (!examId)
                return res.status(400).json({ error: "Exam ID required" });
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const result = await examBootstrap_service_1.ExamBootstrapService.bootstrapExam(examId, userId);
            res.json(result);
        }
        catch (err) {
            console.error("Bootstrap Error:", err);
            res.status(500).json({ error: err.message });
        }
    },
    async getClassEligibility(req, res) {
        try {
            const { examId, classId } = req.params;
            const { status, page = 1, pageSize = 10 } = req.query;
            const schoolId = req.context.user.school_id;
            const p = Math.max(1, Number(page));
            const ps = Math.max(1, Number(pageSize));
            // 1. Get Sections
            const { data: sections, error: secError } = await supabase_1.supabase
                .from('sections')
                .select('id, name')
                .eq('class_id', classId);
            if (secError)
                throw secError;
            if (!sections || sections.length === 0)
                return res.json({ data: [], total: 0 });
            const sectionIds = sections.map(s => s.id);
            // 2. Get Enrollments (Students in those sections)
            const { data: enrollments, error: enrollError } = await supabase_1.supabase
                .from('student_sections')
                .select(`
                    student_id,
                    section:section_id(name),
                    student:student_id(id, full_name, student_code, status)
                `)
                .in('section_id', sectionIds);
            if (enrollError)
                throw enrollError;
            // Filter for active students
            const activeEnrollments = (enrollments || []).filter((e) => e.student && e.student.status === 'active');
            const studentIds = activeEnrollments.map((e) => e.student_id);
            if (studentIds.length === 0)
                return res.json({ data: [], total: 0 });
            // 3. Bulk check eligibility for ALL students in the class (needed to know total eligible vs ineligible)
            const eligibilityMap = await examEligibility_service_1.ExamEligibilityService.checkEligibilityBulk(studentIds, examId);
            // 4. Transform and Filter by status
            let processedData = activeEnrollments.map((e) => ({
                id: e.student.id,
                full_name: e.student.full_name,
                student_code: e.student.student_code,
                section_name: e.section?.name || 'N/A',
                eligibility: eligibilityMap[e.student.id] || {
                    eligible: false,
                    attendance_percentage: 0,
                    fees_status: 'PENDING',
                    reasons: ['Not Checked']
                }
            }));
            if (status === 'ELIGIBLE') {
                processedData = processedData.filter(d => d.eligibility.eligible);
            }
            else if (status === 'INELIGIBLE') {
                processedData = processedData.filter(d => !d.eligibility.eligible);
            }
            const total = processedData.length;
            // 5. Paginate
            const paginatedData = processedData.slice((p - 1) * ps, p * ps);
            res.json({
                data: paginatedData,
                meta: {
                    total,
                    eligibleCount: activeEnrollments.filter((e) => eligibilityMap[e.student_id]?.eligible).length,
                    page: p,
                    pageSize: ps,
                    totalPages: Math.ceil(total / ps)
                }
            });
        }
        catch (err) {
            console.error("getClassEligibility Error:", err);
            res.status(500).json({ error: err.message });
        }
    }
};
