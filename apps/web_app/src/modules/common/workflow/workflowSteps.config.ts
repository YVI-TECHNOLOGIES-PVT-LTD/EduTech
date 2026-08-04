import type { WorkflowStep } from '../types';

export const ADMISSION_WORKFLOW: WorkflowStep[] = [
    { id: 'admission', label: 'Admission', description: 'Review application', route: '/app/admissions/review' },
    { id: 'create-student', label: 'Create Student', description: 'Enrol approved applicant', apiAction: 'enrol' },
    { id: 'generate-id', label: 'Generate ID', description: 'Issue student ID card', route: '/app/students' },
    { id: 'generate-fee', label: 'Generate Fee', description: 'Assign fee structure', route: '/app/fees/assignment' },
    { id: 'notify-parent', label: 'Notify Parent', description: 'Send enrolment confirmation', apiAction: 'notify' },
];

export const WORKFLOW_REGISTRY: Record<string, WorkflowStep[]> = {
    admission: ADMISSION_WORKFLOW,
};

export function getWorkflowSteps(workflowId: string): WorkflowStep[] {
    return WORKFLOW_REGISTRY[workflowId] || [];
}
