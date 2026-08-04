import { admissionApi } from '../admission.api';
import type { WorkflowActionType } from '../hooks/useWorkflow';

export type InterviewAction =
    | 'assign_panel'
    | 'start_interview'
    | 'mark_present'
    | 'mark_absent'
    | 'save_remarks'
    | 'recommend'
    | 'reject'
    | 'complete_interview';

export interface InterviewScoreInput {
    criterion_id: string;
    score: number;
    remarks?: string;
}

export interface InterviewActionPayload {
    applicationId: string;
    interviewId?: string;
    panelId?: string;
    interviewDate?: string;
    roomName?: string;
    remark?: string;
    scores?: InterviewScoreInput[];
}

export interface InterviewActionPlan {
    type: 'interview_api' | 'workflow';
    interviewApi?: 'scheduleInterview' | 'recordInterviewScore';
    workflowAction?: WorkflowActionType;
    payload: Record<string, unknown>;
    remark?: string;
    canExecute: boolean;
    blockReason?: string;
}

export function planInterviewAction(action: InterviewAction, input: InterviewActionPayload): InterviewActionPlan {
    switch (action) {
        case 'assign_panel':
            if (!input.panelId || !input.interviewDate || !input.roomName) {
                return {
                    type: 'interview_api',
                    interviewApi: 'scheduleInterview',
                    payload: {},
                    canExecute: false,
                    blockReason: 'Panel ID, interview date, and room are required',
                };
            }
            return {
                type: 'interview_api',
                interviewApi: 'scheduleInterview',
                payload: {
                    application_id: input.applicationId,
                    panel_id: input.panelId,
                    interview_date: input.interviewDate,
                    room_name: input.roomName,
                },
                remark: input.remark ?? 'Interview panel assigned',
                canExecute: true,
            };
        case 'complete_interview':
            if (!input.interviewId || !input.scores?.length) {
                return {
                    type: 'interview_api',
                    interviewApi: 'recordInterviewScore',
                    payload: {},
                    canExecute: false,
                    blockReason: 'Interview ID and criterion scores are required',
                };
            }
            return {
                type: 'interview_api',
                interviewApi: 'recordInterviewScore',
                payload: {
                    interview_id: input.interviewId,
                    scores: input.scores,
                    applicationId: input.applicationId,
                },
                remark: input.remark ?? 'Interview evaluation completed',
                canExecute: true,
            };
        case 'start_interview':
            return {
                type: 'workflow',
                workflowAction: 'review',
                payload: {},
                remark: input.remark ?? 'Interview session started',
                canExecute: true,
            };
        case 'mark_present':
            return {
                type: 'workflow',
                workflowAction: 'review',
                payload: {},
                remark: input.remark ?? 'Candidate marked present for interview',
                canExecute: true,
            };
        case 'mark_absent':
            return {
                type: 'workflow',
                workflowAction: 'review',
                payload: {},
                remark: input.remark ?? 'Candidate marked absent for interview',
                canExecute: true,
            };
        case 'save_remarks':
            return {
                type: 'workflow',
                workflowAction: 'review',
                payload: {},
                remark: input.remark ?? 'Interview panel remarks saved',
                canExecute: !!input.remark?.trim(),
                blockReason: 'Remarks are required',
            };
        case 'recommend':
            return {
                type: 'workflow',
                workflowAction: 'recommend',
                payload: {},
                remark: input.remark ?? 'Candidate recommended after interview',
                canExecute: true,
            };
        case 'reject':
            return {
                type: 'workflow',
                workflowAction: 'reject',
                payload: {},
                remark: input.remark ?? 'Candidate rejected after interview',
                canExecute: true,
            };
        default:
            return { type: 'workflow', payload: {}, canExecute: false, blockReason: 'Unknown action' };
    }
}

export async function executeInterviewApi(
    api: 'scheduleInterview' | 'recordInterviewScore',
    payload: Record<string, unknown>,
) {
    if (api === 'scheduleInterview') {
        return admissionApi.scheduleInterview(payload);
    }
    return admissionApi.recordInterviewScore(payload);
}

export function interviewActionLabel(action: InterviewAction): string {
    const labels: Record<InterviewAction, string> = {
        assign_panel: 'Assign Panel',
        start_interview: 'Start Interview',
        mark_present: 'Mark Present',
        mark_absent: 'Mark Absent',
        save_remarks: 'Save Remarks',
        recommend: 'Recommend',
        reject: 'Reject',
        complete_interview: 'Complete Interview',
    };
    return labels[action];
}
