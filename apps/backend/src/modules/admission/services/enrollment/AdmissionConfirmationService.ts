import { ConfirmationRepository } from '../../repositories/enrollment/ConfirmationRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { EnrollmentValidationCoordinator } from './validators/EnrollmentValidationCoordinator';
import { AdmissionNumberGenerator } from './AdmissionNumberGenerator';
import { AdmissionConfirmation } from '../../domain/enrollment/AdmissionConfirmation';
import { AuditService } from '../AuditService';
import { EnrollmentStateMachine } from './state-machine/EnrollmentStateMachine';
import { supabase } from '../../../../config/supabase';

export class AdmissionConfirmationService {
    constructor(
        private readonly confirmRepo: ConfirmationRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly validationCoordinator: EnrollmentValidationCoordinator,
        private readonly idGen: AdmissionNumberGenerator,
        private readonly stateMachine: EnrollmentStateMachine,
        private readonly auditService: AuditService
    ) {}

    public async confirmAdmission(
        applicationId: string,
        role: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<AdmissionConfirmation> {
        // Step 1: Execute validations sequence checks
        await this.validationCoordinator.validatePreConfirmation(applicationId);

        const app = await this.appRepo.findById(applicationId);
        if (!app) {
            throw new Error(`Application with ID ${applicationId} not found`);
        }

        // Step 2: Validate workflow transitions rule
        await this.stateMachine.validateTransition('PAYMENT_COMPLETED', 'ADMISSION_CONFIRMED', role);

        // Step 3: Generate sequential admission number
        const admissionNumber = await this.idGen.generateNextNumber(app.schoolId);

        // Step 4: Persist admission confirmation
        const confirmation = new AdmissionConfirmation(
            crypto.randomUUID(),
            applicationId,
            null, // Links post student provisioning
            admissionNumber,
            new Date(),
            performedBy
        );
        await this.confirmRepo.save(confirmation);

        // Step 5: Update application timeline workflow logs
        await this.appRepo.logWorkflow(
            applicationId,
            'ADMISSION_CONFIRMED',
            null,
            'SUBMITTED',
            performedBy,
            `Candidate admission details confirmed. Assigned Admission ID: ${admissionNumber}`
        );

        // Register status history update
        await supabase
            .from('status_history')
            .insert({
                entity_name: 'admission_confirmation',
                entity_id: confirmation.id,
                old_status: null,
                new_status: 'ADMISSION_CONFIRMED',
                reason: 'Candidate details checked and confirmed.',
                changed_by: performedBy,
                correlation_id: correlationId,
                event_name: 'AdmissionConfirmed'
            });

        // Audit Trail log
        await this.auditService.logAudit({
            action: 'ADMISSION_CONFIRMED',
            entityName: 'admission_confirmation',
            entityId: confirmation.id,
            afterState: { admissionNumber },
            userId: performedBy,
            correlationId
        });

        return confirmation;
    }
}
