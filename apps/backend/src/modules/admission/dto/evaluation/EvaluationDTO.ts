import { z } from 'zod';

export const createExamTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required').trim(),
    grade: z.string().min(1, 'Grade is required').trim(),
    duration: z.number().int().min(1, 'Duration must be greater than 0'),
    total_marks: z.number().int().min(1, 'Total marks must be greater than 0'),
    passing_marks: z.number().int().min(1, 'Passing marks must be greater than 0')
});

export const createExamScheduleSchema = z.object({
    template_id: z.string().uuid('Invalid Template ID'),
    room_name: z.string().min(1, 'Room name is required').trim(),
    invigilator_name: z.string().min(1, 'Invigilator name is required').trim(),
    exam_date: z.string().datetime('Invalid Exam Date')
});

export const recordAttendanceSchema = z.object({
    session_id: z.string().uuid('Invalid Session ID'),
    application_id: z.string().uuid('Invalid Application ID'),
    attendance_status: z.enum(['PENDING', 'PRESENT', 'ABSENT', 'LATE']),
    remarks: z.string().trim().optional()
});

export const recordMarksSchema = z.object({
    candidate_id: z.string().uuid('Invalid Candidate ID'),
    subject_id: z.string().uuid('Invalid Subject ID'),
    marks_obtained: z.number().min(0, 'Marks cannot be negative')
});

export const scheduleInterviewSchema = z.object({
    application_id: z.string().uuid('Invalid Application ID'),
    panel_id: z.string().uuid('Invalid Panel ID'),
    interview_date: z.string().datetime('Invalid Interview Date'),
    room_name: z.string().min(1, 'Room name is required').trim()
});

export const recordInterviewScoreSchema = z.object({
    interview_id: z.string().uuid('Invalid Interview ID'),
    scores: z.array(
        z.object({
            criterion_id: z.string().uuid('Invalid Criterion ID'),
            score: z.number().min(0).max(10, 'Score must be between 0 and 10'),
            remarks: z.string().trim().optional()
        })
    )
});

export const generateMeritSchema = z.object({
    school_id: z.string().uuid('Invalid School ID'),
    academic_year_id: z.string().uuid('Invalid Academic Year ID')
});

export const generateOfferSchema = z.object({
    application_id: z.string().uuid('Invalid Application ID'),
    template_id: z.string().uuid('Invalid Template ID'),
    expiry_days: z.number().int().min(1).default(14)
});

export const acceptOfferSchema = z.object({
    application_id: z.string().uuid('Invalid Application ID')
});

export const rejectOfferSchema = z.object({
    application_id: z.string().uuid('Invalid Application ID')
});
