"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feeWaiverSchema = exports.enrollStudentSchema = exports.generateAdmissionNumberSchema = exports.confirmAdmissionSchema = exports.generateReceiptSchema = exports.verifyPaymentSchema = exports.collectPaymentSchema = exports.assignFeeSchema = void 0;
const zod_1 = require("zod");
exports.assignFeeSchema = zod_1.z.object({
    application_id: zod_1.z.string().uuid('Invalid Application ID'),
    structure_id: zod_1.z.string().uuid('Invalid Fee Structure ID')
});
exports.collectPaymentSchema = zod_1.z.object({
    application_id: zod_1.z.string().uuid('Invalid Application ID'),
    amount: zod_1.z.number().min(1, 'Amount must be greater than 0'),
    payment_mode: zod_1.z.enum(['Cash', 'Card', 'Cheque', 'Bank_Transfer', 'Online_Gateway']),
    transaction_number: zod_1.z.string().trim().optional(),
    gateway_reference: zod_1.z.string().trim().optional()
});
exports.verifyPaymentSchema = zod_1.z.object({
    payment_id: zod_1.z.string().uuid('Invalid Payment ID'),
    status: zod_1.z.enum(['COMPLETED', 'FAILED'])
});
exports.generateReceiptSchema = zod_1.z.object({
    payment_id: zod_1.z.string().uuid('Invalid Payment ID')
});
exports.confirmAdmissionSchema = zod_1.z.object({
    application_id: zod_1.z.string().uuid('Invalid Application ID')
});
exports.generateAdmissionNumberSchema = zod_1.z.object({
    school_id: zod_1.z.string().uuid('Invalid School ID')
});
exports.enrollStudentSchema = zod_1.z.object({
    application_id: zod_1.z.string().uuid('Invalid Application ID')
});
exports.feeWaiverSchema = zod_1.z.object({
    application_id: zod_1.z.string().uuid('Invalid Application ID'),
    component_id: zod_1.z.string().uuid('Invalid Component ID'),
    amount: zod_1.z.number().min(1, 'Waived amount must be greater than 0'),
    remarks: zod_1.z.string().min(1, 'Remarks/reason is required').trim()
});
