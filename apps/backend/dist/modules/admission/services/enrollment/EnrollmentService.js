"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentService = void 0;
const Enrollment_1 = require("../../domain/enrollment/Enrollment");
const supabase_1 = require("../../../../config/supabase");
class EnrollmentService {
    constructor(enrollRepo, confirmRepo, appRepo, validationCoordinator, provisionService, stateMachine, auditService, workflowOrchestrator) {
        this.enrollRepo = enrollRepo;
        this.confirmRepo = confirmRepo;
        this.appRepo = appRepo;
        this.validationCoordinator = validationCoordinator;
        this.provisionService = provisionService;
        this.stateMachine = stateMachine;
        this.auditService = auditService;
        this.workflowOrchestrator = workflowOrchestrator;
    }
    async enrollStudent(applicationId, role, performedBy, correlationId) {
        // Step 1: Run pre-enrollment validation checks
        const confirmation = await this.confirmRepo.findByApplicationId(applicationId);
        if (!confirmation) {
            throw new Error(`Candidate details must be CONFIRMED before finalizing enrollment.`);
        }
        // Step 2: Provision candidate details across ERP databases
        const studentId = await this.provisionService.provisionStudent(applicationId, confirmation.admissionNumber, performedBy, correlationId);
        // Step 3: Run full pipeline validation checks (including job successes)
        await this.validationCoordinator.validateFullEnrollment(applicationId);
        // Step 4: Validate state machine rules
        await this.stateMachine.validateTransition('ADMISSION_CONFIRMED', 'ENROLLED', role);
        // Step 5: Finalize and save Enrollment
        const enrollment = new Enrollment_1.Enrollment(confirmation.id, applicationId, studentId, confirmation.admissionNumber, new Date(), performedBy);
        await this.enrollRepo.save(enrollment);
        // Link student Id in confirmation table
        confirmation.linkStudent(studentId);
        await this.confirmRepo.save(confirmation);
        // Step 6: Log timeline workflow logs
        await this.appRepo.logWorkflow(applicationId, 'STUDENT_ENROLLED', null, 'SUBMITTED', performedBy, `Enrollment complete. Student ID: ${studentId}. Sequence: ${confirmation.admissionNumber}`);
        // Register status history update
        await supabase_1.supabase
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
            const ctx = {
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
exports.EnrollmentService = EnrollmentService;
