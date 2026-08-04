"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.correctionRequestSchema = exports.rejectDocumentSchema = exports.verifyDocumentSchema = exports.uploadDocumentSchema = void 0;
const zod_1 = require("zod");
exports.uploadDocumentSchema = zod_1.z.object({
    application_id: zod_1.z.string().uuid('Application ID must be a valid UUID'),
    document_type_code: zod_1.z.string().min(1, 'Document Type Code is required').trim()
});
exports.verifyDocumentSchema = zod_1.z.object({
    remarks: zod_1.z.string().trim().nullable().optional()
});
exports.rejectDocumentSchema = zod_1.z.object({
    remarks: zod_1.z.string().min(1, 'Rejection remarks/reason is required').trim()
});
exports.correctionRequestSchema = zod_1.z.object({
    remarks: zod_1.z.string().min(1, 'Correction details are required').trim()
});
