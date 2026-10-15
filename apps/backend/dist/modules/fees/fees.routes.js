"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feesRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const permissions_1 = require("../../rbac/permissions");
const supabase_1 = require("../../config/supabase");
const FinanceEngine_1 = require("./services/FinanceEngine");
const ReportingService_1 = require("./services/ReportingService");
const SettingsService_1 = require("./services/SettingsService");
const LedgerPostingService_1 = require("./services/LedgerPostingService");
const FinanceController_1 = require("./controllers/FinanceController");
exports.feesRouter = (0, express_1.Router)();
// ======================================
// 1. STRUCTURES (Fee Structure Management Phase 3)
// ======================================
const FeeStructureManagerService_1 = require("./services/FeeStructureManagerService");
// GET /structures/summary: Summary metrics for dashboard/header
exports.feesRouter.get('/structures/summary', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_STRUCTURE_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId } = req.query;
        const metrics = await FeeStructureManagerService_1.FeeStructureManagerService.getSummaryMetrics(tenantOrgId, academicYearId);
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        console.error('[GET /fees/structures/summary] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'SUMMARY_METRICS_ERROR',
            message: error.message || 'Failed to fetch fee structure summary metrics'
        });
    }
});
// GET /structures/academic-year-grades: Eligible grades for fee structure setup
exports.feesRouter.get('/structures/academic-year-grades', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_STRUCTURE_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId } = req.query;
        const grades = await FeeStructureManagerService_1.FeeStructureManagerService.getAcademicYearGrades(tenantOrgId, academicYearId);
        res.json({
            success: true,
            data: grades
        });
    }
    catch (error) {
        console.error('[GET /fees/structures/academic-year-grades] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'ACADEMIC_YEAR_GRADES_ERROR',
            message: error.message || 'Failed to fetch academic year grades'
        });
    }
});
// GET /structures/installment-plans: Available installment plans for academic year preview
exports.feesRouter.get('/structures/installment-plans', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_STRUCTURE_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId } = req.query;
        const plans = await FeeStructureManagerService_1.FeeStructureManagerService.getInstallmentPlans(tenantOrgId, academicYearId);
        res.json({
            success: true,
            data: plans
        });
    }
    catch (error) {
        console.error('[GET /fees/structures/installment-plans] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'INSTALLMENT_PLANS_ERROR',
            message: error.message || 'Failed to fetch installment plans'
        });
    }
});
// GET /structures/:id: Fetch single structure by ID
exports.feesRouter.get('/structures/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_STRUCTURE_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { id } = req.params;
        const structure = await FeeStructureManagerService_1.FeeStructureManagerService.getStructureById(tenantOrgId, id);
        res.json({
            success: true,
            data: structure
        });
    }
    catch (error) {
        console.error('[GET /fees/structures/:id] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'STRUCTURE_FETCH_ERROR',
            message: error.message || 'Failed to fetch fee structure'
        });
    }
});
// GET /structures: List active & filterable fee structures
exports.feesRouter.get('/structures', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_STRUCTURE_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId, gradeId, status, search, page, limit } = req.query;
        const result = await FeeStructureManagerService_1.FeeStructureManagerService.listStructures(tenantOrgId, {
            academicYearId: academicYearId,
            gradeId: gradeId,
            status: status,
            search: search,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        // Backward compatibility: also support returning array directly if needed or envelope
        res.json({
            success: true,
            ...result,
            // Also provide top-level array alias for any legacy consumers
            structures: result.items,
        });
    }
    catch (error) {
        console.error('[GET /fees/structures] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'STRUCTURE_LIST_ERROR',
            message: error.message || 'Failed to list fee structures'
        });
    }
});
// POST /structures: Create new fee structure
exports.feesRouter.post('/structures', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_SETUP), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const userId = req.context?.user?.id || 'system';
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const structure = await FeeStructureManagerService_1.FeeStructureManagerService.createStructure(tenantOrgId, userId, req.body);
        res.status(201).json({
            success: true,
            message: 'Fee structure created successfully as draft.',
            data: structure
        });
    }
    catch (error) {
        console.error('[POST /fees/structures] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'STRUCTURE_CREATE_ERROR',
            message: error.message || 'Failed to create fee structure'
        });
    }
});
// PUT /structures/:id: Update fee structure
exports.feesRouter.put('/structures/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_SETUP), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const userId = req.context?.user?.id || 'system';
        const { id } = req.params;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const structure = await FeeStructureManagerService_1.FeeStructureManagerService.updateStructure(tenantOrgId, userId, id, req.body);
        res.json({
            success: true,
            message: 'Fee structure updated successfully.',
            data: structure
        });
    }
    catch (error) {
        console.error('[PUT /fees/structures/:id] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'STRUCTURE_UPDATE_ERROR',
            message: error.message || 'Failed to update fee structure'
        });
    }
});
// PATCH /structures/:id: Partial update fee structure
exports.feesRouter.patch('/structures/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_SETUP), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const userId = req.context?.user?.id || 'system';
        const { id } = req.params;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const structure = await FeeStructureManagerService_1.FeeStructureManagerService.updateStructure(tenantOrgId, userId, id, req.body);
        res.json({
            success: true,
            message: 'Fee structure updated successfully.',
            data: structure
        });
    }
    catch (error) {
        console.error('[PATCH /fees/structures/:id] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'STRUCTURE_UPDATE_ERROR',
            message: error.message || 'Failed to update fee structure'
        });
    }
});
// POST /structures/:id/publish: Publish fee structure
exports.feesRouter.post('/structures/:id/publish', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_SETUP), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const userId = req.context?.user?.id || 'system';
        const { id } = req.params;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const structure = await FeeStructureManagerService_1.FeeStructureManagerService.publishStructure(tenantOrgId, userId, id);
        res.json({
            success: true,
            message: 'Fee structure published successfully.',
            data: structure
        });
    }
    catch (error) {
        console.error('[POST /fees/structures/:id/publish] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'STRUCTURE_PUBLISH_ERROR',
            message: error.message || 'Failed to publish fee structure'
        });
    }
});
// POST /structures/:id/deactivate: Deactivate fee structure
exports.feesRouter.post('/structures/:id/deactivate', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_SETUP), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const userId = req.context?.user?.id || 'system';
        const { id } = req.params;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const structure = await FeeStructureManagerService_1.FeeStructureManagerService.deactivateStructure(tenantOrgId, userId, id);
        res.json({
            success: true,
            message: 'Fee structure deactivated successfully.',
            data: structure
        });
    }
    catch (error) {
        console.error('[POST /fees/structures/:id/deactivate] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'STRUCTURE_DEACTIVATE_ERROR',
            message: error.message || 'Failed to deactivate fee structure'
        });
    }
});
// DELETE /structures/:id: Deactivate/archive fee structure
exports.feesRouter.delete('/structures/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_SETUP), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const userId = req.context?.user?.id || 'system';
        const { id } = req.params;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const structure = await FeeStructureManagerService_1.FeeStructureManagerService.deactivateStructure(tenantOrgId, userId, id);
        res.json({
            success: true,
            message: 'Fee structure deactivated successfully.',
            data: structure
        });
    }
    catch (error) {
        console.error('[DELETE /fees/structures/:id] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'STRUCTURE_DELETE_ERROR',
            message: error.message || 'Failed to archive fee structure'
        });
    }
});
// GET /application/:applicationId/preview: Get fee structures and components preview for an admission application
exports.feesRouter.get('/application/:applicationId/preview', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_FEES_INITIALIZE), FinanceController_1.FinanceController.getFeePreview);
// GET /demands: List billing demands
exports.feesRouter.get('/demands', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_DEMAND_VIEW), async (req, res) => {
    try {
        const { status, studentId, applicationId } = req.query;
        let query = supabase_1.supabase
            .from('fee_demands')
            .select(`
                    *,
                    student:student_id(full_name, student_code),
                    application:application_id(
                        id,
                        lead:lead_id(
                            enquiry:enquiry_id(student_name, grade_applied_for)
                        )
                    ),
                    items:fee_demand_items(*)
                `)
            .order('due_date', { ascending: false });
        if (status)
            query = query.eq('status', status);
        if (studentId)
            query = query.eq('student_id', studentId);
        if (applicationId)
            query = query.eq('application_id', applicationId);
        const { data, error } = await query;
        if (error)
            throw error;
        // Map data to match the expected frontend contract
        const mapped = (data || []).map((d) => {
            const enquiry = d.application?.lead?.enquiry;
            return {
                ...d,
                application: d.application ? {
                    id: d.application.id,
                    applicant_name: enquiry?.student_name || 'Applicant',
                    class_applied: enquiry?.grade_applied_for || ''
                } : null
            };
        });
        res.json(mapped);
    }
    catch (error) {
        console.error("[DEBUG GET /demands error]:", error);
        res.status(500).json({ error: error.message });
    }
});
// POST /demands/generate: Allocate billing structure demand (Supports bulk generation)
exports.feesRouter.post('/demands/generate', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_DEMAND_GENERATE), async (req, res) => {
    try {
        const userId = req.context.user.id;
        const { application_id, student_id, student_ids, fee_structure_id, due_date } = req.body;
        // Support bulk generation by class student list
        if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
            const results = [];
            for (const sId of student_ids) {
                const demand = await FinanceEngine_1.FinanceEngine.initializeDemand({
                    student_id: sId,
                    fee_structure_id,
                    due_date,
                    performedBy: userId
                });
                results.push(demand);
            }
            return res.status(201).json(results);
        }
        const demand = await FinanceEngine_1.FinanceEngine.initializeDemand({
            application_id,
            student_id,
            fee_structure_id,
            due_date,
            performedBy: userId
        });
        res.status(201).json(demand);
    }
    catch (error) {
        console.error("POST /fees/demands/generate error:", error);
        res.status(500).json({ error: error.message });
    }
});
// ======================================
// 3. PAYMENTS COLLECTION (Phase 5: Payment Collection)
// ======================================
const PaymentCollectionService_1 = require("./services/PaymentCollectionService");
// GET /payments/students/:studentId/obligations: Fetch eligible unpaid dues for collection
exports.feesRouter.get('/payments/students/:studentId/obligations', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { studentId } = req.params;
        const result = await PaymentCollectionService_1.PaymentCollectionService.getEligibleObligations(tenantOrgId, studentId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error(`[GET /fees/payments/students/${req.params.studentId}/obligations] Error:`, error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'ELIGIBLE_OBLIGATIONS_ERROR',
            message: error.message || 'Failed to fetch student unpaid obligations'
        });
    }
});
// POST /payments/collect: Record verified offline payment (Cash, Bank Transfer, Other)
exports.feesRouter.post('/payments/collect', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.PAYMENT_RECORD), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const userId = req.context?.user?.id || req.context?.user?.user_id || null;
        const result = await PaymentCollectionService_1.PaymentCollectionService.recordOfflinePayment(tenantOrgId, userId, req.body);
        res.status(201).json({
            success: true,
            message: 'Payment collected and allocated successfully',
            data: result
        });
    }
    catch (error) {
        console.error('[POST /fees/payments/collect] Error:', error);
        const status = error.statusCode || 400;
        res.status(status).json({
            success: false,
            error: error.code || 'PAYMENT_COLLECTION_ERROR',
            message: error.message || 'Failed to record offline payment'
        });
    }
});
// POST /payments/create-order: Create online payment order (UPI, Card, Net Banking, Wallet via Razorpay)
exports.feesRouter.post('/payments/create-order', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.PAYMENT_RECORD), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const userId = req.context?.user?.id || req.context?.user?.user_id || null;
        const result = await PaymentCollectionService_1.PaymentCollectionService.createOnlinePaymentOrder(tenantOrgId, userId, req.body);
        res.status(201).json({
            success: true,
            message: 'Payment order created successfully',
            data: result
        });
    }
    catch (error) {
        console.error('[POST /fees/payments/create-order] Error:', error);
        const status = error.statusCode || 400;
        res.status(status).json({
            success: false,
            error: error.code || 'CREATE_ORDER_ERROR',
            message: error.message || 'Failed to create payment order'
        });
    }
});
// POST /payments/verify: Cryptographically verify online payment signature and allocate
exports.feesRouter.post('/payments/verify', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.PAYMENT_RECORD), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const userId = req.context?.user?.id || req.context?.user?.user_id || null;
        const result = await PaymentCollectionService_1.PaymentCollectionService.verifyOnlinePayment(tenantOrgId, userId, req.body);
        res.json({
            success: true,
            message: 'Payment verified and captured successfully',
            data: result
        });
    }
    catch (error) {
        console.error('[POST /fees/payments/verify] Error:', error);
        const status = error.statusCode || 400;
        res.status(status).json({
            success: false,
            error: error.code || 'PAYMENT_VERIFICATION_ERROR',
            message: error.message || 'Payment signature verification failed'
        });
    }
});
// POST /payments/webhook: Dedicated Razorpay Webhook Ingestion
// Authenticated cryptographically via x-razorpay-signature header against RAZORPAY_WEBHOOK_SECRET
exports.feesRouter.post('/payments/webhook', async (req, res) => {
    try {
        const signature = (req.headers['x-razorpay-signature'] || '');
        if (!signature) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_SIGNATURE',
                message: 'Missing x-razorpay-signature header for webhook authentication.'
            });
        }
        const rawBody = req.rawBody;
        if (!rawBody || (Buffer.isBuffer(rawBody) && rawBody.length === 0)) {
            return res.status(400).json({
                success: false,
                error: 'RAW_BODY_UNAVAILABLE',
                message: 'Raw request body is unavailable for cryptographic webhook signature verification.'
            });
        }
        const result = await PaymentCollectionService_1.PaymentCollectionService.processWebhookEvent(rawBody, signature, req.body);
        res.status(200).json({
            success: true,
            message: result.message,
            data: result
        });
    }
    catch (error) {
        console.error('[POST /fees/payments/webhook] Error:', error);
        const status = error.statusCode || 400;
        res.status(status).json({
            success: false,
            error: error.code || 'WEBHOOK_VERIFICATION_FAILED',
            message: error.message || 'Failed to process webhook event'
        });
    }
});
// GET /payments/history: Tenant-scoped payment transactions history
exports.feesRouter.get('/payments/history', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_PAYMENT_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { studentId, status, paymentMethod, dateFrom, dateTo, page, limit } = req.query;
        const result = await PaymentCollectionService_1.PaymentCollectionService.getPaymentHistory(tenantOrgId, {
            studentId: studentId,
            status: status,
            paymentMethod: paymentMethod,
            dateFrom: dateFrom,
            dateTo: dateTo,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        res.json({
            success: true,
            data: result.transactions,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error('[GET /fees/payments/history] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'PAYMENT_HISTORY_ERROR',
            message: error.message || 'Failed to fetch payment history'
        });
    }
});
// GET /payments/receipts/:transactionId: Official receipt document for a transaction
exports.feesRouter.get('/payments/receipts/:transactionId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { transactionId } = req.params;
        const receipt = await PaymentCollectionService_1.PaymentCollectionService.getReceiptDetails(tenantOrgId, transactionId);
        res.json({
            success: true,
            data: receipt
        });
    }
    catch (error) {
        console.error(`[GET /fees/payments/receipts/${req.params.transactionId}] Error:`, error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'RECEIPT_FETCH_ERROR',
            message: error.message || 'Failed to fetch receipt details'
        });
    }
});
// Backward compatibility: POST /payments
exports.feesRouter.post('/payments', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.PAYMENT_RECORD), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const userId = req.context?.user?.id || req.context?.user?.user_id || null;
        const { student_id, studentId, student_charge_due_id, studentChargeDueId, demand_id, amount, payment_mode, paymentMethod, transaction_reference, notes } = req.body;
        const targetStudentId = studentId || student_id;
        const targetDueId = studentChargeDueId || student_charge_due_id || demand_id;
        // If payload has student ID and obligation due ID, delegate to PaymentCollectionService
        if (tenantOrgId && targetStudentId && targetDueId) {
            const methodStr = (paymentMethod || payment_mode || 'cash').toLowerCase();
            const mappedMethod = methodStr.includes('upi')
                ? 'upi'
                : methodStr.includes('card')
                    ? 'card'
                    : methodStr.includes('transfer') || methodStr.includes('bank')
                        ? 'bank_transfer'
                        : methodStr.includes('cash')
                            ? 'cash'
                            : 'other';
            if (['cash', 'bank_transfer', 'other'].includes(mappedMethod)) {
                const result = await PaymentCollectionService_1.PaymentCollectionService.recordOfflinePayment(tenantOrgId, userId, {
                    studentId: targetStudentId,
                    studentChargeDueId: targetDueId,
                    amount: Number(amount),
                    paymentMethod: mappedMethod,
                    transactionReference: transaction_reference,
                    notes: notes,
                });
                return res.status(201).json(result);
            }
        }
        // Fallback to legacy FinanceEngine
        const result = await FinanceEngine_1.FinanceEngine.collectPayment({
            application_id: req.body.application_id,
            student_id: targetStudentId,
            demand_id: targetDueId,
            amount: Number(amount),
            payment_mode: req.body.payment_mode || 'Cash',
            transaction_reference: transaction_reference,
            bank_name: req.body.bank_name,
            gateway_name: req.body.gateway_name,
            gateway_transaction_id: req.body.gateway_transaction_id,
            payment_channel: req.body.payment_channel,
            cashierId: userId || 'CASHIER'
        });
        res.status(201).json(result);
    }
    catch (error) {
        console.error("POST /fees/payments error:", error);
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});
// ======================================
// 4. RECEIPTS
// ======================================
exports.feesRouter.get('/receipts/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const { id } = req.params;
        // Attempt to resolve via PaymentCollectionService if tenantOrgId is available
        if (tenantOrgId) {
            try {
                const receipt = await PaymentCollectionService_1.PaymentCollectionService.getReceiptDetails(tenantOrgId, id);
                if (receipt)
                    return res.json(receipt);
            }
            catch {
                // Fallback to supabase fee_receipts
            }
        }
        const receipt = await supabase_1.supabase
            .from('fee_receipts')
            .select(`
                    *,
                    payment_transaction:payment_transaction_id(
                        *,
                        student:student_id(full_name, student_code),
                        application:application_id(
                            id,
                            lead:lead_id(
                                enquiry:enquiry_id(student_name, grade_applied_for)
                            )
                        )
                    )
                `)
            .eq('id', id)
            .single();
        if (receipt.error)
            throw receipt.error;
        const data = receipt.data;
        if (data && data.payment_transaction?.application) {
            const enquiry = data.payment_transaction.application.lead?.enquiry;
            data.payment_transaction.application = {
                id: data.payment_transaction.application.id,
                applicant_name: enquiry?.student_name || 'Applicant',
                class_applied: enquiry?.grade_applied_for || ''
            };
        }
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.feesRouter.post('/receipts/:id/reprint', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_RECEIPT_GENERATE), async (req, res) => {
    try {
        const userId = req.context.user.id;
        const { id } = req.params;
        const { data: orig, error: origErr } = await supabase_1.supabase
            .from('fee_receipts')
            .select('payment_transaction_id, print_count')
            .eq('id', id)
            .single();
        if (origErr || !orig)
            throw new Error("Original receipt not found");
        // Increment original reprint counter
        await supabase_1.supabase
            .from('fee_receipts')
            .update({ print_count: (orig.print_count || 0) + 1 })
            .eq('id', id);
        // Create Duplicate Reprint entry
        const reprint = await FinanceEngine_1.FinanceEngine.generateReceipt({
            payment_transaction_id: orig.payment_transaction_id,
            receipt_type: 'REPRINT',
            generatedBy: userId
        });
        res.status(201).json(reprint);
    }
    catch (error) {
        console.error("POST /receipts/reprint error:", error);
        res.status(500).json({ error: error.message });
    }
});
// ======================================
// 5. LEDGER & BALANCES (Phase 4: Student Fee Ledger)
// ======================================
const StudentLedgerService_1 = require("./services/StudentLedgerService");
// GET /ledger/students: Search eligible students for ledger management
exports.feesRouter.get('/ledger/students', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { query, academicYearId, gradeId, page, limit } = req.query;
        const result = await StudentLedgerService_1.StudentLedgerService.searchStudents(tenantOrgId, {
            query: query,
            academicYearId: academicYearId,
            gradeId: gradeId,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined
        });
        res.json({
            success: true,
            data: result.students,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error('[GET /fees/ledger/students] Error:', error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'LEDGER_SEARCH_ERROR',
            message: error.message || 'Failed to search students for fee ledger'
        });
    }
});
// GET /ledger/students/:studentId: Student ledger summary, KPI totals, and enrollment details
exports.feesRouter.get('/ledger/students/:studentId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { studentId } = req.params;
        const { academicYearId } = req.query;
        const summary = await StudentLedgerService_1.StudentLedgerService.getStudentLedgerSummary(tenantOrgId, studentId, academicYearId);
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error(`[GET /fees/ledger/students/${req.params.studentId}] Error:`, error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'LEDGER_SUMMARY_ERROR',
            message: error.message || 'Failed to fetch student ledger summary'
        });
    }
});
// GET /ledger/students/:studentId/assessments: Detailed fee assessments, structures, and billed charges
exports.feesRouter.get('/ledger/students/:studentId/assessments', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { studentId } = req.params;
        const assessments = await StudentLedgerService_1.StudentLedgerService.getStudentAssessments(tenantOrgId, studentId);
        res.json({
            success: true,
            data: assessments
        });
    }
    catch (error) {
        console.error(`[GET /fees/ledger/students/${req.params.studentId}/assessments] Error:`, error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'ASSESSMENTS_FETCH_ERROR',
            message: error.message || 'Failed to fetch student fee assessments'
        });
    }
});
// GET /ledger/students/:studentId/payments: Recorded payment transactions and obligation allocations
exports.feesRouter.get('/ledger/students/:studentId/payments', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { studentId } = req.params;
        const payments = await StudentLedgerService_1.StudentLedgerService.getStudentPayments(tenantOrgId, studentId);
        res.json({
            success: true,
            data: payments
        });
    }
    catch (error) {
        console.error(`[GET /fees/ledger/students/${req.params.studentId}/payments] Error:`, error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'PAYMENTS_FETCH_ERROR',
            message: error.message || 'Failed to fetch student payment history'
        });
    }
});
// GET /ledger/students/:studentId/dues: Scheduled fee dues, due dates, outstanding amounts, and overdue status
exports.feesRouter.get('/ledger/students/:studentId/dues', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { studentId } = req.params;
        const dues = await StudentLedgerService_1.StudentLedgerService.getStudentDues(tenantOrgId, studentId);
        res.json({
            success: true,
            data: dues
        });
    }
    catch (error) {
        console.error(`[GET /fees/ledger/students/${req.params.studentId}/dues] Error:`, error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'DUES_FETCH_ERROR',
            message: error.message || 'Failed to fetch student fee obligations'
        });
    }
});
// GET /ledger/students/:studentId/transactions: Chronological timeline of ledger transactions and events
exports.feesRouter.get('/ledger/students/:studentId/transactions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { studentId } = req.params;
        const history = await StudentLedgerService_1.StudentLedgerService.getStudentTransactionHistory(tenantOrgId, studentId);
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
        console.error(`[GET /fees/ledger/students/${req.params.studentId}/transactions] Error:`, error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'TRANSACTIONS_FETCH_ERROR',
            message: error.message || 'Failed to fetch student ledger transaction history'
        });
    }
});
// GET /ledger/students/:studentId/eligible-structures: Published fee structures matching student enrollment
exports.feesRouter.get('/ledger/students/:studentId/eligible-structures', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { studentId } = req.params;
        const elig = await StudentLedgerService_1.StudentLedgerService.getEligibleStructures(tenantOrgId, studentId);
        res.json({
            success: true,
            data: elig
        });
    }
    catch (error) {
        console.error(`[GET /fees/ledger/students/${req.params.studentId}/eligible-structures] Error:`, error);
        const status = error.statusCode || 500;
        res.status(status).json({
            success: false,
            error: error.code || 'ELIGIBLE_STRUCTURES_ERROR',
            message: error.message || 'Failed to fetch eligible fee structures'
        });
    }
});
// POST /ledger/assignments: Assign a published fee structure to an eligible student enrollment
exports.feesRouter.post('/ledger/assignments', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_ASSIGN), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const userId = req.context?.user?.id || req.context?.user?.user_id || null;
        const assignment = await StudentLedgerService_1.StudentLedgerService.assignFeeStructure(tenantOrgId, userId, req.body);
        res.status(201).json({
            success: true,
            message: 'Fee structure assigned to student enrollment successfully',
            data: assignment
        });
    }
    catch (error) {
        console.error('[POST /fees/ledger/assignments] Error:', error);
        const status = error.statusCode || 400;
        res.status(status).json({
            success: false,
            error: error.code || 'STRUCTURE_ASSIGNMENT_ERROR',
            message: error.message || 'Failed to assign fee structure'
        });
    }
});
// Backward compatibility: GET /ledger/student/:studentId
exports.feesRouter.get('/ledger/student/:studentId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const { studentId } = req.params;
        if (tenantOrgId) {
            const summary = await StudentLedgerService_1.StudentLedgerService.getStudentLedgerSummary(tenantOrgId, studentId);
            const history = await StudentLedgerService_1.StudentLedgerService.getStudentTransactionHistory(tenantOrgId, studentId);
            return res.json({
                student_id: studentId,
                balance: summary.summary.outstanding_balance,
                entries: history,
                history: history,
                summary: summary.summary
            });
        }
        // Fallback
        const balance = await FinanceEngine_1.FinanceEngine.calculateBalance({ student_id: studentId });
        const entries = await FinanceEngine_1.FinanceEngine.getLedgerHistory({ student_id: studentId });
        res.json({ student_id: studentId, balance, entries, history: entries });
    }
    catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});
// Backward compatibility: GET /ledger/application/:applicationId
exports.feesRouter.get('/ledger/application/:applicationId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const { applicationId } = req.params;
        const balance = await FinanceEngine_1.FinanceEngine.calculateBalance({ application_id: applicationId });
        const entries = await FinanceEngine_1.FinanceEngine.getLedgerHistory({ application_id: applicationId });
        res.json({
            application_id: applicationId,
            balance,
            entries,
            history: entries
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Backward compatibility: GET /admin/ledger
exports.feesRouter.get('/admin/ledger', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const { search } = req.query;
        if (tenantOrgId) {
            const result = await StudentLedgerService_1.StudentLedgerService.searchStudents(tenantOrgId, {
                query: search,
                limit: 50
            });
            const formatted = result.students.map((s) => ({
                student_id: s.student_id,
                full_name: s.full_name,
                student_code: s.admission_no,
                class_name: s.enrollment?.grade_name || '-',
                balance: 0,
                status: s.status
            }));
            return res.json({ data: formatted });
        }
        res.json({ data: [] });
    }
    catch (error) {
        console.error("GET /admin/ledger error:", error);
        res.status(500).json({ error: error.message });
    }
});
// ======================================
// 6. DASHBOARD ANALYTICS (KPIs and Trends)
// ======================================
exports.feesRouter.get('/dashboard/kpis', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const schoolId = req.context.user.school_id;
        const today = new Date().toISOString().split('T')[0];
        // 1. Today's collections
        const { data: todayTx } = await supabase_1.supabase
            .from('payment_transactions')
            .select('amount')
            .eq('status', 'SUCCESS')
            .gte('created_at', `${today}T00:00:00.000Z`);
        const todayCollection = todayTx?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        // 2. Month collections
        const thisMonthStart = `${today.substring(0, 7)}-01T00:00:00.000Z`;
        const { data: monthTx } = await supabase_1.supabase
            .from('payment_transactions')
            .select('amount')
            .eq('status', 'SUCCESS')
            .gte('created_at', thisMonthStart);
        const monthCollection = monthTx?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        // 3. Outstanding Balance (Sum of all ledger running balances)
        // Or sum of all fee_demands balance_amount which is much more performant!
        const { data: pendingDemands } = await supabase_1.supabase
            .from('fee_demands')
            .select('balance_amount, amount')
            .in('status', ['PENDING', 'PARTIAL']);
        const totalOutstanding = pendingDemands?.reduce((sum, d) => sum + Number(d.balance_amount), 0) || 0;
        const pendingCount = pendingDemands?.length || 0;
        // 4. Active Fee Structures template count
        const { count: activeStructures } = await supabase_1.supabase
            .from('finance_fee_structures')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .eq('is_active', true);
        // 5. Total Transactions
        const { count: txCount } = await supabase_1.supabase
            .from('payment_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'SUCCESS');
        res.json({
            todayCollection,
            monthCollection,
            totalOutstanding,
            pendingCount,
            activeStructuresCount: activeStructures || 0,
            transactionsCount: txCount || 0,
            collectionRate: 85 // Mock placeholder percentage
        });
    }
    catch (error) {
        console.error("GET /dashboard/kpis error:", error);
        res.status(500).json({ error: error.message });
    }
});
// Backward compatibility helper `/my` (Parents Dashboard)
exports.feesRouter.get('/my', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.DASHBOARD_VIEW_PARENT), async (req, res) => {
    try {
        const userId = req.context.user.id;
        const { data: links } = await supabase_1.supabase.from('student_parents').select('student_id').eq('parent_user_id', userId);
        if (!links || links.length === 0)
            return res.json([]);
        const results = [];
        for (const link of links) {
            const sid = link.student_id;
            const { data: student } = await supabase_1.supabase.from('students').select('full_name, student_code').eq('id', sid).single();
            const balance = await FinanceEngine_1.FinanceEngine.calculateBalance({ student_id: sid });
            const history = await FinanceEngine_1.FinanceEngine.getLedgerHistory({ student_id: sid });
            results.push({
                student,
                balance,
                history
            });
        }
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ======================================
// PHASE 2: NEW ENDPOINTS
// ======================================
// ──────────────────────────────────────
// DEMANDS — GET single demand detail
// ──────────────────────────────────────
exports.feesRouter.get('/demands/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_DEMAND_VIEW), async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase_1.supabase
            .from('fee_demands')
            .select(`
                    *,
                    student:student_id(id, full_name, student_code),
                    application:application_id(
                        id,
                        lead:lead_id(
                            enquiry:enquiry_id(student_name, grade_applied_for)
                        )
                    ),
                    fee_structure:fee_structure_id(id, name, version, academic_year:academic_years(year_label)),
                    items:fee_demand_items(*),
                    transactions:payment_transactions(
                        id, amount, payment_mode, transaction_reference, status, created_at, cashier_id
                    )
                `)
            .eq('id', id)
            .single();
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ error: 'Demand not found' });
        const resData = data;
        if (resData.application) {
            const enquiry = resData.application.lead?.enquiry;
            resData.application = {
                id: resData.application.id,
                applicant_name: enquiry?.student_name || 'Applicant',
                class_applied: enquiry?.grade_applied_for || ''
            };
        }
        res.json(resData);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// DEMANDS — Bulk generate (class/section/custom)
// ──────────────────────────────────────
exports.feesRouter.post('/demands/bulk-generate', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_DEMAND_GENERATE), async (req, res) => {
    try {
        const userId = req.context.user.id;
        const schoolId = req.context.user.school_id;
        const { mode, class_id, section_id, student_ids, fee_structure_id, due_date } = req.body;
        // mode: 'class' | 'section' | 'custom'
        if (!fee_structure_id || !due_date) {
            return res.status(400).json({ error: 'fee_structure_id and due_date are required' });
        }
        let targetStudentIds = [];
        if (mode === 'class' && class_id) {
            const { data: sections } = await supabase_1.supabase
                .from('sections')
                .select('id')
                .eq('class_id', class_id);
            const sectionIds = sections?.map(s => s.id) || [];
            const { data: enrollments } = await supabase_1.supabase
                .from('student_sections')
                .select('student_id')
                .in('section_id', sectionIds);
            targetStudentIds = enrollments?.map(e => e.student_id) || [];
        }
        else if (mode === 'section' && section_id) {
            const { data: enrollments } = await supabase_1.supabase
                .from('student_sections')
                .select('student_id')
                .eq('section_id', section_id);
            targetStudentIds = enrollments?.map(e => e.student_id) || [];
        }
        else if (mode === 'custom' && student_ids?.length > 0) {
            targetStudentIds = student_ids;
        }
        else {
            return res.status(400).json({ error: 'Invalid bulk generation parameters' });
        }
        if (targetStudentIds.length === 0) {
            return res.status(400).json({ error: 'No students found for selection' });
        }
        // Check for existing demands to avoid duplicates
        const { data: existing } = await supabase_1.supabase
            .from('fee_demands')
            .select('student_id')
            .eq('fee_structure_id', fee_structure_id)
            .in('student_id', targetStudentIds)
            .not('status', 'eq', 'CANCELLED');
        const alreadyBilled = new Set(existing?.map(e => e.student_id) || []);
        const toGenerate = targetStudentIds.filter(id => !alreadyBilled.has(id));
        const results = [];
        const errors = [];
        for (const sid of toGenerate) {
            try {
                const demand = await FinanceEngine_1.FinanceEngine.initializeDemand({
                    student_id: sid,
                    fee_structure_id,
                    due_date,
                    performedBy: userId
                });
                results.push(demand);
            }
            catch (err) {
                errors.push({ student_id: sid, error: err.message });
            }
        }
        res.status(201).json({
            generated: results.length,
            skipped: alreadyBilled.size,
            errors: errors.length,
            details: results,
            errorDetails: errors
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// DEMANDS — Cancel demand
// ──────────────────────────────────────
exports.feesRouter.patch('/demands/:id/cancel', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_DEMAND_GENERATE), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.context.user.id;
        const { reason } = req.body;
        const { data: demand } = await supabase_1.supabase
            .from('fee_demands')
            .select('status, balance_amount')
            .eq('id', id)
            .single();
        if (!demand)
            return res.status(404).json({ error: 'Demand not found' });
        if (demand.status === 'PAID')
            return res.status(422).json({ error: 'Cannot cancel a fully paid demand' });
        const { error } = await supabase_1.supabase
            .from('fee_demands')
            .update({
            status: 'CANCELLED',
            cancel_reason: reason || 'Cancelled by finance officer',
            cancelled_by: userId,
            cancelled_at: new Date().toISOString()
        })
            .eq('id', id);
        if (error)
            throw error;
        // Log audit
        await supabase_1.supabase.from('finance_audit_logs').insert({
            action: 'DEMAND_CANCELLED',
            entity_type: 'fee_demands',
            entity_id: id,
            performed_by: userId,
            details: { reason }
        });
        res.json({ success: true, message: 'Demand cancelled successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// WAIVERS — Apply waiver (posts WAIVER credit to ledger)
// ──────────────────────────────────────
exports.feesRouter.post('/waivers', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_WAIVER_APPROVE), async (req, res) => {
    try {
        const userId = req.context.user.id;
        const schoolId = req.context.user.school_id;
        const { demand_id, student_id, application_id, amount, reason } = req.body;
        if (!amount || amount <= 0)
            return res.status(400).json({ error: 'Invalid waiver amount' });
        // Update demand balance
        const { data: demand, error: dErr } = await supabase_1.supabase
            .from('fee_demands')
            .select('balance_amount')
            .eq('id', demand_id)
            .single();
        if (dErr || !demand)
            return res.status(404).json({ error: 'Demand not found' });
        const newBalance = Math.max(0, Number(demand.balance_amount) - Number(amount));
        await supabase_1.supabase.from('fee_demands').update({
            balance_amount: newBalance,
            status: newBalance === 0 ? 'PAID' : 'PARTIAL'
        }).eq('id', demand_id);
        // Post WAIVER credit to ledger
        await LedgerPostingService_1.LedgerPostingService.postEntry({
            student_id: student_id || null,
            application_id: application_id || null,
            school_id: schoolId,
            transaction_type: 'WAIVER',
            debit: 0,
            credit: Number(amount),
            reference_type: 'WAIVER',
            reference_id: demand_id,
            description: reason || 'Fee waiver approved',
            performed_by: userId
        });
        // Audit log
        await supabase_1.supabase.from('finance_audit_logs').insert({
            action: 'WAIVER_APPLIED',
            entity_type: 'fee_demands',
            entity_id: demand_id,
            performed_by: userId,
            school_id: schoolId,
            details: { amount, reason }
        });
        res.json({ success: true, message: `Waiver of ₹${amount} applied`, new_balance: newBalance });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// REFUNDS — Process refund
// ──────────────────────────────────────
exports.feesRouter.post('/refunds', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_REFUND_PROCESS), async (req, res) => {
    try {
        const userId = req.context.user.id;
        const schoolId = req.context.user.school_id;
        const { student_id, application_id, transaction_id, amount, reason } = req.body;
        if (!amount || amount <= 0)
            return res.status(400).json({ error: 'Invalid refund amount' });
        // Mark original transaction as REFUNDED
        if (transaction_id) {
            await supabase_1.supabase.from('payment_transactions')
                .update({ status: 'REFUNDED' })
                .eq('id', transaction_id);
        }
        // Post REFUND debit to ledger (reverses the credit)
        await LedgerPostingService_1.LedgerPostingService.postEntry({
            student_id: student_id || null,
            application_id: application_id || null,
            school_id: schoolId,
            transaction_type: 'REFUND',
            debit: Number(amount),
            credit: 0,
            reference_type: 'REFUND',
            reference_id: transaction_id || supabase_1.supabase.rpc('uuid_generate_v4'),
            description: reason || 'Refund processed',
            performed_by: userId
        });
        await supabase_1.supabase.from('finance_audit_logs').insert({
            action: 'REFUND_PROCESSED',
            entity_type: 'payment_transactions',
            entity_id: transaction_id,
            performed_by: userId,
            school_id: schoolId,
            details: { amount, reason }
        });
        res.json({ success: true, message: `Refund of ₹${amount} processed` });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// RECEIPTS — List with filters
// ──────────────────────────────────────
exports.feesRouter.get('/receipts', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const { from, to, receipt_type, payment_mode, limit = 100, offset = 0 } = req.query;
        let query = supabase_1.supabase
            .from('fee_receipts')
            .select(`
                    *,
                    transaction:payment_transaction_id(
                        amount, payment_mode, transaction_reference, created_at, student_id, application_id,
                        cashier:users!cashier_id(email),
                        student:student_id(full_name, student_code),
                        application:application_id(
                            id,
                            lead:lead_id(
                                enquiry:enquiry_id(student_name, grade_applied_for)
                            )
                        )
                    )
                `)
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);
        if (receipt_type)
            query = query.eq('receipt_type', receipt_type);
        if (from)
            query = query.gte('created_at', `${from}T00:00:00.000Z`);
        if (to)
            query = query.lte('created_at', `${to}T23:59:59.999Z`);
        const { data, error, count } = await query;
        if (error)
            throw error;
        // Filter by payment_mode post-fetch (nested field)
        const filtered = payment_mode
            ? (data || []).filter((r) => r.transaction?.payment_mode === payment_mode)
            : data || [];
        // Map data to match the expected frontend contract
        const mapped = (filtered || []).map((r) => {
            if (r.transaction?.application) {
                const enquiry = r.transaction.application.lead?.enquiry;
                r.transaction.application = {
                    id: r.transaction.application.id,
                    applicant_name: enquiry?.student_name || 'Applicant',
                    class_applied: enquiry?.grade_applied_for || ''
                };
            }
            return r;
        });
        res.json({ data: mapped, total: count || mapped.length });
    }
    catch (error) {
        console.error("[DEBUG GET /receipts error]:", error);
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// DASHBOARD — KPIs
// ──────────────────────────────────────
exports.feesRouter.get('/dashboard/kpis', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const schoolId = req.context.user.school_id;
        const kpis = await ReportingService_1.ReportingService.dashboardKpis({ school_id: schoolId });
        res.json(kpis);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// DASHBOARD — Collection Trend (30 days)
// ──────────────────────────────────────
exports.feesRouter.get('/dashboard/collection-trend', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const schoolId = req.context.user.school_id;
        const trend = await ReportingService_1.ReportingService.collectionTrend({ school_id: schoolId });
        res.json(trend);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// DASHBOARD — Payment Mode Distribution
// ──────────────────────────────────────
exports.feesRouter.get('/dashboard/payment-modes', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const schoolId = req.context.user.school_id;
        const today = new Date();
        const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        const result = await ReportingService_1.ReportingService.paymentModeReport({
            school_id: schoolId,
            from: monthStart,
            to: today.toISOString().split('T')[0]
        });
        res.json(result.data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// DASHBOARD — Outstanding by Class
// ──────────────────────────────────────
exports.feesRouter.get('/dashboard/outstanding-by-class', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const schoolId = req.context.user.school_id;
        const result = await ReportingService_1.ReportingService.classSummaryReport({ school_id: schoolId });
        res.json(result.data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// 11. FINANCE REPORTS & FINANCIAL INTELLIGENCE (Phase 12)
// ──────────────────────────────────────
const FinanceReportsService_1 = require("./services/FinanceReportsService");
// GET /reports/summary: High-level financial executive summary KPIs
exports.feesRouter.get('/reports/summary', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { startDate, endDate, academicYearId, gradeId } = req.query;
        const summary = await FinanceReportsService_1.FinanceReportsService.getSummary(tenantOrgId, {
            startDate: startDate,
            endDate: endDate,
            academicYearId: academicYearId,
            gradeId: gradeId
        });
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('[GET /fees/reports/summary] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'REPORTS_SUMMARY_ERROR',
            message: error.message || 'Failed to fetch financial reports executive summary'
        });
    }
});
// GET /reports/collections: Granular collections report with trends & classification
exports.feesRouter.get('/reports/collections', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { startDate, endDate, from, to, paymentMethod, status, search, limit, offset, page } = req.query;
        const resolvedStart = startDate || from;
        const resolvedEnd = endDate || to;
        const parsedLimit = limit ? Number(limit) : 20;
        const parsedOffset = offset ? Number(offset) : (page ? (Number(page) - 1) * parsedLimit : 0);
        const result = await FinanceReportsService_1.FinanceReportsService.getCollections(tenantOrgId, {
            startDate: resolvedStart,
            endDate: resolvedEnd,
            paymentMethod: paymentMethod,
            status: status,
            search: search,
            limit: parsedLimit,
            offset: parsedOffset
        });
        // Backwards-compatible fields included alongside canonical envelope
        res.json({
            success: true,
            data: result.data,
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            trends: result.trends,
            from: resolvedStart,
            to: resolvedEnd
        });
    }
    catch (error) {
        console.error('[GET /fees/reports/collections] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'REPORTS_COLLECTIONS_ERROR',
            message: error.message || 'Failed to fetch collections report'
        });
    }
});
// GET /reports/receivables: Outstanding dues, overdue metrics, and student dues register
exports.feesRouter.get('/reports/receivables', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId, search, status, limit, offset, page } = req.query;
        const parsedLimit = limit ? Number(limit) : 20;
        const parsedOffset = offset ? Number(offset) : (page ? (Number(page) - 1) * parsedLimit : 0);
        const result = await FinanceReportsService_1.FinanceReportsService.getAgeing(tenantOrgId, {
            academicYearId: academicYearId,
            search: search,
            status: status,
            limit: parsedLimit,
            offset: parsedOffset
        });
        res.json({
            success: true,
            data: result.detail.data,
            total: result.detail.total,
            summary: {
                total_outstanding: result.total_outstanding,
                total_overdue: result.total_overdue
            }
        });
    }
    catch (error) {
        console.error('[GET /fees/reports/receivables] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'REPORTS_RECEIVABLES_ERROR',
            message: error.message || 'Failed to fetch receivables report'
        });
    }
});
// GET /reports/outstanding: Backward-compatible alias for receivables
exports.feesRouter.get('/reports/outstanding', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const result = await FinanceReportsService_1.FinanceReportsService.getAgeing(tenantOrgId, { limit: 100 });
        res.json({
            success: true,
            data: result.detail.data,
            total: result.total_outstanding
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /reports/ageing: Ageing analysis by buckets (CURRENT, 1-7, 8-30, 31-60, 61-90, 90+)
exports.feesRouter.get('/reports/ageing', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId, ageingBucket, search, limit, offset, page } = req.query;
        const parsedLimit = limit ? Number(limit) : 20;
        const parsedOffset = offset ? Number(offset) : (page ? (Number(page) - 1) * parsedLimit : 0);
        const result = await FinanceReportsService_1.FinanceReportsService.getAgeing(tenantOrgId, {
            academicYearId: academicYearId,
            ageingBucket: ageingBucket,
            search: search,
            limit: parsedLimit,
            offset: parsedOffset
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('[GET /fees/reports/ageing] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'REPORTS_AGEING_ERROR',
            message: error.message || 'Failed to fetch ageing analysis report'
        });
    }
});
// GET /reports/aging: Backward-compatible alias
exports.feesRouter.get('/reports/aging', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const result = await FinanceReportsService_1.FinanceReportsService.getAgeing(tenantOrgId, { limit: 100 });
        res.json({
            success: true,
            data: result.detail.data,
            buckets: result.buckets
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /reports/assessments: Component-level fee assessment and billing performance
exports.feesRouter.get('/reports/assessments', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId, startDate, endDate } = req.query;
        const result = await FinanceReportsService_1.FinanceReportsService.getAssessments(tenantOrgId, {
            academicYearId: academicYearId,
            startDate: startDate,
            endDate: endDate
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('[GET /fees/reports/assessments] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'REPORTS_ASSESSMENTS_ERROR',
            message: error.message || 'Failed to fetch fee assessments report'
        });
    }
});
// GET /reports/concessions: Scholarships and concessions distribution
exports.feesRouter.get('/reports/concessions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId, startDate, endDate } = req.query;
        const result = await FinanceReportsService_1.FinanceReportsService.getConcessions(tenantOrgId, {
            academicYearId: academicYearId,
            startDate: startDate,
            endDate: endDate
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('[GET /fees/reports/concessions] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'REPORTS_CONCESSIONS_ERROR',
            message: error.message || 'Failed to fetch concessions report'
        });
    }
});
// GET /reports/settlements: Gateway collections and bank settlement status
exports.feesRouter.get('/reports/settlements', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { limit, offset, page } = req.query;
        const parsedLimit = limit ? Number(limit) : 20;
        const parsedOffset = offset ? Number(offset) : (page ? (Number(page) - 1) * parsedLimit : 0);
        const result = await FinanceReportsService_1.FinanceReportsService.getSettlements(tenantOrgId, {
            limit: parsedLimit,
            offset: parsedOffset
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('[GET /fees/reports/settlements] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'REPORTS_SETTLEMENTS_ERROR',
            message: error.message || 'Failed to fetch settlements report'
        });
    }
});
// GET /reports/reconciliation: Reusable Phase 10 reconciliation intelligence
exports.feesRouter.get('/reports/reconciliation', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { page, limit } = req.query;
        const result = await FinanceReportsService_1.FinanceReportsService.getReconciliation(tenantOrgId, {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('[GET /fees/reports/reconciliation] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'REPORTS_RECONCILIATION_ERROR',
            message: error.message || 'Failed to fetch reconciliation report'
        });
    }
});
// GET /reports/accounting-readiness: Reusable Phase 11 operational accounting readiness
exports.feesRouter.get('/reports/accounting-readiness', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { startDate, endDate } = req.query;
        const result = await FinanceReportsService_1.FinanceReportsService.getAccountingReadiness(tenantOrgId, {
            startDate: startDate,
            endDate: endDate
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('[GET /fees/reports/accounting-readiness] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'REPORTS_ACCOUNTING_READINESS_ERROR',
            message: error.message || 'Failed to fetch accounting readiness report'
        });
    }
});
// GET /reports/export: Sanitized CSV export center with formula injection protection
exports.feesRouter.get('/reports/export', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { reportType, startDate, endDate, paymentMethod, status, search, ageingBucket, academicYearId } = req.query;
        const csvData = await FinanceReportsService_1.FinanceReportsService.exportReportCSV(tenantOrgId, reportType, {
            startDate: startDate,
            endDate: endDate,
            paymentMethod: paymentMethod,
            status: status,
            search: search,
            ageingBucket: ageingBucket,
            academicYearId: academicYearId
        });
        const timestamp = new Date().toISOString().slice(0, 10);
        const safeType = (reportType || 'financial_report').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="finance_${safeType}_${timestamp}.csv"`);
        res.status(200).send(csvData);
    }
    catch (error) {
        console.error('[GET /fees/reports/export] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'CSV_EXPORT_ERROR',
            message: error.message || 'Failed to export financial report CSV'
        });
    }
});
// ──────────────────────────────────────
// 12. FINANCE BUDGETING, FORECASTING & PLANNING (Phase 13)
// ──────────────────────────────────────
const FinancePlanningService_1 = require("./services/FinancePlanningService");
// GET /planning/capabilities: Capabilities and schema limitation audit
exports.feesRouter.get('/planning/capabilities', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const capabilities = await FinancePlanningService_1.FinancePlanningService.getCapabilities(tenantOrgId);
        res.json({
            success: true,
            data: capabilities
        });
    }
    catch (error) {
        console.error('[GET /fees/planning/capabilities] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'PLANNING_CAPABILITIES_ERROR',
            message: error.message || 'Failed to fetch planning capabilities'
        });
    }
});
// GET /planning/overview: Executive Planning Overview & Baseline Projections
exports.feesRouter.get('/planning/overview', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { horizonMonths, startDate, realizationRate } = req.query;
        const overview = await FinancePlanningService_1.FinancePlanningService.getOverview(tenantOrgId, {
            horizonMonths: horizonMonths ? Number(horizonMonths) : undefined,
            startDate: startDate,
            realizationRate: realizationRate ? Number(realizationRate) : undefined
        });
        res.json({
            success: true,
            data: overview
        });
    }
    catch (error) {
        console.error('[GET /fees/planning/overview] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'PLANNING_OVERVIEW_ERROR',
            message: error.message || 'Failed to fetch planning overview'
        });
    }
});
// GET /planning/collections-forecast: Monthly collections projection from scheduled dues
exports.feesRouter.get('/planning/collections-forecast', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { horizonMonths, startDate, realizationRate, monthlyAdjustment } = req.query;
        const forecast = await FinancePlanningService_1.FinancePlanningService.getCollectionsForecast(tenantOrgId, {
            horizonMonths: horizonMonths ? Number(horizonMonths) : undefined,
            startDate: startDate,
            realizationRate: realizationRate ? Number(realizationRate) : undefined,
            monthlyAdjustment: monthlyAdjustment ? Number(monthlyAdjustment) : undefined
        });
        res.json({
            success: true,
            data: forecast
        });
    }
    catch (error) {
        console.error('[GET /fees/planning/collections-forecast] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'COLLECTIONS_FORECAST_ERROR',
            message: error.message || 'Failed to generate collections forecast'
        });
    }
});
// GET /planning/receivables-forecast: Receivables recovery and remaining balance projection
exports.feesRouter.get('/planning/receivables-forecast', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { horizonMonths, startDate, realizationRate } = req.query;
        const forecast = await FinancePlanningService_1.FinancePlanningService.getReceivablesForecast(tenantOrgId, {
            horizonMonths: horizonMonths ? Number(horizonMonths) : undefined,
            startDate: startDate,
            realizationRate: realizationRate ? Number(realizationRate) : undefined
        });
        res.json({
            success: true,
            data: forecast
        });
    }
    catch (error) {
        console.error('[GET /fees/planning/receivables-forecast] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'RECEIVABLES_FORECAST_ERROR',
            message: error.message || 'Failed to generate receivables forecast'
        });
    }
});
// POST /planning/scenario: On-demand simulation of Conservative, Expected, Optimistic scenarios
exports.feesRouter.post('/planning/scenario', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { horizonMonths, startDate, conservativeRate, expectedRate, optimisticRate, monthlyAdjustment } = req.body || {};
        const scenarios = await FinancePlanningService_1.FinancePlanningService.calculateScenarios(tenantOrgId, {
            horizonMonths: horizonMonths !== undefined ? Number(horizonMonths) : undefined,
            startDate: startDate,
            conservativeRate: conservativeRate !== undefined ? Number(conservativeRate) : undefined,
            expectedRate: expectedRate !== undefined ? Number(expectedRate) : undefined,
            optimisticRate: optimisticRate !== undefined ? Number(optimisticRate) : undefined,
            monthlyAdjustment: monthlyAdjustment !== undefined ? Number(monthlyAdjustment) : undefined
        });
        res.json({
            success: true,
            data: scenarios
        });
    }
    catch (error) {
        console.error('[POST /fees/planning/scenario] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'SCENARIO_CALCULATION_ERROR',
            message: error.message || 'Failed to calculate planning scenarios'
        });
    }
});
// GET /planning/academic-year-outlook: Outlook and realization by academic year
exports.feesRouter.get('/planning/academic-year-outlook', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { realizationRate } = req.query;
        const outlook = await FinancePlanningService_1.FinancePlanningService.getAcademicYearOutlook(tenantOrgId, {
            realizationRate: realizationRate ? Number(realizationRate) : undefined
        });
        res.json({
            success: true,
            data: outlook
        });
    }
    catch (error) {
        console.error('[GET /fees/planning/academic-year-outlook] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'ACADEMIC_YEAR_OUTLOOK_ERROR',
            message: error.message || 'Failed to fetch academic year outlook'
        });
    }
});
// POST /planning/concession-sensitivity: Analytical sensitivity simulation of hypothetical concession shifts
exports.feesRouter.post('/planning/concession-sensitivity', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { hypotheticalDeltaPct, realizationRatePct } = req.body || {};
        const sensitivity = await FinancePlanningService_1.FinancePlanningService.calculateConcessionSensitivity(tenantOrgId, {
            hypotheticalDeltaPct: hypotheticalDeltaPct !== undefined ? Number(hypotheticalDeltaPct) : undefined,
            realizationRatePct: realizationRatePct !== undefined ? Number(realizationRatePct) : undefined
        });
        res.json({
            success: true,
            data: sensitivity
        });
    }
    catch (error) {
        console.error('[POST /fees/planning/concession-sensitivity] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'CONCESSION_SENSITIVITY_ERROR',
            message: error.message || 'Failed to calculate concession sensitivity'
        });
    }
});
// GET /planning/data-quality: Density, data checks, and schema limitation audit
exports.feesRouter.get('/planning/data-quality', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const dataQuality = await FinancePlanningService_1.FinancePlanningService.getDataQuality(tenantOrgId);
        res.json({
            success: true,
            data: dataQuality
        });
    }
    catch (error) {
        console.error('[GET /fees/planning/data-quality] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'PLANNING_DATA_QUALITY_ERROR',
            message: error.message || 'Failed to fetch planning data quality metrics'
        });
    }
});
// GET /planning/export: Formula-sanitized CSV export for planning and scenarios
exports.feesRouter.get('/planning/export', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { exportType, horizonMonths, startDate, realizationRate, conservativeRate, expectedRate, optimisticRate } = req.query;
        const validExportType = exportType === 'scenario_planner'
            ? 'scenario_planner'
            : exportType === 'academic_year_outlook'
                ? 'academic_year_outlook'
                : 'collections_forecast';
        const csvData = await FinancePlanningService_1.FinancePlanningService.exportPlanningCSV(tenantOrgId, validExportType, {
            horizonMonths: horizonMonths ? Number(horizonMonths) : undefined,
            startDate: startDate,
            realizationRate: realizationRate ? Number(realizationRate) : undefined,
            conservativeRate: conservativeRate ? Number(conservativeRate) : undefined,
            expectedRate: expectedRate ? Number(expectedRate) : undefined,
            optimisticRate: optimisticRate ? Number(optimisticRate) : undefined
        });
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="finance_planning_${validExportType}_${timestamp}.csv"`);
        res.status(200).send(csvData);
    }
    catch (error) {
        console.error('[GET /fees/planning/export] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'PLANNING_EXPORT_ERROR',
            message: error.message || 'Failed to export planning CSV'
        });
    }
});
// ──────────────────────────────────────
// 13. FINANCE AUDIT, GOVERNANCE & COMPLIANCE (Phase 14)
// ──────────────────────────────────────
const FinanceAuditService_1 = require("./services/FinanceAuditService");
// GET /audit/capabilities: Audit capabilities and schema limitation audit
exports.feesRouter.get('/audit/capabilities', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const capabilities = await FinanceAuditService_1.FinanceAuditService.getCapabilities(tenantOrgId);
        res.json({
            success: true,
            data: capabilities
        });
    }
    catch (error) {
        console.error('[GET /fees/audit/capabilities] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'AUDIT_CAPABILITIES_ERROR',
            message: error.message || 'Failed to fetch audit capabilities'
        });
    }
});
// GET /audit/summary: Executive Audit KPI Overview
exports.feesRouter.get('/audit/summary', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const summary = await FinanceAuditService_1.FinanceAuditService.getSummary(tenantOrgId);
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('[GET /fees/audit/summary] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'AUDIT_SUMMARY_ERROR',
            message: error.message || 'Failed to fetch audit summary'
        });
    }
});
// GET /audit/payments: Payment Transaction Audit Register
exports.feesRouter.get('/audit/payments', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { page, limit, startDate, endDate, status, search } = req.query;
        const payments = await FinanceAuditService_1.FinanceAuditService.getPayments(tenantOrgId, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            startDate: startDate,
            endDate: endDate,
            status: status,
            search: search
        });
        res.json({
            success: true,
            data: payments
        });
    }
    catch (error) {
        console.error('[GET /fees/audit/payments] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'PAYMENT_AUDIT_ERROR',
            message: error.message || 'Failed to fetch payment audit register'
        });
    }
});
// GET /audit/settlements: Gateway Settlement & Deduction Audit
exports.feesRouter.get('/audit/settlements', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { page, limit, status, search } = req.query;
        const settlements = await FinanceAuditService_1.FinanceAuditService.getSettlements(tenantOrgId, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            status: status,
            search: search
        });
        res.json({
            success: true,
            data: settlements
        });
    }
    catch (error) {
        console.error('[GET /fees/audit/settlements] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'SETTLEMENT_AUDIT_ERROR',
            message: error.message || 'Failed to fetch settlement audit register'
        });
    }
});
// GET /audit/concessions: Scholarship & Concession Governance Audit
exports.feesRouter.get('/audit/concessions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { page, limit, status, search } = req.query;
        const concessions = await FinanceAuditService_1.FinanceAuditService.getConcessions(tenantOrgId, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            status: status,
            search: search
        });
        res.json({
            success: true,
            data: concessions
        });
    }
    catch (error) {
        console.error('[GET /fees/audit/concessions] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'CONCESSION_AUDIT_ERROR',
            message: error.message || 'Failed to fetch concession audit register'
        });
    }
});
// GET /audit/webhooks: Webhook Lifecycle & Dead-Letter Audit
exports.feesRouter.get('/audit/webhooks', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { page, limit, status, search } = req.query;
        const webhooks = await FinanceAuditService_1.FinanceAuditService.getWebhooks(tenantOrgId, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            status: status,
            search: search
        });
        res.json({
            success: true,
            data: webhooks
        });
    }
    catch (error) {
        console.error('[GET /fees/audit/webhooks] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'WEBHOOK_AUDIT_ERROR',
            message: error.message || 'Failed to fetch webhook audit register'
        });
    }
});
// GET /audit/accounting-readiness: Accounting Readiness & Control Audit
exports.feesRouter.get('/audit/accounting-readiness', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const readiness = await FinanceAuditService_1.FinanceAuditService.getAccountingReadinessAudit(tenantOrgId);
        res.json({
            success: true,
            data: readiness
        });
    }
    catch (error) {
        console.error('[GET /fees/audit/accounting-readiness] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'ACCOUNTING_READINESS_AUDIT_ERROR',
            message: error.message || 'Failed to fetch accounting readiness audit'
        });
    }
});
// GET /audit/coverage: Control Evaluation Matrix & Limitations
exports.feesRouter.get('/audit/coverage', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const coverage = await FinanceAuditService_1.FinanceAuditService.getCoverage(tenantOrgId);
        res.json({
            success: true,
            data: coverage
        });
    }
    catch (error) {
        console.error('[GET /fees/audit/coverage] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'AUDIT_COVERAGE_ERROR',
            message: error.message || 'Failed to fetch audit control coverage'
        });
    }
});
// GET /audit/export: Formula-sanitized CSV export for audit registers
exports.feesRouter.get('/audit/export', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { exportType, startDate, endDate, status, search } = req.query;
        const validExportType = exportType === 'settlements'
            ? 'settlements'
            : exportType === 'concessions'
                ? 'concessions'
                : exportType === 'webhooks'
                    ? 'webhooks'
                    : exportType === 'controls'
                        ? 'controls'
                        : 'payments';
        const csvData = await FinanceAuditService_1.FinanceAuditService.exportAuditCSV(tenantOrgId, validExportType, {
            startDate: startDate,
            endDate: endDate,
            status: status,
            search: search
        });
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="finance_audit_${validExportType}_${timestamp}.csv"`);
        res.status(200).send(csvData);
    }
    catch (error) {
        console.error('[GET /fees/audit/export] Error:', error);
        res.status(500).json({
            success: false,
            error: error.code || 'AUDIT_EXPORT_ERROR',
            message: error.message || 'Failed to export audit CSV'
        });
    }
});
// ──────────────────────────────────────
// 14. FINANCE OPERATIONS & EXECUTIVE INSIGHTS (Phase 15)
// ──────────────────────────────────────
const FinanceOperationsService_1 = require("./services/FinanceOperationsService");
// GET /operations/capabilities: Capabilities & compliance disclosures
exports.feesRouter.get('/operations/capabilities', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const capabilities = await FinanceOperationsService_1.FinanceOperationsService.getCapabilities(tenantOrgId);
        res.json({
            success: true,
            data: capabilities
        });
    }
    catch (error) {
        console.error('[GET /fees/operations/capabilities] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'OPERATIONS_CAPABILITIES_ERROR',
            message: error.message || 'Failed to fetch operations capabilities'
        });
    }
});
// GET /operations/overview: Executive Finance Overview (Module A)
exports.feesRouter.get('/operations/overview', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { startDate, endDate, academicYearId } = req.query;
        const overview = await FinanceOperationsService_1.FinanceOperationsService.getOverview(tenantOrgId, {
            startDate: startDate,
            endDate: endDate,
            academicYearId: academicYearId
        });
        res.json({
            success: true,
            data: overview
        });
    }
    catch (error) {
        console.error('[GET /fees/operations/overview] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'OPERATIONS_OVERVIEW_ERROR',
            message: error.message || 'Failed to fetch executive overview'
        });
    }
});
// GET /operations/collections: Collections Performance Analysis (Module B)
exports.feesRouter.get('/operations/collections', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { startDate, endDate, academicYearId, paymentMethod } = req.query;
        const collections = await FinanceOperationsService_1.FinanceOperationsService.getCollections(tenantOrgId, {
            startDate: startDate,
            endDate: endDate,
            academicYearId: academicYearId,
            paymentMethod: paymentMethod
        });
        res.json({
            success: true,
            data: collections
        });
    }
    catch (error) {
        console.error('[GET /fees/operations/collections] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'OPERATIONS_COLLECTIONS_ERROR',
            message: error.message || 'Failed to fetch collections performance'
        });
    }
});
// GET /operations/receivables: Receivables and Ageing Insights (Module C)
exports.feesRouter.get('/operations/receivables', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId, gradeId } = req.query;
        const receivables = await FinanceOperationsService_1.FinanceOperationsService.getReceivables(tenantOrgId, {
            academicYearId: academicYearId,
            gradeId: gradeId
        });
        res.json({
            success: true,
            data: receivables
        });
    }
    catch (error) {
        console.error('[GET /fees/operations/receivables] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'OPERATIONS_RECEIVABLES_ERROR',
            message: error.message || 'Failed to fetch receivables and ageing'
        });
    }
});
// GET /operations/exceptions: Exception Action Center (Module D)
exports.feesRouter.get('/operations/exceptions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { category, severity, page, limit } = req.query;
        const exceptions = await FinanceOperationsService_1.FinanceOperationsService.getExceptions(tenantOrgId, {
            category: category,
            severity: severity,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 25
        });
        res.json({
            success: true,
            data: exceptions
        });
    }
    catch (error) {
        console.error('[GET /fees/operations/exceptions] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'OPERATIONS_EXCEPTIONS_ERROR',
            message: error.message || 'Failed to fetch exception queue'
        });
    }
});
// GET /operations/data-quality: Finance Data Quality and Readiness (Module E)
exports.feesRouter.get('/operations/data-quality', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const dataQuality = await FinanceOperationsService_1.FinanceOperationsService.getDataQuality(tenantOrgId);
        res.json({
            success: true,
            data: dataQuality
        });
    }
    catch (error) {
        console.error('[GET /fees/operations/data-quality] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'OPERATIONS_DATA_QUALITY_ERROR',
            message: error.message || 'Failed to fetch data quality report'
        });
    }
});
// GET /operations/export: Executive Export (Module F)
exports.feesRouter.get('/operations/export', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { type, startDate, endDate, academicYearId, paymentMethod, category, severity } = req.query;
        const validExportType = type === 'collections' ? 'collections'
            : type === 'receivables' ? 'receivables'
                : type === 'exceptions' ? 'exceptions'
                    : 'overview';
        const csvData = await FinanceOperationsService_1.FinanceOperationsService.exportCSV(tenantOrgId, validExportType, {
            startDate: startDate,
            endDate: endDate,
            academicYearId: academicYearId,
            paymentMethod: paymentMethod,
            category: category,
            severity: severity
        });
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="finance_operations_${validExportType}_${timestamp}.csv"`);
        res.status(200).send(csvData);
    }
    catch (error) {
        console.error('[GET /fees/operations/export] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'OPERATIONS_EXPORT_ERROR',
            message: error.message || 'Failed to export operations CSV'
        });
    }
});
// Legacy fallback endpoints for existing frontends
exports.feesRouter.get('/reports/cash-closing', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const schoolId = req.context?.user?.school_id || req.tenantOrgId || req.context?.user?.org_id;
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const result = await ReportingService_1.ReportingService.cashClosingReport({ school_id: schoolId, date });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.feesRouter.get('/reports/payment-mode', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const schoolId = req.context?.user?.school_id || req.tenantOrgId || req.context?.user?.org_id;
        const today = new Date().toISOString().split('T')[0];
        const monthStart = `${today.substring(0, 7)}-01`;
        const { from = monthStart, to = today } = req.query;
        const result = await ReportingService_1.ReportingService.paymentModeReport({ school_id: schoolId, from: from, to: to });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.feesRouter.get('/reports/class-summary', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const schoolId = req.context?.user?.school_id || req.tenantOrgId || req.context?.user?.org_id;
        const result = await ReportingService_1.ReportingService.classSummaryReport({ school_id: schoolId });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// FINANCE CONFIGURATION — PHASE 2
// ──────────────────────────────────────
// GET /configuration: Read full finance configuration
exports.feesRouter.get('/configuration', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const configuration = await SettingsService_1.SettingsService.getConfiguration(tenantOrgId);
        res.json({
            success: true,
            data: configuration
        });
    }
    catch (error) {
        console.error('[feesRouter.GET /configuration] Error:', error);
        res.status(500).json({
            success: false,
            error: 'CONFIGURATION_READ_ERROR',
            message: error.message || 'Failed to load finance configuration'
        });
    }
});
// PATCH /configuration: Update allowlisted finance configuration
exports.feesRouter.patch('/configuration', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_SETUP), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const userId = req.context?.user?.id || 'system';
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'EMPTY_PAYLOAD',
                message: 'Update payload must contain at least one editable configuration property.'
            });
        }
        const updatedConfiguration = await SettingsService_1.SettingsService.updateConfiguration(tenantOrgId, userId, req.body);
        res.json({
            success: true,
            message: 'Finance configuration updated successfully.',
            data: updatedConfiguration
        });
    }
    catch (error) {
        console.error('[feesRouter.PATCH /configuration] Error:', error);
        const isValidationError = error.message?.includes('immutable') ||
            error.message?.includes('Phone') ||
            error.message?.includes('email') ||
            error.message?.includes('window');
        res.status(isValidationError ? 422 : 500).json({
            success: false,
            error: isValidationError ? 'VALIDATION_ERROR' : 'CONFIGURATION_UPDATE_ERROR',
            message: error.message || 'Failed to update finance configuration'
        });
    }
});
// GET /configuration/razorpay/status: Check sanitized gateway configuration status
exports.feesRouter.get('/configuration/razorpay/status', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), (req, res) => {
    try {
        const gatewayStatus = SettingsService_1.SettingsService.getRazorpayStatus();
        res.json({
            success: true,
            data: gatewayStatus
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'GATEWAY_STATUS_ERROR',
            message: error.message || 'Failed to inspect payment gateway status'
        });
    }
});
// POST /configuration/razorpay/test: Safe non-transactional credential probe
exports.feesRouter.post('/configuration/razorpay/test', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_SETUP), async (req, res) => {
    try {
        const result = await SettingsService_1.SettingsService.testRazorpayConnection();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            status: 'FAILED',
            message: error.message || 'Gateway connectivity test failed',
            timestamp: new Date().toISOString()
        });
    }
});
// GET /configuration/audit: View recent configuration audit events
exports.feesRouter.get('/configuration/audit', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({ error: 'Tenant context required' });
        }
        let auditEntries = [];
        try {
            const { data } = await supabase_1.supabase
                .from('finance_audit_logs')
                .select('*')
                .eq('entity_id', tenantOrgId)
                .order('created_at', { ascending: false })
                .limit(20);
            if (data)
                auditEntries = data;
        }
        catch {
            // Table might not exist; fallback to empty audit list
        }
        res.json({
            success: true,
            data: auditEntries
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ──────────────────────────────────────
// SETTINGS — GET and PUT (LEGACY PHASE 1 COMPATIBILITY)
// ──────────────────────────────────────
exports.feesRouter.get('/settings', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const schoolId = req.tenantOrgId || req.context?.user?.school_id || req.context?.user?.org_id;
        const settings = await SettingsService_1.SettingsService.getSettings(schoolId);
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.feesRouter.put('/settings', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_SETUP), async (req, res) => {
    try {
        const schoolId = req.tenantOrgId || req.context?.user?.school_id || req.context?.user?.org_id;
        const userId = req.context.user.id;
        const settings = await SettingsService_1.SettingsService.upsertSettings(schoolId, { ...req.body, updated_by: userId });
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ======================================
// 6. SCHOLARSHIPS & CONCESSIONS (Phase 7)
// ======================================
const ScholarshipConcessionService_1 = require("./services/ScholarshipConcessionService");
// GET /scholarships/metrics: Live dashboard metrics
exports.feesRouter.get('/scholarships/metrics', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId } = req.query;
        const metrics = await ScholarshipConcessionService_1.ScholarshipConcessionService.getMetrics(tenantOrgId, academicYearId);
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        console.error('[GET /fees/scholarships/metrics] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'SCHOLARSHIP_METRICS_ERROR',
            message: error.message || 'Failed to fetch scholarship metrics'
        });
    }
});
// GET /scholarships/programs: Available institutional scholarship programs
exports.feesRouter.get('/scholarships/programs', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const programs = await ScholarshipConcessionService_1.ScholarshipConcessionService.getPrograms(tenantOrgId);
        res.json({
            success: true,
            data: programs
        });
    }
    catch (error) {
        console.error('[GET /fees/scholarships/programs] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'PROGRAMS_FETCH_ERROR',
            message: error.message || 'Failed to fetch scholarship programs'
        });
    }
});
// GET /scholarships/students: Search eligible students within tenant
exports.feesRouter.get('/scholarships/students', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { query, academicYearId, page, limit } = req.query;
        const students = await ScholarshipConcessionService_1.ScholarshipConcessionService.searchEligibleStudents(tenantOrgId, query, academicYearId, page ? Number(page) : 1, limit ? Number(limit) : 20);
        res.json({
            success: true,
            data: students
        });
    }
    catch (error) {
        console.error('[GET /fees/scholarships/students] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'STUDENT_SEARCH_ERROR',
            message: error.message || 'Failed to search eligible students'
        });
    }
});
// GET /scholarships/applications: Filterable, paginated register
exports.feesRouter.get('/scholarships/applications', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { status, scholarshipType, academicYearId, studentId, search, page, limit } = req.query;
        const result = await ScholarshipConcessionService_1.ScholarshipConcessionService.listApplications(tenantOrgId, {
            status: status,
            scholarshipType: scholarshipType,
            academicYearId: academicYearId,
            studentId: studentId,
            search: search,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        res.json({
            success: true,
            data: result.concessions,
            pagination: result.pagination
        });
    }
    catch (error) {
        console.error('[GET /fees/scholarships/applications] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'APPLICATIONS_FETCH_ERROR',
            message: error.message || 'Failed to fetch scholarship applications'
        });
    }
});
// POST /scholarships/applications: Recommend / apply for a student
exports.feesRouter.post('/scholarships/applications', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_WAIVER_APPROVE), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const userId = req.context?.user?.id || req.context?.user?.user_id || '00000000-0000-0000-0000-000000000000';
        const concession = await ScholarshipConcessionService_1.ScholarshipConcessionService.recommendConcession(tenantOrgId, userId, req.body);
        res.status(201).json({
            success: true,
            message: 'Scholarship recommendation submitted successfully',
            data: concession
        });
    }
    catch (error) {
        console.error('[POST /fees/scholarships/applications] Error:', error);
        res.status(error.statusCode || 400).json({
            success: false,
            error: error.code || 'CONCESSION_RECOMMEND_ERROR',
            message: error.message || 'Failed to submit scholarship recommendation'
        });
    }
});
// GET /scholarships/applications/:id: Detail + full approval audit history
exports.feesRouter.get('/scholarships/applications/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { id } = req.params;
        const result = await ScholarshipConcessionService_1.ScholarshipConcessionService.getApplicationById(tenantOrgId, id);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error(`[GET /fees/scholarships/applications/${req.params.id}] Error:`, error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'APPLICATION_FETCH_ERROR',
            message: error.message || 'Failed to fetch scholarship application details'
        });
    }
});
// POST /scholarships/applications/:id/decision: Approve or reject
exports.feesRouter.post('/scholarships/applications/:id/decision', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_WAIVER_APPROVE), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const userId = req.context?.user?.id || req.context?.user?.user_id || '00000000-0000-0000-0000-000000000000';
        const { id } = req.params;
        const result = await ScholarshipConcessionService_1.ScholarshipConcessionService.reviewConcession(tenantOrgId, userId, id, req.body);
        res.json({
            success: true,
            message: `Scholarship application ${req.body.action === 'approved' ? 'approved' : 'rejected'} successfully`,
            data: result
        });
    }
    catch (error) {
        console.error(`[POST /fees/scholarships/applications/${req.params.id}/decision] Error:`, error);
        res.status(error.statusCode || 400).json({
            success: false,
            error: error.code || 'REVIEW_DECISION_ERROR',
            message: error.message || 'Failed to process scholarship decision'
        });
    }
});
// POST /scholarships/applications/:id/apply: Apply approved concession to ledger dues
exports.feesRouter.post('/scholarships/applications/:id/apply', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_WAIVER_APPROVE), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const userId = req.context?.user?.id || req.context?.user?.user_id || '00000000-0000-0000-0000-000000000000';
        const { id } = req.params;
        const result = await ScholarshipConcessionService_1.ScholarshipConcessionService.applyConcession(tenantOrgId, userId, id);
        res.json({
            success: true,
            message: 'Concession applied to student fee obligations successfully',
            data: result
        });
    }
    catch (error) {
        console.error(`[POST /fees/scholarships/applications/${req.params.id}/apply] Error:`, error);
        res.status(error.statusCode || 400).json({
            success: false,
            error: error.code || 'APPLY_CONCESSION_ERROR',
            message: error.message || 'Failed to apply concession to student dues'
        });
    }
});
// GET /scholarships/student/:studentId: Student specific awards
exports.feesRouter.get('/scholarships/student/:studentId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { studentId } = req.params;
        const result = await ScholarshipConcessionService_1.ScholarshipConcessionService.getStudentConcessions(tenantOrgId, studentId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error(`[GET /fees/scholarships/student/${req.params.studentId}] Error:`, error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'STUDENT_AWARDS_ERROR',
            message: error.message || 'Failed to fetch student scholarship awards'
        });
    }
});
// GET /scholarships/reports: Aggregated reports
exports.feesRouter.get('/scholarships/reports', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId } = req.query;
        const reports = await ScholarshipConcessionService_1.ScholarshipConcessionService.getReports(tenantOrgId, academicYearId);
        res.json({
            success: true,
            data: reports
        });
    }
    catch (error) {
        console.error('[GET /fees/scholarships/reports] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'REPORTS_FETCH_ERROR',
            message: error.message || 'Failed to fetch scholarship reports'
        });
    }
});
// ======================================
// 10. RECEIVABLES & COLLECTIONS (Phase 8)
// ======================================
const ReceivablesService_1 = require("./services/ReceivablesService");
// GET /receivables/summary: Receivables & Collections Overview KPIs
exports.feesRouter.get('/receivables/summary', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId } = req.query;
        const summary = await ReceivablesService_1.ReceivablesService.getSummary(tenantOrgId, academicYearId);
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('[GET /fees/receivables/summary] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'RECEIVABLES_SUMMARY_ERROR',
            message: error.message || 'Failed to fetch receivables summary'
        });
    }
});
// GET /receivables/register: Searchable, filterable, paginated student fee obligations
exports.feesRouter.get('/receivables/register', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId, gradeId, sectionId, feeComponentId, installmentTermId, status, ageingBucket, dueDateFrom, dueDateTo, minOutstanding, maxOutstanding, search, page, limit, sortBy, sortOrder } = req.query;
        const register = await ReceivablesService_1.ReceivablesService.getRegister(tenantOrgId, {
            academicYearId: academicYearId,
            gradeId: gradeId,
            sectionId: sectionId,
            feeComponentId: feeComponentId,
            installmentTermId: installmentTermId,
            status: status,
            ageingBucket: ageingBucket,
            dueDateFrom: dueDateFrom,
            dueDateTo: dueDateTo,
            minOutstanding: minOutstanding ? Number(minOutstanding) : undefined,
            maxOutstanding: maxOutstanding ? Number(maxOutstanding) : undefined,
            search: search,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sortBy: sortBy,
            sortOrder: sortOrder
        });
        res.json({
            success: true,
            data: register
        });
    }
    catch (error) {
        console.error('[GET /fees/receivables/register] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'RECEIVABLES_REGISTER_ERROR',
            message: error.message || 'Failed to fetch receivables register'
        });
    }
});
// GET /receivables/ageing: Overdue ageing analysis by buckets
exports.feesRouter.get('/receivables/ageing', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { academicYearId } = req.query;
        const ageing = await ReceivablesService_1.ReceivablesService.getAgeing(tenantOrgId, academicYearId);
        res.json({
            success: true,
            data: ageing
        });
    }
    catch (error) {
        console.error('[GET /fees/receivables/ageing] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'RECEIVABLES_AGEING_ERROR',
            message: error.message || 'Failed to fetch ageing analysis'
        });
    }
});
// GET /receivables/collections: Confirmed collections performance and trends
exports.feesRouter.get('/receivables/collections', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { period, startDate, endDate, academicYearId, gradeId } = req.query;
        const collections = await ReceivablesService_1.ReceivablesService.getCollections(tenantOrgId, {
            period: period,
            startDate: startDate,
            endDate: endDate,
            academicYearId: academicYearId,
            gradeId: gradeId
        });
        res.json({
            success: true,
            data: collections
        });
    }
    catch (error) {
        console.error('[GET /fees/receivables/collections] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'RECEIVABLES_COLLECTIONS_ERROR',
            message: error.message || 'Failed to fetch collections performance'
        });
    }
});
// GET /receivables/students/:studentId: Detailed receivables for single student
exports.feesRouter.get('/receivables/students/:studentId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { studentId } = req.params;
        const detail = await ReceivablesService_1.ReceivablesService.getStudentDetail(tenantOrgId, studentId);
        res.json({
            success: true,
            data: detail
        });
    }
    catch (error) {
        console.error(`[GET /fees/receivables/students/${req.params.studentId}] Error:`, error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'STUDENT_RECEIVABLES_ERROR',
            message: error.message || 'Failed to fetch student receivables detail'
        });
    }
});
// GET /receivables/follow-ups: Prioritized collections follow-up work queue
exports.feesRouter.get('/receivables/follow-ups', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { grouping, academicYearId, gradeId, search, page, limit, sortBy, sortOrder } = req.query;
        const queue = await ReceivablesService_1.ReceivablesService.getFollowUpQueue(tenantOrgId, {
            grouping: grouping,
            academicYearId: academicYearId,
            gradeId: gradeId,
            search: search,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sortBy: sortBy,
            sortOrder: sortOrder
        });
        res.json({
            success: true,
            data: queue
        });
    }
    catch (error) {
        console.error('[GET /fees/receivables/follow-ups] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'FOLLOW_UP_QUEUE_ERROR',
            message: error.message || 'Failed to fetch follow-up queue'
        });
    }
});
// POST /receivables/follow-ups: Record follow-up mutation (Schema freeze disclosure)
exports.feesRouter.post('/receivables/follow-ups', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.PAYMENT_RECORD), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const userId = req.context?.user?.id || req.context?.user?.user_id || '00000000-0000-0000-0000-000000000000';
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        await ReceivablesService_1.ReceivablesService.recordFollowUp(tenantOrgId, userId, req.body);
    }
    catch (error) {
        const status = error.statusCode || 501;
        res.status(status).json({
            success: false,
            error: error.code || 'FEATURE_BLOCKED_SCHEMA_FREEZE',
            message: error.message || 'Follow-up recording is blocked by database schema freeze'
        });
    }
});
// PATCH /receivables/follow-ups/:id: Update follow-up status (Schema freeze disclosure)
exports.feesRouter.patch('/receivables/follow-ups/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.PAYMENT_RECORD), async (req, res) => {
    res.status(501).json({
        success: false,
        error: 'FEATURE_BLOCKED_SCHEMA_FREEZE',
        message: 'Follow-up updating is blocked by database schema freeze (table `fee_collections_follow_ups` is unmapped).'
    });
});
// GET /receivables/reports: Exportable structured reports
exports.feesRouter.get('/receivables/reports', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { reportType, academicYearId } = req.query;
        const type = reportType || 'outstanding_by_grade';
        const report = await ReceivablesService_1.ReceivablesService.getReports(tenantOrgId, type, { academicYearId });
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('[GET /fees/receivables/reports] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'RECEIVABLES_REPORTS_ERROR',
            message: error.message || 'Failed to fetch receivables reports'
        });
    }
});
// ======================================
// 11. FINANCE NOTIFICATIONS & COMMUNICATION (Phase 9)
// ======================================
const FinanceNotificationService_1 = require("./services/FinanceNotificationService");
// GET /notifications/summary: Notification KPI summary
exports.feesRouter.get('/notifications/summary', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const summary = await FinanceNotificationService_1.FinanceNotificationService.getSummary(tenantOrgId);
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('[GET /fees/notifications/summary] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'NOTIFICATION_SUMMARY_ERROR',
            message: error.message || 'Failed to fetch notification summary'
        });
    }
});
// GET /notifications: List finance notifications with filters and pagination
exports.feesRouter.get('/notifications', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { type, channel, isRead, status, search, fromDate, toDate, page, limit } = req.query;
        const result = await FinanceNotificationService_1.FinanceNotificationService.getNotifications(tenantOrgId, {
            type: type,
            channel: channel,
            isRead: isRead !== undefined ? isRead === 'true' : undefined,
            status: status,
            search: search,
            fromDate: fromDate,
            toDate: toDate,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('[GET /fees/notifications] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'NOTIFICATIONS_LIST_ERROR',
            message: error.message || 'Failed to fetch notifications list'
        });
    }
});
// GET /notifications/templates: List available Finance message templates
exports.feesRouter.get('/notifications/templates', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const templates = FinanceNotificationService_1.FinanceNotificationService.getTemplates();
        res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        console.error('[GET /fees/notifications/templates] Error:', error);
        res.status(500).json({
            success: false,
            error: 'TEMPLATES_FETCH_ERROR',
            message: error.message || 'Failed to fetch templates'
        });
    }
});
// GET /notifications/channels: List notification channel health and configuration status
exports.feesRouter.get('/notifications/channels', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const channels = FinanceNotificationService_1.FinanceNotificationService.getChannelHealth(tenantOrgId);
        res.json({
            success: true,
            data: channels
        });
    }
    catch (error) {
        console.error('[GET /fees/notifications/channels] Error:', error);
        res.status(500).json({
            success: false,
            error: 'CHANNELS_FETCH_ERROR',
            message: error.message || 'Failed to fetch channel health'
        });
    }
});
// GET /notifications/:id: Detail for single notification
exports.feesRouter.get('/notifications/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { id } = req.params;
        const notification = await FinanceNotificationService_1.FinanceNotificationService.getNotificationDetail(tenantOrgId, id);
        res.json({
            success: true,
            data: notification
        });
    }
    catch (error) {
        console.error(`[GET /fees/notifications/${req.params.id}] Error:`, error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'NOTIFICATION_DETAIL_ERROR',
            message: error.message || 'Failed to fetch notification detail'
        });
    }
});
// POST /notifications/preview: Preview template with sample data (Safe, does not send)
exports.feesRouter.post('/notifications/preview', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const { templateKey, sampleData } = req.body;
        if (!templateKey) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_TEMPLATE_KEY',
                message: 'Template key is required for preview'
            });
        }
        const preview = FinanceNotificationService_1.FinanceNotificationService.previewTemplate(templateKey, sampleData);
        res.json({
            success: true,
            data: preview
        });
    }
    catch (error) {
        console.error('[POST /fees/notifications/preview] Error:', error);
        res.status(error.statusCode || 400).json({
            success: false,
            error: 'PREVIEW_ERROR',
            message: error.message || 'Failed to generate template preview'
        });
    }
});
// POST /notifications/send-reminder: Explicitly trigger batch reminders for eligible dues
exports.feesRouter.post('/notifications/send-reminder', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.PAYMENT_RECORD), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        const userId = req.context?.user?.id || req.context?.user?.user_id || '00000000-0000-0000-0000-000000000000';
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { reminderType, gradeId, academicYearId, minOutstanding, dryRun } = req.body;
        if (reminderType !== 'overdue' && reminderType !== 'due_soon') {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REMINDER_TYPE',
                message: "reminderType must be either 'overdue' or 'due_soon'"
            });
        }
        const result = await FinanceNotificationService_1.FinanceNotificationService.sendBatchReminders(tenantOrgId, userId, {
            reminderType,
            gradeId,
            academicYearId,
            minOutstanding,
            dryRun: !!dryRun,
        });
        res.json({
            success: true,
            message: dryRun
                ? `Reminder preview generated: ${result.totalEligible} eligible recipients identified.`
                : `Reminders dispatched: ${result.dispatchedCount} notifications sent successfully.`,
            data: result
        });
    }
    catch (error) {
        console.error('[POST /fees/notifications/send-reminder] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'SEND_REMINDER_ERROR',
            message: error.message || 'Failed to send batch reminders'
        });
    }
});
// POST /notifications/:id/retry: Retry dispatch for an existing notification
exports.feesRouter.post('/notifications/:id/retry', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.PAYMENT_RECORD), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { id } = req.params;
        const channel = req.body?.channel || 'in_app';
        const retryResult = await FinanceNotificationService_1.FinanceNotificationService.retryNotification(tenantOrgId, id, channel);
        res.json({
            success: true,
            message: 'Notification retry processed',
            data: retryResult
        });
    }
    catch (error) {
        console.error(`[POST /fees/notifications/${req.params.id}/retry] Error:`, error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'RETRY_ERROR',
            message: error.message || 'Failed to retry notification'
        });
    }
});
// =========================================================================
// 8. FINANCE RECONCILIATION & SETTLEMENT CONTROL (PHASE 10)
// =========================================================================
const ReconciliationService_1 = require("./services/ReconciliationService");
// GET /reconciliation/summary: High-level reconciliation KPIs
exports.feesRouter.get('/reconciliation/summary', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { startDate, endDate } = req.query;
        const summary = await ReconciliationService_1.ReconciliationService.getSummaryKPIs(tenantOrgId, {
            startDate: startDate,
            endDate: endDate
        });
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('[GET /fees/reconciliation/summary] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'RECONCILIATION_SUMMARY_ERROR',
            message: error.message || 'Failed to fetch reconciliation summary metrics'
        });
    }
});
// GET /reconciliation/transactions: Paginated reconciliation transactions register
exports.feesRouter.get('/reconciliation/transactions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { startDate, endDate, paymentMethod, status, classification, search, limit, offset, sortBy, sortOrder } = req.query;
        const result = await ReconciliationService_1.ReconciliationService.getTransactions(tenantOrgId, {
            startDate: startDate,
            endDate: endDate,
            paymentMethod: paymentMethod,
            status: status,
            classification: classification,
            search: search,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
            sortBy: sortBy,
            sortOrder: sortOrder || 'DESC'
        });
        res.json({
            success: true,
            data: result.transactions,
            total: result.totalCount,
            limit: limit ? Number(limit) : 20,
            offset: offset ? Number(offset) : 0
        });
    }
    catch (error) {
        console.error('[GET /fees/reconciliation/transactions] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'RECONCILIATION_TRANSACTIONS_ERROR',
            message: error.message || 'Failed to fetch reconciliation transactions'
        });
    }
});
// GET /reconciliation/transactions/:id: Detailed investigation view for drawer
exports.feesRouter.get('/reconciliation/transactions/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { id } = req.params;
        const detail = await ReconciliationService_1.ReconciliationService.getTransactionDetail(tenantOrgId, id);
        res.json({
            success: true,
            data: detail
        });
    }
    catch (error) {
        console.error(`[GET /fees/reconciliation/transactions/${req.params.id}] Error:`, error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'TRANSACTION_DETAIL_ERROR',
            message: error.message || 'Failed to fetch transaction investigation details'
        });
    }
});
// GET /reconciliation/exceptions: Prioritized exception triage queue
exports.feesRouter.get('/reconciliation/exceptions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { limit, offset } = req.query;
        const result = await ReconciliationService_1.ReconciliationService.getExceptions(tenantOrgId, {
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined
        });
        res.json({
            success: true,
            data: result.exceptions,
            total: result.totalCount
        });
    }
    catch (error) {
        console.error('[GET /fees/reconciliation/exceptions] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'EXCEPTIONS_QUEUE_ERROR',
            message: error.message || 'Failed to fetch reconciliation exceptions'
        });
    }
});
// POST /reconciliation/preview: Read-only simulation of reconciliation run
exports.feesRouter.post('/reconciliation/preview', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { startDate, endDate, paymentMethod } = req.body || {};
        const preview = await ReconciliationService_1.ReconciliationService.previewReconciliationRun(tenantOrgId, {
            startDate,
            endDate,
            paymentMethod
        });
        res.json({
            success: true,
            data: preview
        });
    }
    catch (error) {
        console.error('[POST /fees/reconciliation/preview] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'PREVIEW_ERROR',
            message: error.message || 'Failed to generate reconciliation preview'
        });
    }
});
// POST /reconciliation/run: Execute durable reconciliation run
exports.feesRouter.post('/reconciliation/run', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.PAYMENT_RECORD), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { periodStart, periodEnd, notes } = req.body || {};
        const userId = req.context?.user?.id;
        const runResult = await ReconciliationService_1.ReconciliationService.executeReconciliationRun(tenantOrgId, { periodStart, periodEnd, notes }, userId);
        res.json({
            success: true,
            message: 'Reconciliation run executed successfully',
            data: runResult
        });
    }
    catch (error) {
        console.error('[POST /fees/reconciliation/run] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'RECONCILIATION_RUN_ERROR',
            message: error.message || 'Failed to execute reconciliation run'
        });
    }
});
// GET /reconciliation/runs: Historical reconciliation runs
exports.feesRouter.get('/reconciliation/runs', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { limit } = req.query;
        const runs = await ReconciliationService_1.ReconciliationService.getReconciliationRuns(tenantOrgId, limit ? Number(limit) : 20);
        res.json({
            success: true,
            data: runs
        });
    }
    catch (error) {
        console.error('[GET /fees/reconciliation/runs] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'RUNS_FETCH_ERROR',
            message: error.message || 'Failed to fetch historical reconciliation runs'
        });
    }
});
// GET /reconciliation/export: CSV download with formula injection sanitization
exports.feesRouter.get('/reconciliation/export', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { startDate, endDate, paymentMethod, status, classification, search } = req.query;
        const csvData = await ReconciliationService_1.ReconciliationService.exportTransactionsCSV(tenantOrgId, {
            startDate: startDate,
            endDate: endDate,
            paymentMethod: paymentMethod,
            status: status,
            classification: classification,
            search: search
        });
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="finance_reconciliation_${timestamp}.csv"`);
        res.status(200).send(csvData);
    }
    catch (error) {
        console.error('[GET /fees/reconciliation/export] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'CSV_EXPORT_ERROR',
            message: error.message || 'Failed to export reconciliation CSV'
        });
    }
});
// ======================================
// 10. ACCOUNTING & GENERAL LEDGER INTEGRATION (Phase 11)
// ======================================
const AccountingService_1 = require("./services/AccountingService");
// GET /accounting/capabilities: Authoritative accounting capability matrix
exports.feesRouter.get('/accounting/capabilities', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const capabilities = AccountingService_1.AccountingService.getCapabilities(tenantOrgId);
        res.json({
            success: true,
            data: capabilities
        });
    }
    catch (error) {
        console.error('[GET /fees/accounting/capabilities] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'CAPABILITIES_FETCH_ERROR',
            message: error.message || 'Failed to fetch accounting capabilities'
        });
    }
});
// GET /accounting/summary: Aggregated accounting readiness KPIs
exports.feesRouter.get('/accounting/summary', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { startDate, endDate } = req.query;
        const summary = await AccountingService_1.AccountingService.getSummary(tenantOrgId, {
            startDate: startDate,
            endDate: endDate
        });
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('[GET /fees/accounting/summary] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'SUMMARY_FETCH_ERROR',
            message: error.message || 'Failed to fetch accounting summary'
        });
    }
});
// GET /accounting/readiness: Operational financial transactions awaiting accounting treatment
exports.feesRouter.get('/accounting/readiness', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { sourceType, startDate, endDate, search, limit, offset } = req.query;
        const result = await AccountingService_1.AccountingService.getReadinessRegister(tenantOrgId, {
            sourceType: sourceType,
            startDate: startDate,
            endDate: endDate,
            search: search,
            limit: limit ? Number(limit) : 20,
            offset: offset ? Number(offset) : 0
        });
        res.json({
            success: true,
            data: result.records,
            pagination: {
                total: result.totalCount,
                limit: limit ? Number(limit) : 20,
                offset: offset ? Number(offset) : 0
            }
        });
    }
    catch (error) {
        console.error('[GET /fees/accounting/readiness] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'READINESS_FETCH_ERROR',
            message: error.message || 'Failed to fetch accounting readiness records'
        });
    }
});
// GET /accounting/accounts: Standard educational chart of accounts model
exports.feesRouter.get('/accounting/accounts', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const accountsData = AccountingService_1.AccountingService.getAccounts(tenantOrgId);
        res.json({
            success: true,
            data: accountsData
        });
    }
    catch (error) {
        console.error('[GET /fees/accounting/accounts] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'ACCOUNTS_FETCH_ERROR',
            message: error.message || 'Failed to fetch chart of accounts'
        });
    }
});
// GET /accounting/journals: Journal list (discloses blocked persistence)
exports.feesRouter.get('/accounting/journals', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const journalsData = AccountingService_1.AccountingService.getJournals(tenantOrgId);
        res.json({
            success: true,
            data: journalsData
        });
    }
    catch (error) {
        console.error('[GET /fees/accounting/journals] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'JOURNALS_FETCH_ERROR',
            message: error.message || 'Failed to fetch journal records'
        });
    }
});
// GET /accounting/trial-balance: Trial balance (discloses blocked GL)
exports.feesRouter.get('/accounting/trial-balance', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const trialBalance = await AccountingService_1.AccountingService.getTrialBalance(tenantOrgId);
        res.json({
            success: true,
            data: trialBalance
        });
    }
    catch (error) {
        console.error('[GET /fees/accounting/trial-balance] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'TRIAL_BALANCE_ERROR',
            message: error.message || 'Failed to fetch trial balance'
        });
    }
});
// GET /accounting/general-ledger: General Ledger account reports (discloses blocked GL)
exports.feesRouter.get('/accounting/general-ledger', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const glData = AccountingService_1.AccountingService.getGeneralLedger(tenantOrgId);
        res.json({
            success: true,
            data: glData
        });
    }
    catch (error) {
        console.error('[GET /fees/accounting/general-ledger] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'GL_REPORT_ERROR',
            message: error.message || 'Failed to fetch general ledger report'
        });
    }
});
// GET /accounting/exceptions: Prioritized accounting review queue
exports.feesRouter.get('/accounting/exceptions', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { limit, offset } = req.query;
        const exceptions = await AccountingService_1.AccountingService.getAccountingExceptions(tenantOrgId, {
            limit: limit ? Number(limit) : 20,
            offset: offset ? Number(offset) : 0
        });
        res.json({
            success: true,
            data: exceptions
        });
    }
    catch (error) {
        console.error('[GET /fees/accounting/exceptions] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'ACCOUNTING_EXCEPTIONS_ERROR',
            message: error.message || 'Failed to fetch accounting exceptions'
        });
    }
});
// GET /accounting/export: Export readiness records as sanitized CSV
exports.feesRouter.get('/accounting/export', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FEES_VIEW), async (req, res) => {
    try {
        const tenantOrgId = req.tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id || req.headers['x-tenant-id'];
        if (!tenantOrgId) {
            return res.status(400).json({
                success: false,
                error: 'TENANT_NOT_FOUND',
                message: 'Tenant organization could not be resolved from authenticated session.'
            });
        }
        const { sourceType, startDate, endDate, search } = req.query;
        const csvData = await AccountingService_1.AccountingService.exportReadinessCSV(tenantOrgId, {
            sourceType: sourceType,
            startDate: startDate,
            endDate: endDate,
            search: search
        });
        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="finance_accounting_readiness_${timestamp}.csv"`);
        res.status(200).send(csvData);
    }
    catch (error) {
        console.error('[GET /fees/accounting/export] Error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.code || 'CSV_EXPORT_ERROR',
            message: error.message || 'Failed to export accounting CSV'
        });
    }
});
