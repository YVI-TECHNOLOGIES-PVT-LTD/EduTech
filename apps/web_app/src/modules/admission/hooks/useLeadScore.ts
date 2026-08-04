import { useMemo } from 'react';
import { calculateLeadScore } from '../utils/lead.score';
import type { Lead, LeadScore } from '../types/admission.types';

export function useLeadScore(lead?: Lead | null, followups?: Record<string, unknown>[]) {
    const score: LeadScore | null = useMemo(() => {
        if (!lead) return null;
        return calculateLeadScore(lead, followups ?? []);
    }, [lead, followups]);

    return score;
}

export function useLeadScores(leads: Lead[], followups?: Record<string, unknown>[]) {
    return useMemo(() => {
        const map = new Map<string, LeadScore>();
        leads.forEach(lead => {
            map.set(lead.id, calculateLeadScore(lead, followups ?? []));
        });
        return map;
    }, [leads, followups]);
}

export { calculateLeadScore, scoreTierColor, scoreTierLabel } from '../utils/lead.score';
