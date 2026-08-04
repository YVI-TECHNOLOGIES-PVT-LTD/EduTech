import { admissionApi } from '../admission.api';
import type { WorkflowActionType } from '../hooks/useWorkflow';

export type EvaluationAction =
    | 'publish_result'
    | 'reevaluate'
    | 'approve_result'
    | 'reject_result'
    | 'mark_absent';

export interface EvaluationActionPayload {
    applicationId: string;
    candidateId?: string;
    subjectId?: string;
    sessionId?: string;
    marksObtained?: number;
    remark?: string;
}

export interface EvaluationActionPlan {
    type: 'exam_api' | 'workflow';
    examApi?: 'recordExamMarks' | 'recordExamAttendance';
    workflowAction?: WorkflowActionType;
    payload: Record<string, unknown>;
    remark?: string;
    canExecute: boolean;
    blockReason?: string;
}

export function planEvaluationAction(
    action: EvaluationAction,
    input: EvaluationActionPayload,
): EvaluationActionPlan {
    switch (action) {
        case 'publish_result':
        case 'reevaluate':
            if (!input.candidateId || !input.subjectId || input.marksObtained === undefined) {
                return {
                    type: 'exam_api',
                    examApi: 'recordExamMarks',
                    payload: {},
                    canExecute: false,
                    blockReason: 'Candidate, subject, and marks are required',
                };
            }
            return {
                type: 'exam_api',
                examApi: 'recordExamMarks',
                payload: {
                    candidate_id: input.candidateId,
                    subject_id: input.subjectId,
                    marks_obtained: input.marksObtained,
                },
                remark: input.remark ?? 'Exam result published',
                canExecute: true,
            };
        case 'mark_absent':
            if (!input.sessionId || !input.applicationId) {
                return {
                    type: 'exam_api',
                    examApi: 'recordExamAttendance',
                    payload: {},
                    canExecute: false,
                    blockReason: 'Session and application are required',
                };
            }
            return {
                type: 'exam_api',
                examApi: 'recordExamAttendance',
                payload: {
                    session_id: input.sessionId,
                    application_id: input.applicationId,
                    attendance_status: 'ABSENT',
                    remarks: input.remark ?? 'Candidate marked absent',
                },
                canExecute: true,
            };
        case 'approve_result':
            return {
                type: 'workflow',
                workflowAction: 'recommend',
                payload: {},
                remark: input.remark ?? 'Exam result approved — recommended for next stage',
                canExecute: true,
            };
        case 'reject_result':
            return {
                type: 'workflow',
                workflowAction: 'reject',
                payload: {},
                remark: input.remark ?? 'Exam result rejected',
                canExecute: true,
            };
        default:
            return { type: 'workflow', payload: {}, canExecute: false, blockReason: 'Unknown action' };
    }
}

export async function executeEvaluationExamApi(
    api: 'recordExamMarks' | 'recordExamAttendance',
    payload: Record<string, unknown>,
) {
    if (api === 'recordExamMarks') {
        return admissionApi.recordExamMarks(payload);
    }
    return admissionApi.recordExamAttendance(payload);
}

export function evaluationActionLabel(action: EvaluationAction): string {
    const labels: Record<EvaluationAction, string> = {
        publish_result: 'Publish Result',
        reevaluate: 'Re-evaluate',
        approve_result: 'Approve Result',
        reject_result: 'Reject Result',
        mark_absent: 'Mark Absent',
    };
    return labels[action];
}
