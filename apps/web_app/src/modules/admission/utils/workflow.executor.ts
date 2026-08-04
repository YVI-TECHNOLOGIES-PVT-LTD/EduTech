import { admissionApi } from '../admission.api';
import type { AdmissionWorkflowActionPayload } from '../types';
import type { WorkflowActionType } from '../hooks/useWorkflow';

/** CRM-only workflow execution — no legacy fallbacks */
export async function executeWorkflowAction(
    applicationId: string,
    action: WorkflowActionType,
    payload: AdmissionWorkflowActionPayload = {},
) {
    const remark = payload.remark ?? payload.reason ?? '';

    switch (action) {
        case 'review':
            return admissionApi.reviewCrmApplication(applicationId, remark);
        case 'verify':
            return admissionApi.verifyDocs(applicationId, remark);
        case 'billing':
            return admissionApi.assignFeeStructure({
                application_id: applicationId,
                structure_id: payload.fee_ids?.[0],
            });
        case 'initiate_payment':
            return admissionApi.assignFeeStructure({
                application_id: applicationId,
                structure_id: payload.fee_ids?.[0],
            });
        case 'verify_fee':
            return admissionApi.verifyPayment({
                application_id: applicationId,
                status: payload.status === 'correction' ? 'correction' : 'verified',
                remarks: remark,
            });
        case 'recommend':
            return admissionApi.approveCrmApplication(applicationId, remark);
        case 'approve':
            return admissionApi.approveCrmApplication(applicationId, remark);
        case 'enrol':
            return admissionApi.enrollStudent({ application_id: applicationId });
        case 'reject':
            return admissionApi.reject(applicationId, remark);
        case 'decide_login':
            return admissionApi.decideLogin(
                applicationId,
                payload.status as 'APPROVED' | 'REJECTED' | 'BLOCKED',
                remark,
            );
        case 'submit_payment':
            return admissionApi.collectPayment({
                application_id: applicationId,
                payment_mode: payload.mode ?? '',
                reference_number: payload.reference ?? '',
                proof_url: payload.proof_url,
            });
        default:
            throw new Error(`Unknown workflow action: ${action}`);
    }
}

export function workflowActionToEvent(action: WorkflowActionType) {
    if (action === 'verify') return 'DOCUMENT_VERIFIED' as const;
    if (action === 'verify_fee') return 'FEE_PAID' as const;
    if (action === 'enrol') return 'ERP_STUDENT_CREATED' as const;
    if (action === 'review') return 'APPLICATION_REVIEWED' as const;
    if (action === 'approve' || action === 'recommend') return 'APPLICATION_APPROVED' as const;
    return 'APPLICATION_UPDATED' as const;
}
