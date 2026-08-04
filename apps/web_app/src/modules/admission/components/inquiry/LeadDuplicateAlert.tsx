import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import type { DuplicateMatch } from '../../types/admission.types';

interface LeadDuplicateAlertProps {
    matches: DuplicateMatch[];
    onOpenExisting?: (id: string) => void;
}

export function LeadDuplicateAlert({ matches, onOpenExisting }: LeadDuplicateAlertProps) {
    if (!matches.length) return null;

    const top = matches[0];

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
            <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-amber-800 uppercase">Possible Duplicate</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                        Matches on: {top.matchFields.join(', ')} — {top.student_name}
                        {top.parent_name ? ` (${top.parent_name})` : ''}
                    </p>
                    {matches.length > 1 && (
                        <p className="text-[10px] text-amber-600 mt-1">
                            +{matches.length - 1} more possible match{matches.length > 2 ? 'es' : ''}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] gap-1 border-amber-300"
                    onClick={() => onOpenExisting?.(top.id)}
                >
                    <ExternalLink className="w-3 h-3" /> Open Existing
                </Button>
                <span className="text-[9px] text-amber-600 self-center font-medium">
                    Merge suggestion — review manually, never auto-merge
                </span>
            </div>
        </div>
    );
}

export default LeadDuplicateAlert;
