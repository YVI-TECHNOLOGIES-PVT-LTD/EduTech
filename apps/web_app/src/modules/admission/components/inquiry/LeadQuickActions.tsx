import { Phone, ArrowRight, UserCheck, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import type { Lead } from '../../types/admission.types';

interface LeadQuickActionsProps {
    lead: Lead;
    onConvert?: (id: string) => void;
    onAssign?: (id: string) => void;
    onFollowup?: (id: string) => void;
    onCommunicate?: (lead: Lead) => void;
    isConverting?: boolean;
    isAssigning?: boolean;
    showAssign?: boolean;
}

export function LeadQuickActions({
    lead,
    onConvert,
    onAssign,
    onFollowup,
    onCommunicate,
    isConverting,
    isAssigning,
    showAssign,
}: LeadQuickActionsProps) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {onCommunicate && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] gap-1"
                    onClick={() => onCommunicate(lead)}
                >
                    <MessageSquare className="w-3 h-3" /> Contact
                </Button>
            )}
            {onFollowup && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] gap-1"
                    onClick={() => onFollowup(lead.id)}
                >
                    <Calendar className="w-3 h-3" /> Follow-up
                </Button>
            )}
            {showAssign && onAssign && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] gap-1"
                    onClick={() => onAssign(lead.id)}
                    disabled={isAssigning}
                >
                    <UserCheck className="w-3 h-3" /> Assign
                </Button>
            )}
            {onConvert && !lead.application_id && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] gap-1 text-primary"
                    onClick={() => onConvert(lead.enquiry_id || lead.id)}
                    disabled={isConverting || !lead.assigned_counselor_id}
                    title={!lead.assigned_counselor_id ? "Assign a counselor before converting this inquiry." : undefined}
                >
                    Convert <ArrowRight className="w-3 h-3" />
                </Button>
            )}
            {lead.phone || lead.parent_phone ? (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] gap-1"
                    asChild
                >
                    <a href={`tel:${lead.phone ?? lead.parent_phone}`}>
                        <Phone className="w-3 h-3" /> Call
                    </a>
                </Button>
            ) : null}
        </div>
    );
}

export default LeadQuickActions;
