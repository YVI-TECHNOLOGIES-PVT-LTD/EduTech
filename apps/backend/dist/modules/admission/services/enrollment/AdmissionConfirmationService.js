"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionConfirmationService = void 0;
const AdmissionConfirmation_1 = require("../../domain/enrollment/AdmissionConfirmation");
const supabase_1 = require("../../../../config/supabase");
class AdmissionConfirmationService {
    constructor(confirmRepo, appRepo, validationCoordinator, idGen, stateMachine, auditService) {
        this.confirmRepo = confirmRepo;
        this.appRepo = appRepo;
        this.validationCoordinator = validationCoordinator;
        this.idGen = idGen;
        this.stateMachine = stateMachine;
        this.auditService = auditService;
    }
    async confirmAdmission(applicationId, role, performedBy, correlationId) {
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
        const confirmation = new AdmissionConfirmation_1.AdmissionConfirmation(crypto.randomUUID(), applicationId, null, // Links post student provisioning
        admissionNumber, new Date(), performedBy);
        await this.confirmRepo.save(confirmation);
        // Step 5: Update application timeline workflow logs
        await this.appRepo.logWorkflow(applicationId, 'ADMISSION_CONFIRMED', null, 'SUBMITTED', performedBy, `Candidate admission details confirmed. Assigned Admission ID: ${admissionNumber}`);
        // Register status history update
        await supabase_1.supabase
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
exports.AdmissionConfirmationService = AdmissionConfirmationService;
