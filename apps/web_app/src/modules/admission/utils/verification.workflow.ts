import type { WorkflowActionType } from '../hooks/useWorkflow';
import type { VerificationDocument } from './documentVerification.mapper';
import { buildCompleteVerificationRemark, buildReuploadRemark } from './documentVerification.mapper';

export type VerificationAction =
    | 'verify_document'
    | 'reject_document'
    | 'request_reupload'
    | 'approve_all'
    | 'reject_all'
    | 'complete_verification';

export interface VerificationWorkflowRequest {
    action: VerificationAction;
    applicationId: string;
    document?: VerificationDocument;
    remark?: string;
    documents?: VerificationDocument[];
}

export interface VerificationWorkflowPlan {
    workflowAction: WorkflowActionType;
    remark: string;
    canExecute: boolean;
    blockReason?: string;
}

export function planVerificationWorkflow(req: VerificationWorkflowRequest): VerificationWorkflowPlan {
    const { action, document, remark, documents = [] } = req;

    switch (action) {
        case 'complete_verification':
        case 'approve_all': {
            const missing = documents.filter(d => d.required && !d.uploaded);
            if (missing.length > 0) {
                return {
                    workflowAction: 'verify',
                    remark: '',
                    canExecute: false,
                    blockReason: `Missing required documents: ${missing.map(d => d.name).join(', ')}`,
                };
            }
            return {
                workflowAction: 'verify',
                remark: remark ?? buildCompleteVerificationRemark(documents),
                canExecute: true,
            };
        }
        case 'reject_all':
            return {
                workflowAction: 'reject',
                remark: remark ?? 'All documents rejected — application declined',
                canExecute: true,
            };
        case 'verify_document':
            if (!document?.uploaded) {
                return { workflowAction: 'verify', remark: '', canExecute: false, blockReason: 'Document not uploaded' };
            }
            return {
                workflowAction: 'review',
                remark: remark ?? `${document.name}: reviewed and approved pending batch completion`,
                canExecute: true,
            };
        case 'request_reupload':
        case 'reject_document':
            if (!document) {
                return { workflowAction: 'review', remark: '', canExecute: false, blockReason: 'No document selected' };
            }
            return {
                workflowAction: 'review',
                remark: remark ?? buildReuploadRemark(document, 'Correction required'),
                canExecute: true,
            };
        default:
            return { workflowAction: 'verify', remark: '', canExecute: false, blockReason: 'Unknown action' };
    }
}

export function verificationActionLabel(action: VerificationAction): string {
    const labels: Record<VerificationAction, string> = {
        verify_document: 'Verify',
        reject_document: 'Reject',
        request_reupload: 'Request Re-upload',
        approve_all: 'Approve All',
        reject_all: 'Reject All',
        complete_verification: 'Complete Verification',
    };
    return labels[action];
}
