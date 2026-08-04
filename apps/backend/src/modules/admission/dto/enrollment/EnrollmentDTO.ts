import { z } from 'zod';

export const assignFeeSchema = z.object({
    application_id: z.string().uuid('Invalid Application ID'),
    structure_id: z.string().uuid('Invalid Fee Structure ID')
});

export const collectPaymentSchema = z.object({
    application_id: z.string().uuid('Invalid Application ID'),
    amount: z.number().min(1, 'Amount must be greater than 0'),
    payment_mode: z.enum(['Cash', 'Card', 'Cheque', 'Bank_Transfer', 'Online_Gateway']),
    transaction_number: z.string().trim().optional(),
    gateway_reference: z.string().trim().optional()
});

export const verifyPaymentSchema = z.object({
    payment_id: z.string().uuid('Invalid Payment ID'),
    status: z.enum(['COMPLETED', 'FAILED'])
});

export const generateReceiptSchema = z.object({
    payment_id: z.string().uuid('Invalid Payment ID')
});

export const confirmAdmissionSchema = z.object({
    application_id: z.string().uuid('Invalid Application ID')
});

export const generateAdmissionNumberSchema = z.object({
    school_id: z.string().uuid('Invalid School ID')
});

export const enrollStudentSchema = z.object({
    application_id: z.string().uuid('Invalid Application ID')
});

export const feeWaiverSchema = z.object({
    application_id: z.string().uuid('Invalid Application ID'),
    component_id: z.string().uuid('Invalid Component ID'),
    amount: z.number().min(1, 'Waived amount must be greater than 0'),
    remarks: z.string().min(1, 'Remarks/reason is required').trim()
});
