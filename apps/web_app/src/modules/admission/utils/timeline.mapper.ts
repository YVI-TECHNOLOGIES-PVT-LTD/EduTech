import type { AdmissionAuditLog, AdmissionTimelineEntry } from '../types';

export function mapAuditLogToTimeline(log: AdmissionAuditLog): AdmissionTimelineEntry {
    return {
        id: log.id,
        action: log.action,
        actor: log.users?.full_name,
        operator_name: log.users?.full_name,
        remarks: log.remarks,
        timestamp: log.created_at,
    };
}

export function mapAuditLogs(logs?: AdmissionAuditLog[]): AdmissionTimelineEntry[] {
    return (logs ?? []).map(mapAuditLogToTimeline);
}

export function mapTimelineApiResponse(data: unknown): AdmissionTimelineEntry[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as AdmissionTimelineEntry[];
    const obj = data as { entries?: AdmissionTimelineEntry[]; timeline?: AdmissionTimelineEntry[] };
    return obj.entries ?? obj.timeline ?? [];
}
