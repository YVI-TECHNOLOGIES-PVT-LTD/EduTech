import type { QueryClient } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine } from '../core/AdmissionEngine';
import { ADMISSION_EVENTS } from '../core/AdmissionEvents';
import type { WorkflowActionType } from '../hooks/useWorkflow';

export type EnrollmentAction =
    | 'confirm_admission'
    | 'enroll_student'
    | 'reject_enrollment'
    | 'rollback_enrollment'
    | 'retry_provision'
    | 'assign_academic'
    | 'assign_guardian'
    | 'activate_fees'
    | 'allocate_transport'
    | 'allocate_hostel'
    | 'provision_library'
    | 'provision_identity';

export interface EnrollmentActionPayload {
    applicationId: string;
    remark?: string;
    stepKey?: string;
}

export interface EnrollmentActionPlan {
    type: 'enrollment_api' | 'workflow';
    enrollmentApi?: 'confirmAdmission' | 'enrollStudent';
    workflowAction?: WorkflowActionType;
    payload: Record<string, unknown>;
    remark?: string;
    canExecute: boolean;
    blockReason?: string;
}

export function dispatchEnrollmentEvents(
    queryClient: QueryClient,
    applicationId: string,
    kind: 'confirm' | 'enroll' | 'reject',
) {
    if (kind === 'enroll') {
        AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.ENROLLMENT_COMPLETED, { applicationId });
    }
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId });
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId });
    if (kind === 'confirm' || kind === 'enroll') {
        AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.PAYMENT_VERIFIED, { applicationId });
    }
}

export function planEnrollmentAction(action: EnrollmentAction, input: EnrollmentActionPayload): EnrollmentActionPlan {
    const basePayload = {
        application_id: input.applicationId,
        applicationId: input.applicationId,
    };

    switch (action) {
        case 'confirm_admission':
            return {
                type: 'enrollment_api',
                enrollmentApi: 'confirmAdmission',
                payload: basePayload,
                remark: input.remark ?? 'Admission confirmed — admission number generated',
                canExecute: true,
            };
        case 'enroll_student':
        case 'retry_provision':
            return {
                type: 'enrollment_api',
                enrollmentApi: 'enrollStudent',
                payload: basePayload,
                remark: input.remark ?? 'Student enrollment and ERP provisioning initiated',
                canExecute: true,
            };
        case 'reject_enrollment':
            return {
                type: 'workflow',
                workflowAction: 'reject',
                payload: {},
                remark: input.remark ?? 'Enrollment rejected',
                canExecute: true,
            };
        case 'rollback_enrollment':
            return {
                type: 'workflow',
                workflowAction: 'review',
                payload: { status: 'correction' },
                remark: input.remark ?? 'Enrollment rollback requested — audit recorded',
                canExecute: true,
            };
        case 'assign_academic':
        case 'assign_guardian':
        case 'activate_fees':
        case 'allocate_transport':
        case 'allocate_hostel':
        case 'provision_library':
        case 'provision_identity':
            return {
                type: 'workflow',
                workflowAction: 'review',
                payload: {},
                remark: input.remark ?? `${action.replace(/_/g, ' ')} — provisioned via enroll pipeline`,
                canExecute: true,
            };
        default:
            return { type: 'workflow', payload: {}, canExecute: false, blockReason: 'Unknown action' };
    }
}

export async function executeEnrollmentApi(
    api: NonNullable<EnrollmentActionPlan['enrollmentApi']>,
    payload: Record<string, unknown>,
) {
    const applicationId = String(payload.application_id ?? payload.applicationId);
    switch (api) {
        case 'confirmAdmission':
            return admissionApi.confirmAdmission({ application_id: applicationId });
        case 'enrollStudent':
            return admissionApi.enrollStudent({ application_id: applicationId });
    }
}

export function enrollmentActionLabel(action: EnrollmentAction): string {
    const labels: Record<EnrollmentAction, string> = {
        confirm_admission: 'Confirm Admission',
        enroll_student: 'Enroll Student',
        reject_enrollment: 'Reject Enrollment',
        rollback_enrollment: 'Rollback',
        retry_provision: 'Retry Provisioning',
        assign_academic: 'Academic Allocation',
        assign_guardian: 'Guardian Assignment',
        activate_fees: 'Activate Fees',
        allocate_transport: 'Transport Allocation',
        allocate_hostel: 'Hostel Allocation',
        provision_library: 'Library Provisioning',
        provision_identity: 'Identity Provisioning',
    };
    return labels[action];
}
