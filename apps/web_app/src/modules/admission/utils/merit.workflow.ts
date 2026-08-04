import { admissionApi } from '../admission.api';
import type { WorkflowActionType } from '../hooks/useWorkflow';

export type MeritAction =
    | 'generate_merit'
    | 'approve_merit'
    | 'publish_merit'
    | 'move_waitlist'
    | 'reject'
    | 'allocate_seat'
    | 'freeze_rank';

import type { Admission } from '../types/admission.types';

export interface MeritActionPayload {
    applicationId?: string;
    schoolId?: string;
    academicYearId?: string;
    intakeLimit?: number;
    remark?: string;
    applications?: Admission[];
}

export interface MeritActionPlan {
    type: 'merit_api' | 'workflow';
    meritApi?: 'generateMeritList';
    workflowAction?: WorkflowActionType;
    payload: Record<string, unknown>;
    remark?: string;
    canExecute: boolean;
    blockReason?: string;
}

export function planMeritAction(action: MeritAction, input: MeritActionPayload): MeritActionPlan {
    switch (action) {
        case 'generate_merit':
            return {
                type: 'merit_api',
                meritApi: 'generateMeritList',
                payload: {
                    school_id: input.schoolId,
                    academic_year_id: input.academicYearId,
                    intake_limit: input.intakeLimit ?? 20,
                },
                remark: input.remark ?? 'Merit list generated',
                canExecute: true,
            };
        case 'approve_merit':
            return {
                type: 'workflow',
                workflowAction: 'approve',
                payload: {},
                remark: input.remark ?? 'Merit list approved by authority',
                canExecute: !!input.applicationId,
                blockReason: 'Application ID required',
            };
        case 'publish_merit':
            return {
                type: 'workflow',
                workflowAction: 'recommend',
                payload: {},
                remark: input.remark ?? 'Merit rank published',
                canExecute: !!input.applicationId,
                blockReason: 'Application ID required',
            };
        case 'allocate_seat':
            return {
                type: 'workflow',
                workflowAction: 'approve',
                payload: {},
                remark: input.remark ?? 'Seat allocated to candidate',
                canExecute: !!input.applicationId,
                blockReason: 'Application ID required',
            };
        case 'move_waitlist':
            return {
                type: 'workflow',
                workflowAction: 'review',
                payload: {},
                remark: input.remark ?? 'Candidate moved on waitlist',
                canExecute: !!input.applicationId,
                blockReason: 'Application ID required',
            };
        case 'freeze_rank':
            return {
                type: 'workflow',
                workflowAction: 'review',
                payload: {},
                remark: input.remark ?? 'Merit rank frozen',
                canExecute: !!input.applicationId,
                blockReason: 'Application ID required',
            };
        case 'reject':
            return {
                type: 'workflow',
                workflowAction: 'reject',
                payload: {},
                remark: input.remark ?? 'Candidate rejected from merit list',
                canExecute: !!input.applicationId,
                blockReason: 'Application ID required',
            };
        default:
            return { type: 'workflow', payload: {}, canExecute: false, blockReason: 'Unknown action' };
    }
}

export async function executeMeritApi(payload: Record<string, unknown>) {
    return admissionApi.generateMeritList(payload);
}

export function meritActionLabel(action: MeritAction): string {
    const labels: Record<MeritAction, string> = {
        generate_merit: 'Generate Merit',
        approve_merit: 'Approve Merit',
        publish_merit: 'Publish Merit',
        move_waitlist: 'Move Waitlist',
        reject: 'Reject',
        allocate_seat: 'Allocate Seat',
        freeze_rank: 'Freeze Rank',
    };
    return labels[action];
}
