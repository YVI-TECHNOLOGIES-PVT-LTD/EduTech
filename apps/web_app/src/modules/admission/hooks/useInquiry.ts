import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_EVENTS, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';

export function useInquiries(params?: Record<string, unknown>, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: AdmissionEngine.cacheKeys.inquiry.lists(params),
        queryFn: () => admissionApi.getEnquiries(params).then(res => res.data),
        enabled: options?.enabled ?? true,
        staleTime: ADMISSION_STALE_TIME,
        ...options,
    });
}

export function useEnquiryDetails(id: string) {
    return useQuery({
        queryKey: AdmissionEngine.cacheKeys.inquiry.detail(id),
        queryFn: () => admissionApi.getEnquiryById(id).then(res => res.data),
        enabled: !!id,
        staleTime: ADMISSION_STALE_TIME,
    });
}

export function useCreateEnquiry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: admissionApi.createEnquiry,
        onSuccess: () => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.INQUIRY_CREATED);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
        },
    });
}

export function useUpdateEnquiry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
            admissionApi.updateEnquiry(id, data),
        onSuccess: (_, variables) => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.INQUIRY_UPDATED, {
                inquiryId: variables.id,
            });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
        },
    });
}

export function useConvertEnquiry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (enquiryId: string) => {
            const res = await admissionApi.convertEnquiry(enquiryId);
            return res.data as { lead_id: string; application_id: string };
        },
        onSuccess: (data, enquiryId) => {
            const payload = {
                inquiryId: enquiryId,
                leadId: data.lead_id,
                applicationId: data.application_id,
            };
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.INQUIRY_CONVERTED, payload);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_CREATED, payload);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_UPDATED, payload);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.APPLICATION_LIST_CHANGED);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            if (data.application_id) {
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, {
                    applicationId: data.application_id,
                });
            }
        },
    });
}

export { useLeads, useLeadsQuery } from './useLeads';
export { useAssignLead } from './useLeadAssignment';
export {
    useFollowups,
    useCreateFollowup,
    useUpdateFollowup,
    useCompleteFollowup,
} from './useFollowups';

export function useLeadDetails(id: string) {
    return useQuery({
        queryKey: AdmissionEngine.cacheKeys.lead.detail(id),
        queryFn: () => admissionApi.getLeadById(id).then(res => res.data),
        enabled: !!id,
        staleTime: ADMISSION_STALE_TIME,
    });
}

export function useVisitors(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: AdmissionEngine.cacheKeys.visitors(params),
        queryFn: () => admissionApi.getVisitors(params).then(res => res.data),
        staleTime: ADMISSION_STALE_TIME,
    });
}

export function useCreateVisitor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: admissionApi.createVisitor,
        onSuccess: () => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.INQUIRY_CREATED);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
        },
    });
}

/** Alias for registry naming */
export const useInquiry = useInquiries;
