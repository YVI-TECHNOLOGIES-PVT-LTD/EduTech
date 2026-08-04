import type { Followup } from '../types/admission.types';
import { normalizeApiList } from './lead.mapper';

export function normalizeFollowup(raw: Record<string, unknown>): Followup {
    return {
        id: String(raw.id ?? ''),
        lead_id: (raw.lead_id ?? raw.leadId) as string | undefined,
        enquiry_id: (raw.enquiry_id ?? raw.enquiryId) as string | undefined,
        scheduled_at: (raw.scheduled_at ?? raw.scheduledAt) as string | undefined,
        due_date: (raw.due_date ?? raw.dueDate ?? raw.due_at) as string | undefined,
        due_at: (raw.due_at ?? raw.dueAt) as string | undefined,
        remarks: (raw.remarks ?? raw.notes ?? raw.description) as string | undefined,
        status: (raw.status ?? 'pending') as Followup['status'],
        assigned_to: (raw.assigned_to ?? raw.assignedTo ?? raw.staff_name) as string | undefined,
        assigned_staff: (raw.assigned_staff ?? raw.assignedStaff) as string | undefined,
        completed_at: (raw.completed_at ?? raw.completedAt) as string | undefined,
    };
}

export function mapFollowups(data: unknown): Followup[] {
    return normalizeApiList<Record<string, unknown>>(data).map(normalizeFollowup);
}

function startOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function endOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
}

function getDueDate(f: Followup): Date | null {
    const raw = f.scheduled_at ?? f.due_date ?? f.due_at;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
}

export type FollowupBucket = 'today' | 'tomorrow' | 'upcoming' | 'missed' | 'completed';

export function categorizeFollowups(followups: Followup[]): Record<FollowupBucket, Followup[]> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tomorrowStart = startOfDay(new Date(now.getTime() + 86400000));
    const tomorrowEnd = endOfDay(new Date(now.getTime() + 86400000));

    const buckets: Record<FollowupBucket, Followup[]> = {
        today: [],
        tomorrow: [],
        upcoming: [],
        missed: [],
        completed: [],
    };

    for (const f of followups) {
        if (String(f.status ?? '').toLowerCase() === 'completed') {
            buckets.completed.push(f);
            continue;
        }

        const due = getDueDate(f);
        if (!due) {
            buckets.upcoming.push(f);
            continue;
        }

        if (due < todayStart && String(f.status ?? '').toLowerCase() !== 'completed') {
            buckets.missed.push(f);
        } else if (due >= todayStart && due <= todayEnd) {
            buckets.today.push(f);
        } else if (due >= tomorrowStart && due <= tomorrowEnd) {
            buckets.tomorrow.push(f);
        } else if (due > tomorrowEnd) {
            buckets.upcoming.push(f);
        }
    }

    return buckets;
}

export function getTodayFollowupLeadIds(followups: Followup[]): Set<string> {
    const buckets = categorizeFollowups(followups);
    const ids = new Set<string>();
    [...buckets.today, ...buckets.missed].forEach(f => {
        if (f.lead_id) ids.add(f.lead_id);
        if (f.enquiry_id) ids.add(f.enquiry_id);
    });
    return ids;
}
