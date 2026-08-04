import { admissionApi } from '../admission.api';
import type { WorkflowActionType } from '../hooks/useWorkflow';

export type FinanceAction =
    | 'assign_fee_structure'
    | 'verify_payment'
    | 'approve_payment'
    | 'reject_payment'
    | 'collect_payment'
    | 'submit_payment'
    | 'initiate_payment'
    | 'generate_receipt'
    | 'regenerate_receipt'
    | 'verify_scholarship'
    | 'approve_waiver'
    | 'reject_waiver'
    | 'apply_waiver'
    | 'refund'
    | 'reverse_verification'
    | 'mark_pending';

export interface FinanceActionPayload {
    applicationId: string;
    paymentId?: string;
    amount?: number;
    paymentMode?: string;
    transactionNumber?: string;
    gatewayReference?: string;
    componentId?: string;
    structureId?: string;
    waiverAmount?: number;
    remark?: string;
}

export interface FinanceActionPlan {
    type: 'finance_api' | 'workflow';
    financeApi?:
        | 'collectPayment'
        | 'verifyPayment'
        | 'applyFeeWaiver'
        | 'getReceipt'
        | 'assignFeeStructure';
    workflowAction?: WorkflowActionType;
    payload: Record<string, unknown>;
    remark?: string;
    canExecute: boolean;
    blockReason?: string;
}

const PAYMENT_MODES = ['Cash', 'Card', 'Cheque', 'Bank_Transfer', 'Online_Gateway'] as const;

export function normalizePaymentMode(mode: string): (typeof PAYMENT_MODES)[number] {
    const map: Record<string, (typeof PAYMENT_MODES)[number]> = {
        Cash: 'Cash',
        Card: 'Card',
        Cheque: 'Cheque',
        UPI: 'Bank_Transfer',
        'Net Banking': 'Online_Gateway',
        'Credit/Debit Card': 'Card',
        Bank_Transfer: 'Bank_Transfer',
        Online_Gateway: 'Online_Gateway',
    };
    return map[mode] ?? 'Cash';
}

export function planFinanceAction(action: FinanceAction, input: FinanceActionPayload): FinanceActionPlan {
    switch (action) {
        case 'assign_fee_structure':
            if (!input.structureId) {
                return {
                    type: 'finance_api',
                    financeApi: 'assignFeeStructure',
                    payload: {},
                    canExecute: false,
                    blockReason: 'Fee structure ID is required',
                };
            }
            return {
                type: 'finance_api',
                financeApi: 'assignFeeStructure',
                payload: {
                    application_id: input.applicationId,
                    structure_id: input.structureId,
                    applicationId: input.applicationId,
                },
                remark: input.remark ?? 'Fee structure assigned',
                canExecute: true,
            };
        case 'collect_payment':
            if (!input.amount || input.amount <= 0) {
                return {
                    type: 'finance_api',
                    financeApi: 'collectPayment',
                    payload: {},
                    canExecute: false,
                    blockReason: 'Valid payment amount is required',
                };
            }
            return {
                type: 'finance_api',
                financeApi: 'collectPayment',
                payload: {
                    application_id: input.applicationId,
                    amount: input.amount,
                    payment_mode: normalizePaymentMode(input.paymentMode ?? 'Cash'),
                    transaction_number: input.transactionNumber,
                    gateway_reference: input.gatewayReference,
                    applicationId: input.applicationId,
                },
                remark: input.remark ?? 'Payment collected',
                canExecute: true,
            };
        case 'verify_payment':
            if (!input.paymentId) {
                return {
                    type: 'finance_api',
                    financeApi: 'verifyPayment',
                    payload: {},
                    canExecute: false,
                    blockReason: 'Payment ID is required',
                };
            }
            return {
                type: 'finance_api',
                financeApi: 'verifyPayment',
                payload: { payment_id: input.paymentId, status: 'COMPLETED', applicationId: input.applicationId },
                remark: input.remark ?? 'Payment verified',
                canExecute: true,
            };
        case 'reject_payment':
            if (input.paymentId) {
                return {
                    type: 'finance_api',
                    financeApi: 'verifyPayment',
                    payload: { payment_id: input.paymentId, status: 'FAILED', applicationId: input.applicationId },
                    remark: input.remark ?? 'Payment rejected',
                    canExecute: true,
                };
            }
            return {
                type: 'workflow',
                workflowAction: 'verify_fee',
                payload: { status: 'correction' },
                remark: input.remark ?? 'Payment rejected — correction required',
                canExecute: true,
            };
        case 'approve_payment':
            return {
                type: 'workflow',
                workflowAction: 'verify_fee',
                payload: { status: 'verified' },
                remark: input.remark ?? 'Payment approved',
                canExecute: true,
            };
        case 'submit_payment':
            return {
                type: 'workflow',
                workflowAction: 'submit_payment',
                payload: { mode: input.paymentMode ?? '', reference: input.transactionNumber ?? '' },
                remark: input.remark ?? 'Payment proof submitted',
                canExecute: true,
            };
        case 'initiate_payment':
            return {
                type: 'workflow',
                workflowAction: 'initiate_payment',
                payload: { amount: input.amount ?? 0 },
                remark: input.remark ?? 'Payment initiated',
                canExecute: true,
            };
        case 'apply_waiver':
        case 'approve_waiver':
            if (!input.componentId || !input.waiverAmount) {
                return {
                    type: 'finance_api',
                    financeApi: 'applyFeeWaiver',
                    payload: {},
                    canExecute: false,
                    blockReason: 'Component ID and waiver amount are required',
                };
            }
            return {
                type: 'finance_api',
                financeApi: 'applyFeeWaiver',
                payload: {
                    application_id: input.applicationId,
                    component_id: input.componentId,
                    amount: input.waiverAmount,
                    remarks: input.remark ?? 'Fee waiver approved',
                    applicationId: input.applicationId,
                },
                remark: input.remark ?? 'Fee waiver applied',
                canExecute: true,
            };
        case 'generate_receipt':
        case 'regenerate_receipt':
            if (!input.paymentId) {
                return {
                    type: 'finance_api',
                    financeApi: 'getReceipt',
                    payload: {},
                    canExecute: false,
                    blockReason: 'Payment ID is required for receipt',
                };
            }
            return {
                type: 'finance_api',
                financeApi: 'getReceipt',
                payload: { paymentId: input.paymentId, applicationId: input.applicationId },
                remark: input.remark ?? 'Receipt retrieved',
                canExecute: true,
            };
        case 'verify_scholarship':
        case 'reject_waiver':
        case 'refund':
        case 'reverse_verification':
        case 'mark_pending':
            return {
                type: 'workflow',
                workflowAction: 'review',
                payload: {},
                remark: input.remark ?? `${action.replace(/_/g, ' ')} recorded`,
                canExecute: true,
            };
        default:
            return { type: 'workflow', payload: {}, canExecute: false, blockReason: 'Unknown action' };
    }
}

export async function executeFinanceApi(
    api: NonNullable<FinanceActionPlan['financeApi']>,
    payload: Record<string, unknown>,
) {
    switch (api) {
        case 'collectPayment':
            return admissionApi.collectPayment(payload);
        case 'verifyPayment':
            return admissionApi.verifyPayment(payload);
        case 'applyFeeWaiver':
            return admissionApi.applyFeeWaiver(payload);
        case 'getReceipt':
            return admissionApi.getReceipt(String(payload.paymentId));
        case 'assignFeeStructure':
            return admissionApi.assignFeeStructure(payload);
    }
}

export function financeActionLabel(action: FinanceAction): string {
    const labels: Record<FinanceAction, string> = {
        assign_fee_structure: 'Assign Fee Structure',
        verify_payment: 'Verify Payment',
        approve_payment: 'Approve Payment',
        reject_payment: 'Reject Payment',
        collect_payment: 'Collect Payment',
        submit_payment: 'Submit Payment Proof',
        initiate_payment: 'Initiate Payment',
        generate_receipt: 'Generate Receipt',
        regenerate_receipt: 'Regenerate Receipt',
        verify_scholarship: 'Verify Scholarship',
        approve_waiver: 'Approve Waiver',
        reject_waiver: 'Reject Waiver',
        apply_waiver: 'Apply Waiver',
        refund: 'Refund',
        reverse_verification: 'Reverse Verification',
        mark_pending: 'Mark Pending',
    };
    return labels[action];
}
