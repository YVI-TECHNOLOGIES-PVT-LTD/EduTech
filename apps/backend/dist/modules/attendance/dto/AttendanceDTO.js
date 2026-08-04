"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitLeaveSchema = exports.transitionWorkflowSchema = exports.markAttendanceSchema = exports.createSessionSchema = void 0;
const zod_1 = require("zod");
exports.createSessionSchema = zod_1.z.object({
    campus_id: zod_1.z.string().uuid(),
    branch_id: zod_1.z.string().uuid(),
    academic_year_id: zod_1.z.string().uuid(),
    session_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timetable_slot_id: zod_1.z.string().uuid()
});
exports.markAttendanceSchema = zod_1.z.object({
    session_id: zod_1.z.string().uuid(),
    student_id: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEFT_EARLY', 'MEDICAL', 'ON_DUTY', 'SPORTS', 'FIELD_VISIT', 'ONLINE', 'HYBRID', 'EXEMPTED']),
    source: zod_1.z.enum(['MANUAL', 'QR', 'RFID', 'BIOMETRIC', 'FACE_RECOGNITION', 'MOBILE_APP', 'NFC', 'API_IMPORT']).default('MANUAL')
});
exports.transitionWorkflowSchema = zod_1.z.object({
    session_id: zod_1.z.string().uuid(),
    decision: zod_1.z.enum(['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED']),
    comments: zod_1.z.string().optional()
});
exports.submitLeaveSchema = zod_1.z.object({
    student_id: zod_1.z.string().uuid(),
    start_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    leave_type: zod_1.z.enum(['MEDICAL', 'SPORTS', 'DUTY', 'INTERNSHIP', 'CASUAL']),
    reason: zod_1.z.string().min(1)
});
