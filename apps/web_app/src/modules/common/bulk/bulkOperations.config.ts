import type { WorkspaceModule } from '../types';

export interface BulkOperationConfig {
    id: string;
    label: string;
    module: WorkspaceModule;
    description?: string;
    confirmMessage?: string;
    /** Maps to existing API endpoint path — no new APIs */
    endpoint: string;
    method?: 'POST' | 'PUT' | 'PATCH';
    payloadKey?: string;
}

export const BULK_OPERATIONS: BulkOperationConfig[] = [
    // Admissions
    {
        id: 'admissions-verify-docs',
        label: 'Verify Documents',
        module: 'admissions',
        endpoint: '/v1/admission/application/documents/verify/bulk',
        confirmMessage: 'Verify documents for selected applications?',
    },
    {
        id: 'admissions-assign-counselor',
        label: 'Assign Counselor',
        module: 'admissions',
        endpoint: '/v1/admission/crm/leads/bulk/assign',
    },
    {
        id: 'admissions-approve',
        label: 'Approve',
        module: 'admissions',
        endpoint: '/v1/admission/application/bulk/approve',
        confirmMessage: 'Approve selected applications?',
    },
    // Students
    {
        id: 'students-promote',
        label: 'Promote',
        module: 'students',
        endpoint: '/students/bulk/promote',
    },
    {
        id: 'students-transfer',
        label: 'Transfer',
        module: 'students',
        endpoint: '/students/bulk/transfer',
    },
    {
        id: 'students-archive',
        label: 'Archive',
        module: 'students',
        endpoint: '/students/bulk/archive',
        confirmMessage: 'Archive selected students?',
    },
    // Faculty
    {
        id: 'faculty-assign-dept',
        label: 'Assign Department',
        module: 'faculty',
        endpoint: '/faculty/bulk/assign-department',
    },
    // Finance
    {
        id: 'finance-verify-receipts',
        label: 'Verify Receipts',
        module: 'finance',
        endpoint: '/fees/bulk/verify-receipts',
    },
    {
        id: 'finance-approve-scholarships',
        label: 'Approve Scholarships',
        module: 'finance',
        endpoint: '/fees/bulk/approve-scholarships',
    },
    // Attendance
    {
        id: 'attendance-lock',
        label: 'Lock',
        module: 'attendance',
        endpoint: '/attendance/bulk/lock',
    },
    {
        id: 'attendance-unlock',
        label: 'Unlock',
        module: 'attendance',
        endpoint: '/attendance/bulk/unlock',
    },
    {
        id: 'attendance-publish',
        label: 'Publish',
        module: 'attendance',
        endpoint: '/attendance/bulk/publish',
    },
];

export function getBulkOperationsForModule(module: WorkspaceModule): BulkOperationConfig[] {
    return BULK_OPERATIONS.filter(op => op.module === module);
}
