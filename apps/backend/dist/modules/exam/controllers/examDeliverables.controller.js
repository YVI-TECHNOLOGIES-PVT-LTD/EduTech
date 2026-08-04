"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamDeliverablesController = void 0;
const supabase_1 = require("../../../config/supabase");
const examEligibility_service_1 = require("../services/examEligibility.service");
const ExamReportCard_service_1 = require("../services/ExamReportCard.service");
const ExamProgressReport_service_1 = require("../services/ExamProgressReport.service");
exports.ExamDeliverablesController = {
    // ------------------------------------------
    // HALL TICKET
    // ------------------------------------------
    async getHallTicket(req, res) {
        try {
            const { examId, studentId } = req.query;
            if (!examId || !studentId)
                return res.status(400).json({ error: "Missing examId or studentId" });
            const { data: exam } = await supabase_1.supabase.from('exams').select('*').eq('id', examId).single();
            if (!exam)
                return res.status(404).json({ error: "Exam not found" });
            if (!exam.eligibility_frozen) {
                return res.status(403).json({ error: "Hall Ticket Not Ready: Exam eligibility has not been frozen.", code: "UNFROZEN" });
            }
            const eligibility = await examEligibility_service_1.ExamEligibilityService.checkEligibility(studentId, examId);
            if (!eligibility.eligible) {
                return res.status(403).json({ error: "Hall Ticket Denied: Student is not eligible.", reasons: eligibility.reasons });
            }
            const { data: sectionData } = await supabase_1.supabase.from('student_sections').select('section:section_id(name, class:class_id(name))').eq('student_id', studentId).eq('academic_year_id', exam.academic_year_id).maybeSingle();
            const { data: schedules } = await supabase_1.supabase.from('exam_schedules').select(`id, exam_date, start_time, end_time, subject:subject_id(name, code)`).eq('exam_id', examId).order('exam_date', { ascending: true });
            const scheduleIds = schedules?.map(s => s.id) || [];
            const { data: allocations } = await supabase_1.supabase.from('exam_seating_allocations').select('exam_schedule_id, seat_number, hall:hall_id(hall_name, location)').in('exam_schedule_id', scheduleIds).eq('student_id', studentId);
            res.json({
                generated_at: new Date().toISOString(),
                student: { id: studentId, section: sectionData?.section },
                exam,
                schedules: schedules?.map(sch => {
                    const alloc = allocations?.find(a => a.exam_schedule_id === sch.id);
                    return { ...sch, hall: alloc?.hall, seat_number: alloc?.seat_number, is_seated: !!alloc };
                })
            });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    // ------------------------------------------
    // PDF REPORT CARD (PHASE 17)
    // ------------------------------------------
    async generateStudentPDF(req, res) {
        try {
            const { examId, studentId } = req.params;
            const schoolId = req.context.user.school_id;
            const pdfBuffer = await ExamReportCard_service_1.ExamReportCardService.generateStudentPDF(examId, studentId, schoolId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=ReportCard_${studentId}.pdf`);
            res.send(pdfBuffer);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async bulkDownloadResults(req, res) {
        try {
            const { examId } = req.params;
            const schoolId = req.context.user.school_id;
            const zipBuffer = await ExamReportCard_service_1.ExamReportCardService.bulkDownloadZIP(examId, schoolId);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=Results_Exam_${examId}.zip`);
            res.send(zipBuffer);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    // ------------------------------------------
    // PROGRESS REPORT (PHASE 18)
    // ------------------------------------------
    async generateProgressReportPDF(req, res) {
        try {
            const { examId, studentId } = req.params;
            const schoolId = req.context.user.school_id;
            const pdfBuffer = await ExamProgressReport_service_1.ExamProgressReportService.generateProgressReportPDF(examId, studentId, schoolId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=ProgressReport_${studentId}.pdf`);
            res.send(pdfBuffer);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    async bulkDownloadProgressReports(req, res) {
        try {
            const { examId } = req.params;
            const schoolId = req.context.user.school_id;
            const zipBuffer = await ExamProgressReport_service_1.ExamProgressReportService.bulkDownloadZIP(examId, schoolId);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=ProgressReports_Exam_${examId}.zip`);
            res.send(zipBuffer);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
