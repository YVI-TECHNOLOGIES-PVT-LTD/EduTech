import { EnrollmentRepository } from '../../repositories/enrollment/EnrollmentRepository';
import { ConfirmationRepository } from '../../repositories/enrollment/ConfirmationRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { EnrollmentValidationCoordinator } from './validators/EnrollmentValidationCoordinator';
import { StudentProvisionService } from './StudentProvisionService';
import { Enrollment } from '../../domain/enrollment/Enrollment';
import { AuditService } from '../AuditService';
import { EnrollmentStateMachine } from './state-machine/EnrollmentStateMachine';
import { supabase } from '../../../../config/supabase';
import {
    ApplicationWorkflowOrchestrator,
    type WorkflowEventContext,
} from '../application/ApplicationWorkflowOrchestrator';

export class EnrollmentService {
    constructor(
        private readonly enrollRepo: EnrollmentRepository,
        private readonly confirmRepo: ConfirmationRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly validationCoordinator: EnrollmentValidationCoordinator,
        private readonly provisionService: StudentProvisionService,
        private readonly stateMachine: EnrollmentStateMachine,
        private readonly auditService: AuditService,
        private readonly workflowOrchestrator?: ApplicationWorkflowOrchestrator
    ) {}

    public async enrollStudent(
        applicationId: string,
        role: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<Enrollment> {
        // Step 1: Run pre-enrollment validation checks
        const confirmation = await this.confirmRepo.findByApplicationId(applicationId);
        if (!confirmation) {
            throw new Error(`Candidate details must be CONFIRMED before finalizing enrollment.`);
        }

        // Step 2: Provision candidate details across ERP databases
        const studentId = await this.provisionService.provisionStudent(
            applicationId,
            confirmation.admissionNumber,
            performedBy,
            correlationId
        );

        // Step 3: Run full pipeline validation checks (including job successes)
        await this.validationCoordinator.validateFullEnrollment(applicationId);

        // Step 4: Validate state machine rules
        await this.stateMachine.validateTransition('ADMISSION_CONFIRMED', 'ENROLLED', role);

        // Step 5: Finalize and save Enrollment
        const enrollment = new Enrollment(
            confirmation.id,
            applicationId,
            studentId,
            confirmation.admissionNumber,
            new Date(),
            performedBy
        );
        await this.enrollRepo.save(enrollment);

        // Link student Id in confirmation table
        confirmation.linkStudent(studentId);
        await this.confirmRepo.save(confirmation);

        // Step 6: Log timeline workflow logs
        await this.appRepo.logWorkflow(
            applicationId,
            'STUDENT_ENROLLED',
            null,
            'SUBMITTED',
            performedBy,
            `Enrollment complete. Student ID: ${studentId}. Sequence: ${confirmation.admissionNumber}`
        );

        // Register status history update
        await supabase
            .from('status_history')
            .insert({
                entity_name: 'admission_confirmation',
                entity_id: enrollment.id,
                old_status: 'ADMISSION_CONFIRMED',
                new_status: 'ENROLLED',
                reason: 'Candidate provisioning completed. Student enrolled.',
                changed_by: performedBy,
                correlation_id: correlationId,
                event_name: 'StudentEnrolled'
            });

        // Audit Trail log
        await this.auditService.logAudit({
            action: 'STUDENT_ENROLLED',
            entityName: 'admission_confirmation',
            entityId: enrollment.id,
            afterState: { studentId, admissionNumber: confirmation.admissionNumber },
            userId: performedBy,
            correlationId
        });

        if (this.workflowOrchestrator) {
            const application = await this.appRepo.findById(applicationId);
            const ctx: WorkflowEventContext = {
                userId: performedBy,
                role,
                correlationId,
                notes: `ERP student provisioned: ${studentId}`,
                schoolId: application?.schoolId,
                academicYearId: application?.academicYearId,
            };
            await this.workflowOrchestrator.publish('ERP_STUDENT_CREATED', applicationId, ctx);
        }

        return enrollment;
    }
}
