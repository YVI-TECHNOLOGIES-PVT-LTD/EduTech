import type { Lead, LeadScore, LeadScoreTier } from '../types/admission.types';

function tierFromScore(score: number): LeadScoreTier {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'hot';
    if (score >= 35) return 'warm';
    return 'cold';
}

export function calculateLeadScore(
    lead: Lead,
    followups: Record<string, unknown>[] = [],
): LeadScore {
    const factors: { label: string; points: number }[] = [];
    let score = 0;

    const leadFollowups = followups.filter(
        f => String(f.enquiry_id ?? f.lead_id) === lead.id,
    );

    const recentFollowup = leadFollowups.find(f => {
        const ts = String(f.scheduled_at ?? f.due_date ?? f.completed_at ?? '');
        if (!ts) return false;
        const days = (Date.now() - new Date(ts).getTime()) / 86400000;
        return days <= 7 && String(f.status ?? '').toLowerCase() === 'completed';
    });
    if (recentFollowup) {
        factors.push({ label: 'Recent follow-up', points: 20 });
        score += 20;
    }

    if (lead.created_at && lead.updated_at && lead.updated_at !== lead.created_at) {
        const responseHrs = (new Date(lead.updated_at).getTime() - new Date(lead.created_at).getTime()) / 3600000;
        if (responseHrs <= 24) {
            factors.push({ label: 'Fast response time', points: 15 });
            score += 15;
        } else if (responseHrs <= 72) {
            factors.push({ label: 'Good response time', points: 8 });
            score += 8;
        }
    }

    const docCount = lead.document_count ?? 0;
    if (docCount > 0) {
        const pts = Math.min(docCount * 10, 20);
        factors.push({ label: 'Documents submitted', points: pts });
        score += pts;
    }

    if (lead.application_id && !isConvertedStatus(lead.status)) {
        factors.push({ label: 'Application started', points: 25 });
        score += 25;
    }

    if (isConvertedStatus(lead.status)) {
        factors.push({ label: 'Application submitted', points: 30 });
        score += 30;
    }

    if (isAssigned(lead)) {
        factors.push({ label: 'Counselor assigned', points: 10 });
        score += 10;
    }

    score = Math.min(score, 100);
    return { tier: tierFromScore(score), score, factors };
}

function isConvertedStatus(status?: string): boolean {
    const s = (status ?? '').toLowerCase();
    return s.includes('convert') || s === 'application_created';
}

function isAssigned(lead: Lead): boolean {
    const counselor = lead.assigned_counselor ?? lead.assigned_counselor_id;
    return !!counselor && counselor !== 'Unassigned';
}

export function scoreTierColor(tier: LeadScoreTier): string {
    switch (tier) {
        case 'excellent':
            return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        case 'hot':
            return 'bg-orange-50 text-orange-600 border-orange-100';
        case 'warm':
            return 'bg-blue-50 text-blue-600 border-blue-100';
        default:
            return 'bg-gray-100 text-gray-600 border-gray-200';
    }
}

export function scoreTierLabel(tier: LeadScoreTier): string {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
}
