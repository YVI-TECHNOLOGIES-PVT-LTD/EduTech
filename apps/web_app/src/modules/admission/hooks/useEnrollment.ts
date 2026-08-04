import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';
import { dispatchEnrollmentEvents } from '../utils/enrollment.workflow';

export function useEnrollmentStatus(applicationId?: string) {
    const query = useQuery({
        queryKey: AdmissionEngine.cacheKeys.enrollment(applicationId ?? ''),
        queryFn: () => admissionApi.getEnrollmentStatus(applicationId!).then(res => res.data),
        enabled: !!applicationId,
        staleTime: ADMISSION_STALE_TIME,
    });

    useEffect(() => {
        if (!applicationId) return;
        const refresh = () => void query.refetch();
        const unsubs = [
            ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
            ADMISSION_EVENTS.APPLICATION_UPDATED,
        ].map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === applicationId) refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [applicationId, query.refetch]);

    return query;
}

export function useEnrollment() {
    const queryClient = useQueryClient();

    const enrollMutation = useMutation({
        mutationFn: (vars: { applicationId: string }) =>
            admissionApi.enrollStudent({ application_id: vars.applicationId }),
        onSuccess: (_, variables) => {
            dispatchEnrollmentEvents(queryClient, variables.applicationId, 'enroll');
        },
    });

    const confirmMutation = useMutation({
        mutationFn: (vars: { applicationId: string }) =>
            admissionApi.confirmAdmission({ application_id: vars.applicationId }),
        onSuccess: (_, variables) => {
            dispatchEnrollmentEvents(queryClient, variables.applicationId, 'confirm');
        },
    });

    return {
        enroll: enrollMutation.mutateAsync,
        confirm: confirmMutation.mutateAsync,
        isEnrolling: enrollMutation.isPending,
        isConfirming: confirmMutation.isPending,
    };
}

export function useEnrollStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { applicationId: string }) =>
            admissionApi.enrollStudent({ application_id: vars.applicationId }),
        onSuccess: (_, variables) => {
            dispatchEnrollmentEvents(queryClient, variables.applicationId, 'enroll');
        },
    });
}

export function useEnrollmentStatusQuery(applicationId: string) {
    return useEnrollmentStatus(applicationId);
}
