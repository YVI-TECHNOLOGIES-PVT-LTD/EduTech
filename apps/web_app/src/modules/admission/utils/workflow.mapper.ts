import type { AdmissionWorkflowActionPayload } from '../types';
import type { AdmissionWorkflowAction } from '../core/AdmissionRegistry';

export interface WorkflowActionRequest {
    action: AdmissionWorkflowAction | string;
    applicationId: string;
    payload?: AdmissionWorkflowActionPayload;
}

export function buildWorkflowRemark(payload?: AdmissionWorkflowActionPayload): string {
    return payload?.remark ?? payload?.reason ?? '';
}
