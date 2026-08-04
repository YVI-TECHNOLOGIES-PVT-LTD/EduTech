"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectOfferSchema = exports.acceptOfferSchema = exports.generateOfferSchema = exports.generateMeritSchema = exports.recordInterviewScoreSchema = exports.scheduleInterviewSchema = exports.recordMarksSchema = exports.recordAttendanceSchema = exports.createExamScheduleSchema = exports.createExamTemplateSchema = void 0;
const zod_1 = require("zod");
exports.createExamTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').trim(),
    grade: zod_1.z.string().min(1, 'Grade is required').trim(),
    duration: zod_1.z.number().int().min(1, 'Duration must be greater than 0'),
    total_marks: zod_1.z.number().int().min(1, 'Total marks must be greater than 0'),
    passing_marks: zod_1.z.number().int().min(1, 'Passing marks must be greater than 0')
});
exports.createExamScheduleSchema = zod_1.z.object({
    template_id: zod_1.z.string().uuid('Invalid Template ID'),
    room_name: zod_1.z.string().min(1, 'Room name is required').trim(),
    invigilator_name: zod_1.z.string().min(1, 'Invigilator name is required').trim(),
    exam_date: zod_1.z.string().datetime('Invalid Exam Date')
});
exports.recordAttendanceSchema = zod_1.z.object({
    session_id: zod_1.z.string().uuid('Invalid Session ID'),
    application_id: zod_1.z.string().uuid('Invalid Application ID'),
    attendance_status: zod_1.z.enum(['PENDING', 'PRESENT', 'ABSENT', 'LATE']),
    remarks: zod_1.z.string().trim().optional()
});
exports.recordMarksSchema = zod_1.z.object({
    candidate_id: zod_1.z.string().uuid('Invalid Candidate ID'),
    subject_id: zod_1.z.string().uuid('Invalid Subject ID'),
    marks_obtained: zod_1.z.number().min(0, 'Marks cannot be negative')
});
exports.scheduleInterviewSchema = zod_1.z.object({
    application_id: zod_1.z.string().uuid('Invalid Application ID'),
    panel_id: zod_1.z.string().uuid('Invalid Panel ID'),
    interview_date: zod_1.z.string().datetime('Invalid Interview Date'),
    room_name: zod_1.z.string().min(1, 'Room name is required').trim()
});
exports.recordInterviewScoreSchema = zod_1.z.object({
    interview_id: zod_1.z.string().uuid('Invalid Interview ID'),
    scores: zod_1.z.array(zod_1.z.object({
        criterion_id: zod_1.z.string().uuid('Invalid Criterion ID'),
        score: zod_1.z.number().min(0).max(10, 'Score must be between 0 and 10'),
        remarks: zod_1.z.string().trim().optional()
    }))
});
exports.generateMeritSchema = zod_1.z.object({
    school_id: zod_1.z.string().uuid('Invalid School ID'),
    academic_year_id: zod_1.z.string().uuid('Invalid Academic Year ID')
});
exports.generateOfferSchema = zod_1.z.object({
    application_id: zod_1.z.string().uuid('Invalid Application ID'),
    template_id: zod_1.z.string().uuid('Invalid Template ID'),
    expiry_days: zod_1.z.number().int().min(1).default(14)
});
exports.acceptOfferSchema = zod_1.z.object({
    application_id: zod_1.z.string().uuid('Invalid Application ID')
});
exports.rejectOfferSchema = zod_1.z.object({
    application_id: zod_1.z.string().uuid('Invalid Application ID')
});
