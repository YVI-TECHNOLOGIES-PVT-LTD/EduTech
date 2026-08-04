"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.generateIdentitySchema = exports.promoteStudentSchema = exports.transferStudentSchema = exports.allocateClassSchema = exports.updateStudentSchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
exports.createStudentSchema = zod_1.z.object({
    admission_no: zod_1.z.string().min(1, 'Admission number is required').trim(),
    first_name: zod_1.z.string().min(1, 'First name is required').trim(),
    last_name: zod_1.z.string().min(1, 'Last name is required').trim(),
    school_id: zod_1.z.string().uuid('Invalid School ID'),
    academic_year_id: zod_1.z.string().uuid('Invalid Academic Year ID'),
    user_id: zod_1.z.string().uuid('Invalid User ID').optional()
});
exports.updateStudentSchema = zod_1.z.object({
    first_name: zod_1.z.string().min(1).trim().optional(),
    last_name: zod_1.z.string().min(1).trim().optional(),
    status: zod_1.z.enum(['NEW', 'ACTIVE', 'PROMOTED', 'SUSPENDED', 'TRANSFERRED', 'LEFT', 'ALUMNI']).optional()
});
exports.allocateClassSchema = zod_1.z.object({
    grade: zod_1.z.string().min(1, 'Grade is required').trim(),
    section_id: zod_1.z.string().uuid('Invalid Section ID'),
    roll_number: zod_1.z.number().int().min(1).optional()
});
exports.transferStudentSchema = zod_1.z.object({
    destination_school: zod_1.z.string().min(1, 'Destination school is required').trim(),
    reason: zod_1.z.string().min(1, 'Reason is required').trim()
});
exports.promoteStudentSchema = zod_1.z.object({
    to_academic_year_id: zod_1.z.string().uuid('Invalid Academic Year ID'),
    to_grade: zod_1.z.string().min(1, 'Grade is required').trim(),
    to_section_id: zod_1.z.string().uuid('Invalid Section ID').optional(),
    promotion_reason: zod_1.z.string().min(1, 'Reason is required').trim()
});
exports.generateIdentitySchema = zod_1.z.object({
    barcode_value: zod_1.z.string().min(1, 'Barcode is required').trim()
});
exports.updateProfileSchema = zod_1.z.object({
    date_of_birth: zod_1.z.string().datetime('Invalid Date of Birth').optional(),
    gender: zod_1.z.string().min(1).optional(),
    blood_group: zod_1.z.string().nullable().optional(),
    nationality: zod_1.z.string().nullable().optional(),
    religion: zod_1.z.string().nullable().optional(),
    category: zod_1.z.string().nullable().optional(),
    aadhaar: zod_1.z.string().nullable().optional(),
    photo_url: zod_1.z.string().nullable().optional(),
    allergies: zod_1.z.string().nullable().optional(),
    medical_conditions: zod_1.z.string().nullable().optional(),
    emergency_notes: zod_1.z.string().nullable().optional()
});
