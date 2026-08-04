import { admissionApi } from '../admission.api';
import type { WorkflowActionType } from '../hooks/useWorkflow';

export type OfferAction =
    | 'generate_offer'
    | 'approve_offer'
    | 'publish_offer'
    | 'send_offer'
    | 'accept_offer'
    | 'reject_offer'
    | 'expire_offer'
    | 'withdraw_offer'
    | 'defer_offer'
    | 'resend_offer'
    | 'cancel_offer';

export interface OfferActionPayload {
    applicationId: string;
    templateId?: string;
    expiryDays?: number;
    remark?: string;
}

export interface OfferActionPlan {
    type: 'offer_api' | 'workflow';
    offerApi?: 'generateOffer' | 'sendOffer' | 'acceptOffer' | 'rejectOffer';
    workflowAction?: WorkflowActionType;
    payload: Record<string, unknown>;
    remark?: string;
    canExecute: boolean;
    blockReason?: string;
}

export function planOfferAction(action: OfferAction, input: OfferActionPayload): OfferActionPlan {
    switch (action) {
        case 'generate_offer':
            if (!input.templateId) {
                return {
                    type: 'offer_api',
                    offerApi: 'generateOffer',
                    payload: {},
                    canExecute: false,
                    blockReason: 'Offer template ID is required',
                };
            }
            return {
                type: 'offer_api',
                offerApi: 'generateOffer',
                payload: {
                    application_id: input.applicationId,
                    template_id: input.templateId,
                    expiry_days: input.expiryDays ?? 14,
                    applicationId: input.applicationId,
                },
                remark: input.remark ?? 'Offer letter generated',
                canExecute: true,
            };
        case 'send_offer':
        case 'resend_offer':
            return {
                type: 'offer_api',
                offerApi: 'sendOffer',
                payload: { application_id: input.applicationId, applicationId: input.applicationId },
                remark: input.remark ?? 'Offer letter sent to parent',
                canExecute: true,
            };
        case 'accept_offer':
            return {
                type: 'offer_api',
                offerApi: 'acceptOffer',
                payload: { application_id: input.applicationId, applicationId: input.applicationId },
                remark: input.remark ?? 'Offer accepted',
                canExecute: true,
            };
        case 'reject_offer':
        case 'cancel_offer':
            return {
                type: 'offer_api',
                offerApi: 'rejectOffer',
                payload: { application_id: input.applicationId, applicationId: input.applicationId },
                remark: input.remark ?? 'Offer rejected',
                canExecute: true,
            };
        case 'approve_offer':
            return {
                type: 'workflow',
                workflowAction: 'approve',
                payload: {},
                remark: input.remark ?? 'Offer approved by authority',
                canExecute: true,
            };
        case 'publish_offer':
            return {
                type: 'workflow',
                workflowAction: 'recommend',
                payload: {},
                remark: input.remark ?? 'Offer published for dispatch',
                canExecute: true,
            };
        case 'expire_offer':
            return {
                type: 'workflow',
                workflowAction: 'review',
                payload: {},
                remark: input.remark ?? 'Offer marked expired',
                canExecute: true,
            };
        case 'withdraw_offer':
            return {
                type: 'workflow',
                workflowAction: 'reject',
                payload: {},
                remark: input.remark ?? 'Offer withdrawn',
                canExecute: true,
            };
        case 'defer_offer':
            return {
                type: 'workflow',
                workflowAction: 'review',
                payload: {},
                remark: input.remark ?? 'Offer deferred',
                canExecute: true,
            };
        default:
            return { type: 'workflow', payload: {}, canExecute: false, blockReason: 'Unknown action' };
    }
}

export async function executeOfferApi(
    api: 'generateOffer' | 'sendOffer' | 'acceptOffer' | 'rejectOffer',
    payload: Record<string, unknown>,
) {
    switch (api) {
        case 'generateOffer':
            return admissionApi.generateOffer(payload);
        case 'sendOffer':
            return admissionApi.sendOffer(payload);
        case 'acceptOffer':
            return admissionApi.acceptOffer(payload);
        case 'rejectOffer':
            return admissionApi.rejectOffer(payload);
    }
}

export function offerActionLabel(action: OfferAction): string {
    const labels: Record<OfferAction, string> = {
        generate_offer: 'Generate Offer',
        approve_offer: 'Approve Offer',
        publish_offer: 'Publish Offer',
        send_offer: 'Send Offer',
        accept_offer: 'Accept Offer',
        reject_offer: 'Reject Offer',
        expire_offer: 'Expire Offer',
        withdraw_offer: 'Withdraw Offer',
        defer_offer: 'Defer Offer',
        resend_offer: 'Resend Offer',
        cancel_offer: 'Cancel Offer',
    };
    return labels[action];
}
