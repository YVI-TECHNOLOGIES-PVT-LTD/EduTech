"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentController = void 0;
const PermissionError_1 = require("../../errors/PermissionError");
const ControllerErrorHandler_1 = require("../crm/ControllerErrorHandler");
const rbac_middleware_1 = require("../../../../rbac/rbac.middleware");
const supabase_1 = require("../../../../config/supabase");
const FinanceEngine_1 = require("../../../fees/services/FinanceEngine");
class EnrollmentController {
    constructor(feeAssignService, feeCalcService, waiverService, paymentService, receiptService, verificationService, confirmationService, enrollmentService, timelineService, confirmRepo, flagService, appService) {
        this.feeAssignService = feeAssignService;
        this.feeCalcService = feeCalcService;
        this.waiverService = waiverService;
        this.paymentService = paymentService;
        this.receiptService = receiptService;
        this.verificationService = verificationService;
        this.confirmationService = confirmationService;
        this.enrollmentService = enrollmentService;
        this.timelineService = timelineService;
        this.confirmRepo = confirmRepo;
        this.flagService = flagService;
        this.appService = appService;
        this.assignFeeStructure = async (req, res) => {
            try {
                await this.verifyFlag(req, 'fee_collection');
                const { application_id, structure_id } = req.body;
                const userId = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                // Fetch Application Status to validate state
                const { data: application, error: appErr } = await supabase_1.supabase
                    .from('admission_applications')
                    .select('status')
                    .eq('id', application_id)
                    .single();
                if (appErr || !application) {
                    return res.status(404).json({ error: 'Application not found' });
                }
                const allowedStatuses = ['APPROVED', 'OFFERED', 'OFFER_ACCEPTED', 'FEE_PENDING', 'PAYMENT_PENDING'];
                if (!allowedStatuses.includes(application.status)) {
                    return res.status(422).json({ error: `Admissions must be approved before billing. Current status: ${application.status}` });
                }
                // 1. Legacy path: write to admission_fee_assignments (preserves Admission v1.0)
                const data = await this.feeAssignService.assignStructure(application_id, structure_id, userId, correlationId);
                // 2. Finance Engine bridge: also create fee_demand + ledger debit in new tables
                //    We do this as a best-effort side-effect — legacy path is never blocked by this.
                try {
                    // Only create a demand if one doesn't already exist for this application
                    const { data: existing } = await supabase_1.supabase
                        .from('fee_demands')
                        .select('id')
                        .eq('application_id', application_id)
                        .limit(1);
                    if (!existing || existing.length === 0) {
                        const dueDate = new Date();
                        dueDate.setDate(dueDate.getDate() + 30); // default 30-day payment window
                        await FinanceEngine_1.FinanceEngine.initializeDemand({
                            application_id,
                            fee_structure_id: structure_id,
                            due_date: dueDate.toISOString().split('T')[0],
                            performedBy: userId || 'system'
                        });
                        console.log(`[EnrollmentController] Finance Engine demand created for application ${application_id}`);
                    }
                    else {
                        console.log(`[EnrollmentController] Finance Engine demand already exists for application ${application_id}, skipping.`);
                    }
                }
                catch (finErr) {
                    // Non-blocking: log but do not fail the admission assignment
                    console.error(`[EnrollmentController] Finance Engine bridge error (non-blocking):`, finErr);
                }
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getFeesSummary = async (req, res) => {
            try {
                await this.verifyFlag(req, 'fee_collection');
                const { applicationId } = req.params;
                await this.enforceApplicationAccess(req, applicationId);
                const data = await this.feeCalcService.calculateFees(applicationId);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.applyFeeWaiver = async (req, res) => {
            try {
                await this.verifyFlag(req, 'fee_collection');
                const { application_id, component_id, amount, remarks } = req.body;
                const userId = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                await this.waiverService.applyWaiver(application_id, component_id, amount, remarks, userId, correlationId);
                res.json({ success: true, message: 'Fee waiver applied successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.collectPayment = async (req, res) => {
            try {
                await this.verifyFlag(req, 'fee_collection');
                const { application_id, amount, payment_mode, transaction_number, gateway_reference } = req.body;
                const userId = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.paymentService.collectPayment(application_id, amount, payment_mode, transaction_number || null, gateway_reference || null, userId, correlationId);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.verifyPayment = async (req, res) => {
            try {
                await this.verifyFlag(req, 'fee_collection');
                const { payment_id, status } = req.body;
                const userId = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                await this.verificationService.verifyTransaction(payment_id, status, userId, correlationId);
                res.json({ success: true, message: `Payment transaction status updated: ${status}` });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getReceipt = async (req, res) => {
            try {
                await this.verifyFlag(req, 'fee_collection');
                const { paymentId } = req.params;
                const data = await this.receiptService.getReceiptByPaymentId(paymentId);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.confirmAdmission = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_enrollment');
                const { application_id } = req.body;
                const userId = req.context?.user?.id || null;
                const role = req.context?.user?.roles?.[0] || 'admission_officer';
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.confirmationService.confirmAdmission(application_id, role, userId, correlationId);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.enrollStudent = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_enrollment');
                await this.verifyFlag(req, 'erp_handover');
                const { application_id } = req.body;
                const userId = req.context?.user?.id || null;
                const role = req.context?.user?.roles?.[0] || 'admission_officer';
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.enrollmentService.enrollStudent(application_id, role, userId, correlationId);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getEnrollmentStatus = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_enrollment');
                const { applicationId } = req.params;
                await this.enforceApplicationAccess(req, applicationId);
                const data = await this.confirmRepo.findByApplicationId(applicationId);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getTimeline = async (req, res) => {
            try {
                const { applicationId } = req.params;
                res.json([]);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
    }
    async enforceApplicationAccess(req, applicationId) {
        const user = req.context?.user;
        if (!user)
            throw new PermissionError_1.PermissionError('Unauthorized');
        const roles = (0, rbac_middleware_1.getEffectiveRoles)(user.roles);
        if (roles.includes('ADMIN') || roles.includes('ADMISSION_OFFICER') || roles.includes('COUNSELOR'))
            return;
        if (roles.includes('PARENT')) {
            await this.appService.assertParentCanAccess(applicationId, user.id, user.email);
        }
    }
    async verifyFlag(req, key) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        if (!await this.flagService.isEnabled('admission', key, envMode, schoolId)) {
            throw new PermissionError_1.PermissionError(`Feature Disabled: ${key}`);
        }
    }
}
exports.EnrollmentController = EnrollmentController;
