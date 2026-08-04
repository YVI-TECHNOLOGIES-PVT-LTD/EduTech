import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Lead } from '../../types/admission.types';
import { LeadAvatar } from './LeadAvatar';
import { useAuth } from '../../../../context/AuthContext';
import { LeadPriorityBadge } from './LeadPriorityBadge';
import { LeadStatusChip } from './LeadStatusChip';
import { LeadQuickActions } from './LeadQuickActions';
import { LeadTimeline } from './LeadTimeline';
import { LeadAssignment } from './LeadAssignment';
import { useLeadTimeline } from '../../hooks/useLeadTimeline';
import { CommunicationCenter } from '../../../common/communication/CommunicationCenter';

interface LeadCardProps {
    lead: Lead;
    onConvert?: (id: string) => void;
    onAssign?: (id: string) => void;
    onFollowup?: (id: string) => void;
    counselorId?: string;
    showAssign?: boolean;
    isConverting?: boolean;
    isAssigning?: boolean;
    defaultExpanded?: boolean;
}

export function LeadCard({
    lead,
    onConvert,
    onAssign,
    onFollowup,
    counselorId,
    showAssign,
    isConverting,
    isAssigning,
    defaultExpanded = false,
}: LeadCardProps) {
    const { hasPermission } = useAuth();
    const [expanded, setExpanded] = useState(defaultExpanded ?? false);
    const [showComm, setShowComm] = useState(false);
    const { timeline } = useLeadTimeline(expanded ? lead : null);

    const canManageLeads = hasPermission('admission.leads.manage');
    const canAssign = canManageLeads || hasPermission('admission.visitors.manage') || hasPermission('admission.enquiry.create');

    const phone = lead.phone ?? lead.parent_phone;
    const email = lead.email ?? lead.parent_email;

    return (
        <div className="bg-white dark:bg-card border border-gray-150 dark:border-border/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <LeadAvatar name={lead.student_name} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-black text-sm text-gray-900 dark:text-gray-100">{lead.student_name}</p>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                    {lead.parent_name ?? '—'} · {lead.grade_applied_for ?? 'Program N/A'}
                                </p>
                                {lead.inquiry_number && (
                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">#{lead.inquiry_number}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <LeadPriorityBadge tier={lead.priority} score={lead.score} />
                                <LeadStatusChip status={lead.status} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[10px]">
                            <div>
                                <span className="text-gray-400 font-bold uppercase">Source</span>
                                <p className="font-medium text-gray-700 dark:text-gray-300">{lead.source ?? '—'}</p>
                            </div>
                            <div>
                                <span className="text-gray-400 font-bold uppercase">Counselor</span>
                                <p className="font-medium text-gray-700 dark:text-gray-300">{lead.assigned_counselor ?? 'Unassigned'}</p>
                            </div>
                            <div>
                                <span className="text-gray-400 font-bold uppercase">
                                    {lead.application_id ? 'Converted At' : 'Created'}
                                </span>
                                <p className="font-medium text-gray-700 dark:text-gray-300">
                                    {lead.application_id
                                        ? (lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '—')
                                        : (lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—')
                                    }
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-400 font-bold uppercase">
                                    {lead.application_id ? 'Application ID' : 'Next Follow-up'}
                                </span>
                                <p className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                                    {lead.application_id
                                        ? lead.application_id.slice(0, 8) + '...'
                                        : (lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleString() : '—')
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                            <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" /> {lead.communication_count ?? 0} comms
                            </span>
                            <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" /> {lead.document_count ?? 0} docs
                            </span>
                            {phone && <span>{phone}</span>}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                            {lead.application_id ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 font-semibold border border-green-200">
                                        Converted
                                    </span>
                                    <Link
                                        to={`/app/admissions/${lead.application_id}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors shadow-sm"
                                    >
                                        Open Application
                                    </Link>
                                </div>
                            ) : (
                                <LeadQuickActions
                                    lead={lead}
                                    onConvert={onConvert}
                                    onAssign={onAssign}
                                    onFollowup={onFollowup}
                                    onCommunicate={() => setShowComm(v => !v)}
                                    isConverting={isConverting}
                                    isAssigning={isAssigning}
                                    showAssign={showAssign && !lead.assigned_counselor_id}
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => setExpanded(v => !v)}
                                className="text-[10px] font-bold text-indigo-600 flex items-center gap-1"
                            >
                                {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> Details</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
 
            {showComm && (
                <div className="border-t border-gray-100 p-4">
                    <CommunicationCenter
                        recipientId={lead.id}
                        recipientName={lead.parent_name ?? lead.student_name}
                        recipientEmail={email}
                        recipientPhone={phone}
                    />
                </div>
            )}
 
            {expanded && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50 dark:bg-muted/20">
                    {lead.assigned_counselor_id ? (
                        <div className="text-[10px] text-gray-600 space-y-1 bg-white dark:bg-card p-3 rounded-lg border border-gray-100 dark:border-muted/50">
                            <p className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Assignment Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                    <span className="text-gray-400 uppercase font-bold">Counselor: </span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{lead.assigned_counselor ?? 'Assigned'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 uppercase font-bold">Assigned At: </span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        {(lead.assigned_at ?? lead.updated_at) ? new Date((lead.assigned_at ?? lead.updated_at)!).toLocaleString() : '—'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 uppercase font-bold">Assigned By: </span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{lead.assigned_by ?? 'Admissions Desk'}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        showAssign && canAssign && !lead.application_id && (
                            <LeadAssignment lead={lead} counselorId={counselorId} onAssigned={() => setExpanded(true)} />
                        )
                    )}
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Timeline</h4>
                        <LeadTimeline entries={timeline} compact />
                    </div>
                </div>
            )}
        </div>
    );
}

export default LeadCard;
