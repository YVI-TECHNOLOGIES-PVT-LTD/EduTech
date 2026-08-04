import { Request, Response } from 'express';
import { FeeAssignmentService } from '../../services/enrollment/FeeAssignmentService';
import { FeeCalculationService } from '../../services/enrollment/FeeCalculationService';
import { FeeWaiverService } from '../../services/enrollment/FeeWaiverService';
import { PaymentService } from '../../services/enrollment/PaymentService';
import { ReceiptService } from '../../services/enrollment/ReceiptService';
import { PaymentVerificationService } from '../../services/enrollment/PaymentVerificationService';
import { AdmissionConfirmationService } from '../../services/enrollment/AdmissionConfirmationService';
import { EnrollmentService } from '../../services/enrollment/EnrollmentService';
import { EnrollmentTimelineService } from '../../services/enrollment/EnrollmentTimelineService';
import { FeatureFlagService } from '../../services/FeatureFlagService';
import { ConfirmationRepository } from '../../repositories/enrollment/ConfirmationRepository';
import { ApplicationService } from '../../services/application/ApplicationService';
import { PermissionError } from '../../errors/PermissionError';
import { handleControllerError } from '../crm/ControllerErrorHandler';
import { getEffectiveRoles } from '../../../../rbac/rbac.middleware';
import { supabase } from '../../../../config/supabase';
import { FinanceEngine } from '../../../fees/services/FinanceEngine';

export class EnrollmentController {
    constructor(
        private readonly feeAssignService: FeeAssignmentService,
        private readonly feeCalcService: FeeCalculationService,
        private readonly waiverService: FeeWaiverService,
        private readonly paymentService: PaymentService,
        private readonly receiptService: ReceiptService,
        private readonly verificationService: PaymentVerificationService,
        private readonly confirmationService: AdmissionConfirmationService,
        private readonly enrollmentService: EnrollmentService,
        private readonly timelineService: EnrollmentTimelineService,
        private readonly confirmRepo: ConfirmationRepository,
        private readonly flagService: FeatureFlagService,
        private readonly appService: ApplicationService
    ) {}

    private async enforceApplicationAccess(req: Request, applicationId: string): Promise<void> {
        const user = req.context?.user;
        if (!user) throw new PermissionError('Unauthorized');
        const roles = getEffectiveRoles(user.roles);
        if (roles.includes('ADMIN') || roles.includes('ADMISSION_OFFICER') || roles.includes('COUNSELOR')) return;
        if (roles.includes('PARENT')) {
            await this.appService.assertParentCanAccess(applicationId, user.id, user.email);
        }
    }

    private async verifyFlag(req: Request, key: string) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        if (!await this.flagService.isEnabled('admission', key, envMode, schoolId)) {
            throw new PermissionError(`Feature Disabled: ${key}`);
        }
    }

    public assignFeeStructure = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'fee_collection');
            const { application_id, structure_id } = req.body;
            const userId = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            // Fetch Application Status to validate state
            const { data: application, error: appErr } = await supabase
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
            const data = await this.feeAssignService.assignStructure(
                application_id,
                structure_id,
                userId,
                correlationId
            );

            // 2. Finance Engine bridge: also create fee_demand + ledger debit in new tables
            //    We do this as a best-effort side-effect — legacy path is never blocked by this.
            try {
                // Only create a demand if one doesn't already exist for this application
                const { data: existing } = await supabase
                    .from('fee_demands')
                    .select('id')
                    .eq('application_id', application_id)
                    .limit(1);

                if (!existing || existing.length === 0) {
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 30); // default 30-day payment window

                    await FinanceEngine.initializeDemand({
                        application_id,
                        fee_structure_id: structure_id,
                        due_date: dueDate.toISOString().split('T')[0],
                        performedBy: userId || 'system'
                    });

                    console.log(`[EnrollmentController] Finance Engine demand created for application ${application_id}`);
                } else {
                    console.log(`[EnrollmentController] Finance Engine demand already exists for application ${application_id}, skipping.`);
                }
            } catch (finErr) {
                // Non-blocking: log but do not fail the admission assignment
                console.error(`[EnrollmentController] Finance Engine bridge error (non-blocking):`, finErr);
            }

            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getFeesSummary = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'fee_collection');
            const { applicationId } = req.params;
            await this.enforceApplicationAccess(req, applicationId);
            const data = await this.feeCalcService.calculateFees(applicationId);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public applyFeeWaiver = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'fee_collection');
            const { application_id, component_id, amount, remarks } = req.body;
            const userId = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            await this.waiverService.applyWaiver(
                application_id,
                component_id,
                amount,
                remarks,
                userId,
                correlationId
            );
            res.json({ success: true, message: 'Fee waiver applied successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public collectPayment = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'fee_collection');
            const { application_id, amount, payment_mode, transaction_number, gateway_reference } = req.body;
            const userId = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.paymentService.collectPayment(
                application_id,
                amount,
                payment_mode,
                transaction_number || null,
                gateway_reference || null,
                userId,
                correlationId
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public verifyPayment = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'fee_collection');
            const { payment_id, status } = req.body;
            const userId = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            await this.verificationService.verifyTransaction(
                payment_id,
                status,
                userId,
                correlationId
            );
            res.json({ success: true, message: `Payment transaction status updated: ${status}` });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getReceipt = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'fee_collection');
            const { paymentId } = req.params;
            const data = await this.receiptService.getReceiptByPaymentId(paymentId);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public confirmAdmission = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_enrollment');
            const { application_id } = req.body;
            const userId = req.context?.user?.id || null;
            const role = req.context?.user?.roles?.[0] || 'admission_officer';
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.confirmationService.confirmAdmission(
                application_id,
                role,
                userId,
                correlationId
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public enrollStudent = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_enrollment');
            await this.verifyFlag(req, 'erp_handover');
            const { application_id } = req.body;
            const userId = req.context?.user?.id || null;
            const role = req.context?.user?.roles?.[0] || 'admission_officer';
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.enrollmentService.enrollStudent(
                application_id,
                role,
                userId,
                correlationId
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getEnrollmentStatus = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_enrollment');
            const { applicationId } = req.params;
            await this.enforceApplicationAccess(req, applicationId);
            const data = await this.confirmRepo.findByApplicationId(applicationId);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getTimeline = async (req: Request, res: Response) => {
        try {
            const { applicationId } = req.params;
            res.json([]);
        } catch (err) {
            handleControllerError(res, err);
        }
    };
}
