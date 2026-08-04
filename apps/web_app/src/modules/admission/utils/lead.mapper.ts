import type {
    AdmissionInquiry,
    Lead,
    LeadMetrics,
    LeadTimelineEntry,
} from '../types/admission.types';
import { calculateLeadScore } from './lead.score';

export function normalizeApiList<T>(data: unknown): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const obj = data as Record<string, unknown>;
    const candidates = ['data', 'items', 'enquiries', 'leads', 'followups', 'visitors', 'results'];
    for (const key of candidates) {
        const val = obj[key];
        if (Array.isArray(val)) return val as T[];
    }
    return [];
}

export function normalizeInquiry(raw: Record<string, unknown>): AdmissionInquiry {
    return {
        id: String(raw.id ?? ''),
        inquiry_number: (raw.inquiry_number ?? raw.enquiry_number ?? raw.code) as string | undefined,
        student_name: String(raw.student_name ?? raw.studentName ?? ''),
        parent_name: (raw.parent_name ?? raw.parentName) as string | undefined,
        parent_email: (raw.parent_email ?? raw.email ?? raw.parentEmail) as string | undefined,
        parent_phone: (raw.parent_phone ?? raw.phone ?? raw.parentPhone) as string | undefined,
        phone: (raw.phone ?? raw.parent_phone ?? raw.parentPhone) as string | undefined,
        email: (raw.email ?? raw.parent_email ?? raw.parentEmail) as string | undefined,
        grade_applied_for: (raw.grade_applied_for ?? raw.grade ?? raw.program) as string | undefined,
        source: (raw.source ?? raw.inquiry_source) as string | undefined,
        status: (raw.status ?? 'new') as string,
        created_at: (raw.created_at ?? raw.createdAt) as string | undefined,
        updated_at: (raw.updated_at ?? raw.updatedAt) as string | undefined,
        assigned_counselor: (raw.assigned_counselor ?? raw.counselor_name ?? raw.counselor) as string | undefined,
        assigned_counselor_id: (raw.assigned_counselor_id ?? raw.counselor_id ?? raw.counselorId) as string | undefined,
        application_id: (raw.application_id ?? raw.applicationId ?? raw.admission_id) as string | undefined,
        enquiry_id: (raw.enquiry_id ?? raw.enquiryId) as string | undefined,
        lead_id: (raw.lead_id ?? raw.leadId ?? raw.id) as string | undefined,
        converted_at: (raw.converted_at ?? raw.convertedAt ?? (raw.status && (raw.status as string).toLowerCase().includes('convert') ? (raw.updated_at ?? raw.updatedAt) : undefined)) as string | undefined,
        assigned_at: (raw.assigned_at ?? raw.assignedAt ?? ((raw.assigned_counselor_id ?? raw.counselor_id ?? raw.counselorId) ? (raw.updated_at ?? raw.updatedAt) : undefined)) as string | undefined,
        assigned_by: (raw.assigned_by ?? raw.assignedBy) as string | undefined,
    };
}

export function normalizeLead(raw: Record<string, unknown>): Lead {
    const inquiry = normalizeInquiry(raw);
    return {
        ...inquiry,
        next_followup_at: (raw.next_followup_at ?? raw.nextFollowupAt ?? raw.followup_date) as string | undefined,
        communication_count: Number(raw.communication_count ?? raw.communicationCount ?? 0),
        document_count: Number(raw.document_count ?? raw.documentCount ?? 0),
    };
}

export function mapInquiries(data: unknown): AdmissionInquiry[] {
    return normalizeApiList<Record<string, unknown>>(data).map(normalizeInquiry);
}

export function mapLeads(data: unknown, followups?: unknown): Lead[] {
    const followupList = normalizeApiList<Record<string, unknown>>(followups ?? []);
    return normalizeApiList<Record<string, unknown>>(data).map(raw => {
        const lead = normalizeLead(raw);
        const score = calculateLeadScore(lead, followupList);
        return { ...lead, score: score.score, priority: score.tier };
    });
}

const WALKIN_SOURCES = ['walk-in', 'walkin', 'walk in', 'visitor', 'reception'];
const ONLINE_SOURCES = ['online', 'web', 'website', 'form', 'portal'];

export function isWalkInSource(source?: string): boolean {
    if (!source) return false;
    const s = source.toLowerCase();
    return WALKIN_SOURCES.some(v => s.includes(v));
}

export function isOnlineSource(source?: string): boolean {
    if (!source) return false;
    const s = source.toLowerCase();
    return ONLINE_SOURCES.some(v => s.includes(v)) || s.includes('online');
}

/** True only when a CRM application exists — not when enquiry status is merely 'converted' (lead created). */
export function isConverted(lead: { status?: string; application_id?: string }): boolean {
    return !!lead.application_id;
}

export function isArchived(status?: string): boolean {
    const s = (status ?? '').toLowerCase();
    return s.includes('archiv') || s.includes('cancel') || s === 'closed' || s === 'lost';
}

export function isAssigned(lead: Lead | AdmissionInquiry): boolean {
    const counselor = lead.assigned_counselor ?? lead.assigned_counselor_id;
    return !!counselor && counselor !== 'Unassigned';
}

export function isToday(dateStr?: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
}

export function computeLeadMetrics(
    inquiries: AdmissionInquiry[],
    leads: Lead[],
    followups: Record<string, unknown>[],
    visitors: Record<string, unknown>[],
    stats?: Record<string, unknown> | null,
): LeadMetrics {
    const allInquiries = inquiries.length ? inquiries : leads;
    const walkInsToday = allInquiries.filter(i => isWalkInSource(i.source) && isToday(i.created_at)).length
        || visitors.filter(v => isToday(String(v.visit_date ?? v.created_at ?? ''))).length;
    const onlineToday = allInquiries.filter(i => isOnlineSource(i.source) && isToday(i.created_at)).length;
    const assigned = allInquiries.filter(i => isAssigned(i) && !isConverted(i) && !isArchived(i.status)).length;
    const unassigned = allInquiries.filter(i => !isAssigned(i) && !isConverted(i) && !isArchived(i.status)).length;
    const converted = allInquiries.filter(i => isConverted(i)).length;
    const pending = allInquiries.filter(i => !isConverted(i) && !isArchived(i.status)).length;
    const total = allInquiries.length || 1;
    const conversionRate = Math.round((converted / total) * 100);
    const applicationsSubmitted = allInquiries.filter(i => i.application_id).length;

    const responseTimes: number[] = [];
    allInquiries.forEach(i => {
        if (i.created_at && i.updated_at && i.updated_at !== i.created_at) {
            const hrs = (new Date(i.updated_at).getTime() - new Date(i.created_at).getTime()) / 3600000;
            if (hrs >= 0) responseTimes.push(hrs);
        }
    });
    const avgResponseHours = responseTimes.length
        ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
        : 0;

    const followupHours: number[] = followups
        .filter(f => f.completed_at && f.created_at)
        .map(f => (new Date(String(f.completed_at)).getTime() - new Date(String(f.created_at)).getTime()) / 3600000)
        .filter(h => h >= 0);
    const avgFollowUpHours = followupHours.length
        ? Math.round((followupHours.reduce((a, b) => a + b, 0) / followupHours.length) * 10) / 10
        : 0;

    const todayFollowups = followups.filter(f => {
        const due = String(f.scheduled_at ?? f.due_date ?? f.due_at ?? '');
        return isToday(due) && String(f.status ?? '').toLowerCase() !== 'completed';
    }).length;

    const overdueFollowups = followups.filter(f => {
        const due = new Date(String(f.scheduled_at ?? f.due_date ?? f.due_at ?? ''));
        return due < new Date() && String(f.status ?? '').toLowerCase() !== 'completed';
    }).length;

    const todayVisitors = visitors.filter(v => isToday(String(v.visit_date ?? v.created_at ?? ''))).length;

    const statsObj = stats ?? {};
    return {
        walkInsToday: Number(statsObj.walk_ins_today ?? statsObj.walkInsToday ?? walkInsToday),
        onlineToday: Number(statsObj.online_today ?? statsObj.onlineToday ?? onlineToday),
        assigned: Number(statsObj.assigned ?? assigned),
        unassigned: Number(statsObj.unassigned ?? unassigned),
        pending: Number(statsObj.pending ?? pending),
        converted: Number(statsObj.converted ?? converted),
        conversionRate: Number(statsObj.conversion_rate ?? statsObj.conversionRate ?? conversionRate),
        avgFollowUpHours: Number(statsObj.avg_followup_hours ?? avgFollowUpHours),
        avgResponseHours: Number(statsObj.avg_response_hours ?? avgResponseHours),
        applicationsSubmitted: Number(statsObj.applications ?? statsObj.applicationsSubmitted ?? applicationsSubmitted),
        todayFollowups: Number(statsObj.today_followups ?? todayFollowups),
        overdueFollowups: Number(statsObj.overdue_followups ?? overdueFollowups),
        todayVisitors: Number(statsObj.today_visitors ?? todayVisitors),
    };
}

export function buildInquiryTimeline(
    inquiry: AdmissionInquiry | Lead,
    followups: Record<string, unknown>[],
    apiTimeline?: LeadTimelineEntry[],
): LeadTimelineEntry[] {
    const entries: LeadTimelineEntry[] = [];

    if (inquiry.created_at) {
        entries.push({
            id: `${inquiry.id}-created`,
            action: 'Inquiry Created',
            timestamp: inquiry.created_at,
            remarks: inquiry.source ? `Source: ${inquiry.source}` : undefined,
        });
    }

    if (isAssigned(inquiry)) {
        entries.push({
            id: `${inquiry.id}-assigned`,
            action: 'Counselor Assigned',
            timestamp: inquiry.assigned_at ?? inquiry.updated_at ?? inquiry.created_at ?? new Date().toISOString(),
            actor: inquiry.assigned_counselor,
        });
    }

    followups
        .filter(f => String(f.enquiry_id ?? f.lead_id) === inquiry.id || String(f.enquiry_id ?? f.lead_id) === inquiry.enquiry_id)
        .forEach(f => {
            const action = String(f.status ?? '').toLowerCase() === 'completed' ? 'Follow-up Completed' : 'Follow-up Scheduled';
            entries.push({
                id: String(f.id),
                action,
                timestamp: String(f.scheduled_at ?? f.due_date ?? f.created_at ?? ''),
                actor: String(f.assigned_to ?? f.assigned_staff ?? ''),
                remarks: String(f.remarks ?? ''),
            });
        });

    if (inquiry.lead_id && !inquiry.application_id) {
        entries.push({
            id: `${inquiry.id}-lead-created`,
            action: 'Lead Created',
            timestamp: inquiry.updated_at ?? inquiry.created_at ?? new Date().toISOString(),
        });
    }

    if (inquiry.application_id) {
        entries.push({
            id: `${inquiry.id}-converted`,
            action: 'Lead Converted',
            timestamp: inquiry.converted_at ?? inquiry.updated_at ?? inquiry.created_at ?? new Date().toISOString(),
        });
        entries.push({
            id: `${inquiry.id}-application`,
            action: 'Application Created',
            timestamp: inquiry.updated_at ?? inquiry.created_at ?? new Date().toISOString(),
        });
    }

    if (apiTimeline?.length) {
        apiTimeline.forEach(entry => {
            entries.push({
                ...entry,
                action: entry.action === 'INITIALIZE_DRAFT' ? 'Application Created' : (entry.action ?? 'Status Updated'),
            });
        });
    }

    if (isArchived(inquiry.status)) {
        entries.push({
            id: `${inquiry.id}-cancelled`,
            action: 'Cancelled',
            timestamp: inquiry.updated_at ?? inquiry.created_at ?? new Date().toISOString(),
        });
    }

    // Deduplicate by action+timestamp to ensure each event appears exactly once
    const seen = new Set<string>();
    const deduped = entries.filter(entry => {
        const key = `${entry.action}:${entry.timestamp}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return deduped.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
}

export type WorkspaceSection =
    | 'walkins'
    | 'online'
    | 'assigned'
    | 'unassigned'
    | 'followups'
    | 'converted'
    | 'archived';

/** Merge inquiry and lead lists without duplicate cards (keyed by enquiry_id). */
export function mergeInquiriesAndLeads(inquiries: AdmissionInquiry[], leads: Lead[]): AdmissionInquiry[] {
    const merged = new Map<string, AdmissionInquiry>();
    inquiries.forEach(i => merged.set(i.enquiry_id || i.id, i));
    leads.forEach(l => {
        const key = l.enquiry_id || l.id;
        const existing = merged.get(key);
        if (existing) {
            merged.set(key, {
                ...existing,
                ...l,
                id: existing.id,
                enquiry_id: l.enquiry_id || existing.enquiry_id || existing.id,
                lead_id: l.lead_id || l.id,
            });
        } else {
            merged.set(key, l);
        }
    });
    return Array.from(merged.values());
}

export function filterBySection(
    section: WorkspaceSection,
    inquiries: AdmissionInquiry[],
    leads: Lead[],
    todayFollowupLeadIds: Set<string>,
): Lead[] {
    const pool = leads.length ? leads : (inquiries as Lead[]);

    switch (section) {
        case 'walkins':
            return pool.filter(i => isWalkInSource(i.source) && !isConverted(i) && !isArchived(i.status));
        case 'online':
            return pool.filter(i => isOnlineSource(i.source) && !isConverted(i) && !isArchived(i.status));
        case 'assigned':
            return pool.filter(i => isAssigned(i) && !isConverted(i) && !isArchived(i.status));
        case 'unassigned':
            return pool.filter(i => !isAssigned(i) && !isConverted(i) && !isArchived(i.status));
        case 'followups':
            return pool.filter(i => todayFollowupLeadIds.has(i.id) && !isConverted(i) && !isArchived(i.status));
        case 'converted':
            return pool.filter(i => isConverted(i));
        case 'archived':
            return pool.filter(i => isArchived(i.status));
        default:
            return pool;
    }
}

export function leadToExportRow(lead: Lead): Record<string, string> {
    return {
        'Inquiry #': lead.inquiry_number ?? lead.id,
        Student: lead.student_name,
        Parent: lead.parent_name ?? '',
        Phone: lead.phone ?? lead.parent_phone ?? '',
        Email: lead.email ?? lead.parent_email ?? '',
        Program: lead.grade_applied_for ?? '',
        Source: lead.source ?? '',
        Status: lead.status ?? '',
        Counselor: lead.assigned_counselor ?? 'Unassigned',
        Priority: lead.priority ?? '',
        Created: lead.created_at ?? '',
    };
}
