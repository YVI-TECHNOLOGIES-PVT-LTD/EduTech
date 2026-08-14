import { useEffect } from 'react';
import { useGetApplicationsQuery, useGetApplicationByIdQuery } from '@/shared/api/admission.api';
import { admissionEventBus, ADMISSION_EVENTS } from '../core/AdmissionEvents';

export interface ApplicationListParams {
  status?: string;
  school_id?: string;
  page?: number;
  limit?: number;
  search?: string;
}

const LIST_REFRESH_EVENTS = [
  ADMISSION_EVENTS.APPLICATION_CREATED,
  ADMISSION_EVENTS.APPLICATION_UPDATED,
  ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
  ADMISSION_EVENTS.INQUIRY_CONVERTED,
  ADMISSION_EVENTS.COUNSELOR_ASSIGNED,
  ADMISSION_EVENTS.QUEUE_REFRESH,
  ADMISSION_EVENTS.DASHBOARD_REFRESH,
  ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
  ADMISSION_EVENTS.PAYMENT_VERIFIED,
  ADMISSION_EVENTS.OFFER_SENT,
  ADMISSION_EVENTS.DOCUMENT_VERIFIED,
] as const;

export function useApplication(id?: string, options?: { enabled?: boolean; parentOnly?: boolean }) {
  const isEnabled = Boolean(id && (options?.enabled ?? true));
  const query = useGetApplicationByIdQuery(id ?? '', { skip: !isEnabled });

  useEffect(() => {
    if (!id) return;
    const refresh = () => void query.refetch();
    const unsubs = [
      ADMISSION_EVENTS.APPLICATION_CREATED,
      ADMISSION_EVENTS.APPLICATION_UPDATED,
      ADMISSION_EVENTS.APPLICATION_REVIEWED,
      ADMISSION_EVENTS.APPLICATION_APPROVED,
      ADMISSION_EVENTS.TIMELINE_REFRESH,
      ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
      ADMISSION_EVENTS.PAYMENT_VERIFIED,
      ADMISSION_EVENTS.OFFER_SENT,
      ADMISSION_EVENTS.DOCUMENT_VERIFIED,
    ].map((event) =>
      admissionEventBus.subscribe(event, (payload) => {
        if (!payload?.applicationId || payload.applicationId === id) refresh();
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [id, query.refetch]);

  return {
    application: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useApplicationList(params?: ApplicationListParams, options?: { enabled?: boolean; mine?: boolean }) {
  const isEnabled = options?.enabled ?? true;
  const queryParams = {
    ...params,
    ...(options?.mine ? { mine: 'true' } : {}),
  };
  const query = useGetApplicationsQuery(queryParams, { skip: !isEnabled });

  useEffect(() => {
    const refresh = () => void query.refetch();
    const unsubs = LIST_REFRESH_EVENTS.map((event) => admissionEventBus.subscribe(event, refresh));
    return () => unsubs.forEach((u) => u());
  }, [query.refetch]);

  return {
    applications: (query.data ?? []) as any[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useReviewQueue(status = 'submitted', options?: { enabled?: boolean }) {
  const isEnabled = options?.enabled ?? true;
  const query = useGetApplicationsQuery({ status }, { skip: !isEnabled });

  useEffect(() => {
    const refresh = () => void query.refetch();
    const unsubs = [
      ADMISSION_EVENTS.DOCUMENT_VERIFIED,
      ADMISSION_EVENTS.APPLICATION_CREATED,
      ADMISSION_EVENTS.APPLICATION_UPDATED,
      ADMISSION_EVENTS.INQUIRY_CONVERTED,
      ADMISSION_EVENTS.QUEUE_REFRESH,
      ADMISSION_EVENTS.DASHBOARD_REFRESH,
    ].map((event) => admissionEventBus.subscribe(event, refresh));
    return () => unsubs.forEach((u) => u());
  }, [query.refetch]);

  return {
    applications: (query.data ?? []) as any[],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
