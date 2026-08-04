import { useState, useEffect } from 'react';
import { UserCheck, UserMinus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { useLeadAssignment } from '../../hooks/useLeadAssignment';
import { useAdmissionMasterData } from '../../context/AdmissionMasterDataContext';
import { parseAdmissionApiError } from '../../utils/admissionError.utils';
import type { Lead } from '../../types/admission.types';

interface LeadAssignmentProps {
    lead: Lead;
    counselorId?: string;
    counselorName?: string;
    onAssigned?: () => void;
}

export function LeadAssignment({ lead, counselorId, counselorName, onAssigned }: LeadAssignmentProps) {
    const { assign, reassign, unassign, changeCounselor, isAssigning } = useLeadAssignment();
    const { counselors } = useAdmissionMasterData();
    
    // Default to the current assigned counselor or the passed counselorId
    const currentCounselorId = lead.assigned_counselor_id || lead.counselor || counselorId || '';
    const [selectedCounselorId, setSelectedCounselorId] = useState(currentCounselorId);

    // Sync state if lead changes
    useEffect(() => {
        setSelectedCounselorId(lead.assigned_counselor_id || lead.counselor || counselorId || '');
    }, [lead, counselorId]);

    const isAssigned = !!(lead.assigned_counselor ?? lead.assigned_counselor_id);

    const handleAssign = async () => {
        if (!selectedCounselorId || isAssigning) return;
        try {
            if (isAssigned) {
                await changeCounselor(lead.id, selectedCounselorId);
            } else {
                await assign(lead.id, selectedCounselorId);
            }
            onAssigned?.();
        } catch (e) {
            toast.error(parseAdmissionApiError(e).message);
        }
    };

    const handleUnassign = async () => {
        if (isAssigning) return;
        try {
            await unassign(lead.id);
            setSelectedCounselorId('');
            onAssigned?.();
        } catch (e) {
            toast.error(parseAdmissionApiError(e).message);
        }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-gray-500">
                {isAssigned ? lead.assigned_counselor ?? counselorName ?? 'Assigned' : 'Unassigned'}
            </span>

            <select
                value={selectedCounselorId}
                onChange={e => setSelectedCounselorId(e.target.value)}
                disabled={isAssigning || counselors.length === 0}
                className="bg-white dark:bg-card border border-gray-200 dark:border-gray-800 rounded-xl px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700 dark:text-gray-300"
            >
                {counselors.length === 0 ? (
                    <option value="">No active counselors available</option>
                ) : (
                    <>
                        <option value="">Select Counselor</option>
                        {counselors.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.full_name}
                            </option>
                        ))}
                    </>
                )}
            </select>

            {selectedCounselorId && (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] gap-1"
                    onClick={handleAssign}
                    disabled={isAssigning}
                >
                    {isAssigned ? (
                        <><RefreshCw className="w-3 h-3" /> Reassign</>
                    ) : (
                        <><UserCheck className="w-3 h-3" /> Assign</>
                    )}
                </Button>
            )}

            {isAssigned && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] gap-1 text-red-600"
                    onClick={handleUnassign}
                    disabled={isAssigning}
                >
                    <UserMinus className="w-3 h-3" /> Unassign
                </Button>
            )}
        </div>
    );
}

export default LeadAssignment;
