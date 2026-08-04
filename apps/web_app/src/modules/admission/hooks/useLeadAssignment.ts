import { useMutation, useQueryClient } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_EVENTS } from '../core/AdmissionEngine';

function dispatchAssignmentEvents(queryClient: ReturnType<typeof useQueryClient>, leadId: string) {
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.COUNSELOR_ASSIGNED, { leadId });
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.LEAD_ASSIGNED, { leadId });
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
    AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
}

export function useLeadAssignment() {
    const queryClient = useQueryClient();

    const assignMutation = useMutation({
        mutationFn: ({ id, counselorId, strategy, reassign }: { id: string; counselorId?: string; strategy?: string; reassign?: boolean }) =>
            admissionApi.assignLead(id, counselorId, strategy, reassign),
        onSuccess: (_, variables) => {
            dispatchAssignmentEvents(queryClient, variables.id);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
            admissionApi.updateLead(id, data),
        onSuccess: (_, variables) => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.INQUIRY_UPDATED, {
                inquiryId: variables.id,
            });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
        },
    });

    return {
        assign: (id: string, counselorId?: string, strategy?: string) => assignMutation.mutateAsync({ id, counselorId, strategy, reassign: false }),
        reassign: (id: string, counselorId: string) => assignMutation.mutateAsync({ id, counselorId, reassign: true }),
        unassign: (id: string) =>
            updateMutation.mutateAsync({
                id,
                data: { assigned_counselor_id: null, counselor_id: null, assigned_counselor: null },
            }),
        changeCounselor: (id: string, counselorId: string) =>
            assignMutation.mutateAsync({ id, counselorId, reassign: true }),
        isAssigning: assignMutation.isPending,
        isUpdating: updateMutation.isPending,
        error: assignMutation.error ?? updateMutation.error,
    };
}

/** Backward-compatible alias */
export function useAssignLead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, counselorId, strategy, reassign }: { id: string; counselorId?: string; strategy?: string; reassign?: boolean }) =>
            admissionApi.assignLead(id, counselorId, strategy, reassign),
        onSuccess: (_, variables) => {
            dispatchAssignmentEvents(queryClient, variables.id);
        },
    });
}
