import type { LeadScoreTier } from '../../types/admission.types';
import { scoreTierColor, scoreTierLabel } from '../../utils/lead.score';

interface LeadPriorityBadgeProps {
    tier?: LeadScoreTier;
    score?: number;
    className?: string;
}

export function LeadPriorityBadge({ tier = 'cold', score, className = '' }: LeadPriorityBadgeProps) {
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${scoreTierColor(tier)} ${className}`}
        >
            {scoreTierLabel(tier)}
            {score !== undefined && <span className="opacity-70">({score})</span>}
        </span>
    );
}

export default LeadPriorityBadge;
