"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionNotificationService = void 0;
const supabase_1 = require("../../config/supabase");
const notification_service_1 = require("../transport/notification.service");
class AdmissionNotificationService {
    /**
     * Resolves all user IDs associated with a specific role.
     */
    static async getUserIdsByRole(roleName) {
        const { data, error } = await supabase_1.supabase
            .from('user_roles')
            .select('user_id, roles(name)')
            .eq('roles.name', roleName);
        if (error || !data)
            return [];
        return data.map((d) => d.user_id).filter(Boolean);
    }
    /**
     * Dispatches notifications to recipient roles based on pipeline events.
     */
    static async notifyPipelineEvent(event, applicationId, context = {}) {
        try {
            switch (event) {
                case 'INQUIRY_CREATED': {
                    const recIds = await this.getUserIdsByRole('RECEPTIONIST');
                    for (const uid of recIds) {
                        await notification_service_1.NotificationService.send(uid, 'New Inquiry Created', `A new walk-in or online inquiry has been registered.`);
                    }
                    break;
                }
                case 'LEAD_ASSIGNED': {
                    if (context.counselorUserId) {
                        await notification_service_1.NotificationService.send(context.counselorUserId, 'Lead Assigned', `A new candidate lead has been assigned to you for counseling.`);
                    }
                    break;
                }
                case 'APPLICATION_SUBMITTED': {
                    const aoIds = await this.getUserIdsByRole('ADMISSION_OFFICER');
                    for (const uid of aoIds) {
                        await notification_service_1.NotificationService.send(uid, 'Application Submitted', `Application ${applicationId} has been submitted and is ready for review.`);
                    }
                    break;
                }
                case 'DOCUMENT_REJECTED': {
                    if (context.parentUserId) {
                        await notification_service_1.NotificationService.send(context.parentUserId, 'Document Checklist Rejected', `Some documents require re-upload: ${context.reason || 'Verification failed'}.`);
                    }
                    break;
                }
                case 'EXAM_SCHEDULED': {
                    if (context.parentUserId) {
                        await notification_service_1.NotificationService.send(context.parentUserId, 'Entrance Test Scheduled', `Your entrance examination has been scheduled.`);
                    }
                    break;
                }
                case 'MERIT_PUBLISHED': {
                    if (context.parentUserId) {
                        await notification_service_1.NotificationService.send(context.parentUserId, 'Merit List Published', `The merit list has been published. Please review your standing.`);
                    }
                    break;
                }
                case 'OFFER_SENT': {
                    if (context.parentUserId) {
                        await notification_service_1.NotificationService.send(context.parentUserId, 'Admission Offer Extended', `Congratulations! An offer of admission has been extended. Please verify details.`);
                    }
                    break;
                }
                case 'PAYMENT_PENDING': {
                    const finIds = await this.getUserIdsByRole('FINANCE_OFFICER');
                    for (const uid of finIds) {
                        await notification_service_1.NotificationService.send(uid, 'Payment Verification Needed', `A fee payment receipt has been uploaded and requires reconciliation.`);
                    }
                    break;
                }
                case 'PAYMENT_VERIFIED': {
                    const aoIds = await this.getUserIdsByRole('ADMISSION_OFFICER');
                    for (const uid of aoIds) {
                        await notification_service_1.NotificationService.send(uid, 'Fee Payment Verified', `Application ID: ${applicationId} payment is verified. Ready for SIS enrollment.`);
                    }
                    break;
                }
                case 'ENROLLMENT_COMPLETE': {
                    if (context.parentUserId) {
                        await notification_service_1.NotificationService.send(context.parentUserId, 'Student Enrollment Complete', `Enrollment is finalized. Student Code: ${context.appCode || 'Provisioned'}.`);
                    }
                    break;
                }
            }
        }
        catch (err) {
            console.error('[Compatibility Notification] Dispatch failed:', err);
        }
    }
}
exports.AdmissionNotificationService = AdmissionNotificationService;
