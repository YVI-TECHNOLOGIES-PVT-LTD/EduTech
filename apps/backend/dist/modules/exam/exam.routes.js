"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const permissions_1 = require("../../rbac/permissions");
const supabase_1 = require("../../config/supabase");
const zod_1 = require("zod");
const examSchedule_controller_1 = require("./controllers/examSchedule.controller");
const examEligibility_controller_1 = require("./controllers/examEligibility.controller");
const examEligibility_service_1 = require("./services/examEligibility.service");
const resultProcessor_service_1 = require("./services/resultProcessor.service");
const examResult_controller_1 = require("./controllers/examResult.controller");
const resultPublish_controller_1 = require("./controllers/resultPublish.controller");
const examDeliverables_controller_1 = require("./controllers/examDeliverables.controller");
const examSeating_controller_1 = require("./controllers/examSeating.controller");
const examQuestionPaper_controller_1 = require("./controllers/examQuestionPaper.controller");
const examAnalytics_controller_1 = require("./controllers/examAnalytics.controller");
const examConduct_controller_1 = require("./controllers/examConduct.controller");
const examEvaluation_controller_1 = require("./controllers/examEvaluation.controller");
const examExport_controller_1 = require("./controllers/examExport.controller");
const examAdminBridge_controller_1 = require("./controllers/examAdminBridge.controller");
const examHallTicket_controller_1 = require("./controllers/examHallTicket.controller");
const examHall_controller_1 = require("./controllers/examHall.controller");
const examVersioning_controller_1 = require("./controllers/examVersioning.controller");
const examTimeline_controller_1 = require("./controllers/examTimeline.controller");
exports.examRouter = (0, express_1.Router)();
// ======================================
// SUBJECTS
// ======================================
// GET /subjects?classId=
exports.examRouter.get('/subjects', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.SUBJECT_VIEW), async (req, res) => {
    try {
        const classId = req.query.classId;
        const schoolId = req.context.user.school_id;
        // Handle invalid/undefined classId explicitly
        if (!classId || classId === 'undefined') {
            return res.json([]); // Return empty list instead of crashing or querying all
        }
        let query = supabase_1.supabase
            .from('subjects')
            .select('*, class:class_id(name)')
            .eq('school_id', schoolId)
            .order('name');
        if (classId)
            query = query.eq('class_id', classId);
        const { data, error } = await query;
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        console.error("GET /subjects Error:", err);
        res.status(500).json({ error: err.message });
    }
});
// POST /subjects
exports.examRouter.post('/subjects', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.SUBJECT_CREATE), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { class_id, name, code } = req.body;
    if (!class_id || !name)
        return res.status(400).json({ error: "Missing fields" });
    const { data, error } = await supabase_1.supabase
        .from('subjects')
        .insert({ school_id: schoolId, class_id, name, code })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
// ======================================
// EXAMS
// ======================================
// GET /exams
exports.examRouter.get('/', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), async (req, res) => {
    try {
        const schoolId = req.context.user.school_id;
        const { data, error } = await supabase_1.supabase
            .from('exams')
            .select('*, academic_year:academic_year_id(year_label)')
            .eq('school_id', schoolId)
            .order('start_date', { ascending: false });
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        console.error("GET /exams Error:", err);
        res.status(500).json({ error: err.message || "Internal Server Error" });
    }
});
// GET /:examId/classes (Fetch Classes Mapped to Exam)
exports.examRouter.get('/:examId/classes', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), async (req, res) => {
    try {
        const { examId } = req.params;
        const data = await examEligibility_service_1.ExamEligibilityService.getClassesForExam(examId);
        res.json(data);
    }
    catch (err) {
        console.error("GET /exams/:examId/classes Error:", err);
        res.status(err.message === "Exam not found or invalid." ? 404 : 500).json({ error: err.message });
    }
});
// POST /exams
exports.examRouter.post('/', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), async (req, res) => {
    try {
        const schoolId = req.context.user.school_id;
        const { name, academic_year_id, start_date, end_date, term, applicable_classes, type } = req.body;
        // 1. Mandatory Fields (Hardened Phase-5)
        if (!academic_year_id || !term || !name) {
            return res.status(400).json({ error: "Missing required fields (academic_year_id, term, name)" });
        }
        // 2. Check Year Status
        const { data: year } = await supabase_1.supabase
            .from('academic_years')
            .select('status')
            .eq('id', academic_year_id)
            .single();
        if (year?.status === 'CLOSED') {
            return res.status(403).json({ error: "Cannot create exams in a CLOSED academic year." });
        }
        const { data, error } = await supabase_1.supabase
            .from('exams')
            .insert({
            school_id: schoolId,
            name,
            academic_year_id,
            start_date,
            end_date,
            term,
            applicable_classes,
            type,
            status: 'DRAFT',
            created_by: req.context.user.id
        })
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (err) {
        console.error("POST /exams Error:", err);
        res.status(500).json({ error: err.message });
    }
});
// PUT /:id (Update Exam)
exports.examRouter.put('/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), async (req, res) => {
    try {
        const { id } = req.params;
        const schoolId = req.context.user.school_id;
        const { name, start_date, end_date, applicable_classes, type, status } = req.body;
        const updates = {};
        if (name)
            updates.name = name;
        if (start_date)
            updates.start_date = start_date;
        if (end_date)
            updates.end_date = end_date;
        if (applicable_classes !== undefined)
            updates.applicable_classes = applicable_classes; // Allow empty array or null
        if (type)
            updates.type = type;
        if (status)
            updates.status = status;
        const { data, error } = await supabase_1.supabase
            .from('exams')
            .update(updates)
            .eq('id', id)
            .eq('school_id', schoolId)
            .select()
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        console.error("PUT /exams Error:", err);
        res.status(500).json({ error: err.message });
    }
});
// DELETE /:id (Delete Exam)
exports.examRouter.delete('/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), async (req, res) => {
    try {
        const { id } = req.params;
        const schoolId = req.context.user.school_id;
        // Simple delete attempt
        const { error } = await supabase_1.supabase
            .from('exams')
            .delete()
            .eq('id', id)
            .eq('school_id', schoolId);
        if (error) {
            // If generic constraint error (common in PG for FK violations)
            if (error.code === '23503') {
                return res.status(409).json({
                    error: "Cannot delete this exam because it has associated data (schedules, results, etc.). Please delete dependent data first."
                });
            }
            throw error;
        }
        res.json({ success: true, message: "Exam deleted successfully" });
    }
    catch (err) {
        console.error("DELETE /exams Error:", err);
        // Detect Supabase/Postgrest constraint error if thrown
        if (err?.code === '23503') {
            return res.status(409).json({
                error: "Cannot delete this exam because it has associated data (schedules, results, etc.). Please delete dependent data first."
            });
        }
        res.status(500).json({ error: err.message || "Deletion failed" });
    }
});
// ======================================
// MARKS
// ======================================
// GET /marks/student/:studentId
exports.examRouter.get('/marks/student/:studentId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.MARKS_VIEW), async (req, res) => {
    const { studentId } = req.params;
    const { examId } = req.query; // Optional filter
    // RLS handles visibility check (Parent vs Staff)
    let query = supabase_1.supabase
        .from('marks')
        .select(`
            marks_obtained, entered_at,
            exam:exam_id(name),
            subject:subject_id(name, code)
        `)
        .eq('student_id', studentId);
    if (examId)
        query = query.eq('exam_id', examId);
    const { data, error } = await query;
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// GET /marks/my (Parent/Student Shortcut)
exports.examRouter.get('/marks/my', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.MARKS_VIEW), async (req, res) => {
    try {
        const userId = req.context.user.id; // Parent ID
        // 1. Find linked students
        const { data: links } = await supabase_1.supabase
            .from('student_parents')
            .select('student_id')
            .eq('parent_user_id', userId);
        // If no children linked (or Faculty causing this route to be hit), return empty.
        if (!links || links.length === 0)
            return res.json([]);
        const studentIds = links.map(l => l.student_id);
        // 2. Fetch marks
        const { data, error } = await supabase_1.supabase
            .from('marks')
            .select(`
                student_id, marks_obtained,
                student:student_id(full_name),
                exam:exam_id(name),
                subject:subject_id(name)
            `)
            .in('student_id', studentIds)
            .order('entered_at', { ascending: false });
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        console.error("GET /marks/my Error:", err);
        res.status(500).json({ error: err.message });
    }
});
// POST /marks (Bulk or Single Entry)
exports.examRouter.post('/marks', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.MARKS_ENTER), async (req, res) => {
    try {
        const userId = req.context.user.id;
        // --- PHASE 17A: HARDENED VALIDATION ---
        const marksSchema = zod_1.z.object({
            student_id: zod_1.z.string().uuid(),
            exam_id: zod_1.z.string().uuid(),
            subject_id: zod_1.z.string().uuid(),
            marks_obtained: zod_1.z.number()
                .min(0, "Marks cannot be negative")
                .refine(val => {
                const decimals = val.toString().split('.')[1];
                return !decimals || decimals.length <= 2;
            }, "Marks can have at most 2 decimal places")
        });
        const validated = marksSchema.safeParse(req.body);
        if (!validated.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: validated.error.flatten().fieldErrors
            });
        }
        const { student_id, exam_id, subject_id, marks_obtained } = validated.data;
        // --------------------------------------
        // --- PHASE-4 CHECK: ELIGIBILITY & SEATING ---
        const { data: sch } = await supabase_1.supabase
            .from('exam_schedules')
            .select('id, exams!inner(seating_status, hall_ticket_status, result_status)')
            .eq('exam_id', exam_id)
            .eq('subject_id', subject_id)
            .single();
        const exam = sch?.exams;
        if (exam?.seating_status !== 'PUBLISHED') {
            return res.status(403).json({ error: "Seating is not published. Marks entry is not allowed." });
        }
        if (exam?.hall_ticket_status !== 'PUBLISHED') {
            return res.status(403).json({ error: "Hall tickets are not published. Marks entry is not yet available." });
        }
        if (exam?.result_status === 'PUBLISHED') {
            return res.status(423).json({ error: "Results are already published and locked.", code: "LOCKED" });
        }
        const { data: seating } = await supabase_1.supabase
            .from('exam_seating_allocations')
            .select('id')
            .eq('student_id', student_id)
            .eq('exam_schedule_id', sch?.id)
            .single();
        if (!seating) {
            return res.status(403).json({ error: "Student is not seated for this subject. Only snapshot-eligible students can have marks entered." });
        }
        // TODO: Verify Faculty Section Assignment for Strict Control
        const { data, error } = await supabase_1.supabase
            .from('marks')
            .upsert({
            student_id,
            exam_id,
            subject_id,
            marks_obtained,
            entered_by: userId,
            entered_at: new Date().toISOString()
        })
            .select()
            .single();
        if (error)
            throw error;
        // --- PHASE-3 HOOK: RESULT PROCESSING ---
        // Run asynchronously to not delay response
        // We pass schoolId from context
        const schoolId = req.context.user.school_id;
        resultProcessor_service_1.ResultProcessorService.processStudentResult(student_id, exam_id, schoolId)
            .catch(err => console.error("Async Result Calc Failed:", err));
        // ---------------------------------------
        res.json(data);
    }
    catch (err) {
        console.error("POST /marks Error:", err);
        res.status(500).json({ error: err.message });
    }
});
// ======================================
// DASHBOARD PROJECTIONS (READ-ONLY)
// ======================================
exports.examRouter.get('/dashboard/student/exam-timeline', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examTimeline_controller_1.ExamTimelineController.getStudentTimeline);
exports.examRouter.get('/dashboard/faculty/exam-timeline', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examTimeline_controller_1.ExamTimelineController.getFacultyTimeline);
// ======================================
// EXAM SCHEDULES
// ======================================
// GET /exam-schedules?examId=
exports.examRouter.get('/exam-schedules', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examSchedule_controller_1.ExamScheduleController.getSchedules);
// POST /exam-schedules
exports.examRouter.post('/exam-schedules', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examSchedule_controller_1.ExamScheduleController.createSchedule);
// PUT /exam-schedules/:id (Update)
exports.examRouter.put('/exam-schedules/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), (req, res) => examSchedule_controller_1.ExamScheduleController.updateSchedule(req, res));
// ======================================
// ELIGIBILITY
// ======================================
// GET /exam-eligibility?examId=&studentId=
exports.examRouter.get('/exam-eligibility', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examEligibility_controller_1.ExamEligibilityController.checkEligibility);
// GET /class-eligibility/exam/:examId/class/:classId
exports.examRouter.get('/class-eligibility/exam/:examId/class/:classId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examEligibility_controller_1.ExamEligibilityController.getClassEligibility);
// Freeze Eligibility (Persists LIVE status into Snapshots)
exports.examRouter.post('/eligibility/freeze', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examEligibility_controller_1.ExamEligibilityController.freezeEligibility);
// Override Eligibility (Audited correction)
exports.examRouter.post('/eligibility/override', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examEligibility_controller_1.ExamEligibilityController.overrideEligibility);
// Bootstrap Eligibility (Architect Bootstrapper)
exports.examRouter.post('/eligibility/bootstrap', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examEligibility_controller_1.ExamEligibilityController.bootstrapEligibility);
// ======================================
// ADMIN BRIDGE (MANUAL OVERRIDES)
// ======================================
// GET /admin/bridge/:classId/status?academicYearId=
exports.examRouter.get('/admin/bridge/:classId/status', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examAdminBridge_controller_1.ExamAdminBridgeController.getClassBridgeData);
// POST /admin/bridge/attendance
exports.examRouter.post('/admin/bridge/attendance', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examAdminBridge_controller_1.ExamAdminBridgeController.setAttendance);
// POST /admin/bridge/fees
exports.examRouter.post('/admin/bridge/fees', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examAdminBridge_controller_1.ExamAdminBridgeController.setFeeStatus);
// ======================================
// CONDUCT & ATTENDANCE
// ======================================
exports.examRouter.post('/conduct/attendance', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.MARKS_ENTER), // Staff conducting can mark attendance
examConduct_controller_1.ExamConductController.markAttendance);
exports.examRouter.get('/conduct/attendance', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examConduct_controller_1.ExamConductController.getHallAttendance);
// ======================================
// EVALUATION & LOCKING
// ======================================
exports.examRouter.post('/evaluation/lock-subject', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), // Usually Admin finalized
examEvaluation_controller_1.ExamEvaluationController.lockSubject);
exports.examRouter.post('/evaluation/unlock-subject/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examEvaluation_controller_1.ExamEvaluationController.unlockSubject);
// ======================================
// RESULTS
// ======================================
// GET /exam/results?examId=&studentId=
exports.examRouter.get('/results', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.MARKS_VIEW), examResult_controller_1.ExamResultController.getStudentResult);
// POST /exam/publish-results
exports.examRouter.post('/publish-results', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), // Admin usually has this
resultPublish_controller_1.ResultPublishController.publishResults);
// ======================================
// DELIVERABLES (READ ONLY)
// ======================================
// GET /exam/hall-ticket?examId=&studentId=
exports.examRouter.get('/hall-ticket', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examDeliverables_controller_1.ExamDeliverablesController.getHallTicket);
// PHASE 17C: PDF RESULTS & BULK DOWNLOAD
exports.examRouter.get('/:examId/result/:studentId/pdf', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.MARKS_VIEW), examDeliverables_controller_1.ExamDeliverablesController.generateStudentPDF);
exports.examRouter.get('/:examId/result/bulk-download', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examDeliverables_controller_1.ExamDeliverablesController.bulkDownloadResults);
// PHASE 18: PROGRESS REPORTS
exports.examRouter.get('/:examId/progress-report/:studentId/pdf', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.MARKS_VIEW), examDeliverables_controller_1.ExamDeliverablesController.generateProgressReportPDF);
exports.examRouter.get('/:examId/progress-report/bulk-download', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examDeliverables_controller_1.ExamDeliverablesController.bulkDownloadProgressReports);
// ======================================
// GLOBAL HALL MANAGEMENT (v1)
// ======================================
exports.examRouter.get('/v1/exam-halls', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examHall_controller_1.ExamHallController.listHalls);
exports.examRouter.post('/v1/exam-halls', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examHall_controller_1.ExamHallController.createHall);
exports.examRouter.put('/v1/exam-halls/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examHall_controller_1.ExamHallController.updateHall);
exports.examRouter.patch('/v1/exam-halls/:id/toggle', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examHall_controller_1.ExamHallController.toggleActive);
exports.examRouter.delete('/v1/exam-halls/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examHall_controller_1.ExamHallController.deleteHall);
// ======================================
// SEATING (ADMIN ONLY)
// ======================================
// POST /exams/seating/generate
exports.examRouter.post('/seating/generate', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examSeating_controller_1.ExamSeatingController.generateSeating);
// POST /exams/seating/publish
exports.examRouter.post('/seating/publish', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examSeating_controller_1.ExamSeatingController.publishSeating);
// POST /exams/seating/reset
exports.examRouter.post('/seating/reset', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examSeating_controller_1.ExamSeatingController.resetSeating);
// GET /exams/seating/eligible-students
exports.examRouter.get('/seating/eligible-students', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examSeating_controller_1.ExamSeatingController.getEligibleStudents);
// GET /exams/seating
exports.examRouter.get('/seating', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examSeating_controller_1.ExamSeatingController.getSeatingView);
// ======================================
// HALL TICKETS
// ======================================
// POST /exams/hall-tickets/generate
exports.examRouter.post('/hall-tickets/generate', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examHallTicket_controller_1.ExamHallTicketController.generateTickets);
// POST /exams/hall-tickets/publish (Phase-3)
exports.examRouter.post('/hall-tickets/publish', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examHallTicket_controller_1.ExamHallTicketController.publishTickets);
// GET /exams/hall-tickets
exports.examRouter.get('/hall-tickets', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examHallTicket_controller_1.ExamHallTicketController.getHallTickets);
// GET /exams/hall-tickets/my
exports.examRouter.get('/hall-tickets/my', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examHallTicket_controller_1.ExamHallTicketController.getMyHallTicket);
// PHASE-14: PDF GENERATION
// GET /api/v1/exams/hall-ticket/:examId/:studentId/pdf
exports.examRouter.get('/hall-ticket/:examId/:studentId/pdf', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examHallTicket_controller_1.ExamHallTicketController.generateStudentPDF);
// POST /api/v1/exams/:examId/hall-ticket/reissue
exports.examRouter.post('/:examId/hall-ticket/reissue', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examHallTicket_controller_1.ExamHallTicketController.bulkReissueZip);
// ======================================
// QUESTION PAPERS (ADMIN/FACULTY)
// ======================================
// GET /exams/question-papers?examScheduleId=
exports.examRouter.get('/question-papers', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examQuestionPaper_controller_1.ExamQuestionPaperController.list);
// POST /exams/question-papers (Upload)
exports.examRouter.post('/question-papers', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), // Or new QP_UPLOAD permission
examQuestionPaper_controller_1.ExamQuestionPaperController.upload);
// POST /exams/question-papers/lock
exports.examRouter.post('/question-papers/lock', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examQuestionPaper_controller_1.ExamQuestionPaperController.lock);
// ======================================
// ANALYTICS (ADMIN ONLY)
// ======================================
// GET /exams/analytics/overview?examId=
exports.examRouter.get('/analytics/overview', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), // Or ANALYTICS_VIEW if exists
examAnalytics_controller_1.ExamAnalyticsController.getOverview);
// GET /exams/analytics/grades?examId=
exports.examRouter.get('/analytics/grades', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examAnalytics_controller_1.ExamAnalyticsController.getGrades);
// GET /exams/analytics/subjects?examId=
exports.examRouter.get('/analytics/subjects', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examAnalytics_controller_1.ExamAnalyticsController.getSubjects);
// GET /exams/analytics/top-performers?examId=&limit=
exports.examRouter.get('/analytics/top-performers', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examAnalytics_controller_1.ExamAnalyticsController.getTopPerformers);
// GET /exams/analytics/compliance?examId=
exports.examRouter.get('/analytics/compliance', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examAnalytics_controller_1.ExamAnalyticsController.getCompliance);
// GET /exams/analytics/sections?examId=
exports.examRouter.get('/analytics/sections', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examAnalytics_controller_1.ExamAnalyticsController.getSectionAnalytics);
// GET /exams/analytics/audit?examId=
exports.examRouter.get('/analytics/audit', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examAnalytics_controller_1.ExamAnalyticsController.getAuditTrails);
// POST /exams/results/publish (Phase-3)
exports.examRouter.post('/results/publish', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), resultPublish_controller_1.ResultPublishController.publishResults);
// ======================================
// REVISION CONTROL & VERSIONING (Phase-12)
// ======================================
// GET /exams/:examId/seating/versions
exports.examRouter.get('/:examId/seating/versions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examVersioning_controller_1.ExamVersioningController.getSeatingVersions);
// GET /exams/:examId/results/versions
exports.examRouter.get('/:examId/results/versions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_VIEW), examVersioning_controller_1.ExamVersioningController.getResultVersions);
// POST /exams/:examId/seating/versions/:version/restore
exports.examRouter.post('/:examId/seating/versions/:version/restore', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examVersioning_controller_1.ExamVersioningController.restoreSeatingVersion);
// ======================================
// EXPORTS (ADMIN ONLY)
// ======================================
// GET /exams/export/results?examId=
exports.examRouter.get('/export/results', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examExport_controller_1.ExamExportController.exportResults);
// GET /exams/export/conduct?examId=
exports.examRouter.get('/export/conduct', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examExport_controller_1.ExamExportController.exportConductReport);
// GET /exams/export/audit?examId=
exports.examRouter.get('/export/audit', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.EXAM_CREATE), examExport_controller_1.ExamExportController.exportAuditTrail);
