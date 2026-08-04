"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationWorkflowService = void 0;
const BaseService_1 = require("../BaseService");
const NotFoundError_1 = require("../../errors/NotFoundError");
const supabase_1 = require("../../../../config/supabase");
const compatibility_notification_1 = require("../../../compatibility/compatibility.notification");
class ApplicationWorkflowService extends BaseService_1.BaseService {
    constructor(appRepo, valService, auditService) {
        super();
        this.appRepo = appRepo;
        this.valService = valService;
        this.auditService = auditService;
    }
    /**
     * Executes transition status updates securely on the application header.
     */
    async transitionTo(applicationId, newStatus, role, performedBy, notes, correlationId) {
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new NotFoundError_1.NotFoundError(`Application with ID ${applicationId} not found`);
        }
        const oldStatus = application.status;
        if (oldStatus === newStatus) {
            return application;
        }
        // Validate Transition constraints
        await this.valService.validateWorkflowTransition(oldStatus, newStatus, role);
        // Update state
        application.updateStatus(newStatus, notes);
        await this.appRepo.save(application);
        // Track timeline history log
        await this.appRepo.logWorkflow(applicationId, `STATUS_TRANSITION`, oldStatus, newStatus, performedBy, notes);
        // Track status_history details record
        await supabase_1.supabase
            .from('status_history')
            .insert({
            entity_name: 'admission_applications',
            entity_id: applicationId,
            old_status: oldStatus,
            new_status: newStatus,
            reason: notes || `State transition to ${newStatus}`,
            correlation_id: correlationId,
            event_name: `ApplicationStateChanged`
        });
        // Audit log trigger
        await this.auditService.logAudit({
            action: 'APPLICATION_STATUS_TRANSITION',
            entityName: 'admission_applications',
            entityId: applicationId,
            beforeState: { status: oldStatus },
            afterState: { status: newStatus, notes },
            userId: performedBy,
            correlationId
        });
        // Pipeline notification trigger
        const eventMap = {
            'SUBMITTED': 'APPLICATION_SUBMITTED',
            'DOCS_PENDING': 'DOCUMENT_REJECTED',
            'EXAM': 'EXAM_SCHEDULED',
            'MERIT': 'MERIT_PUBLISHED',
            'OFFERED': 'OFFER_SENT',
            'FEE_PENDING': 'PAYMENT_PENDING',
            'FEE_VERIFIED': 'PAYMENT_VERIFIED',
            'ENROLLED': 'ENROLLMENT_COMPLETE'
        };
        const notificationEvent = eventMap[newStatus];
        if (notificationEvent) {
            compatibility_notification_1.AdmissionNotificationService.notifyPipelineEvent(notificationEvent, applicationId, {
                parentUserId: application.createdBy,
                reason: notes || undefined
            }).catch(err => {
                console.error('[ApplicationWorkflowService] Notification trigger failed:', err);
            });
        }
        return application;
    }
}
exports.ApplicationWorkflowService = ApplicationWorkflowService;
