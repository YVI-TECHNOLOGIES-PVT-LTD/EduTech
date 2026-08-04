import React from 'react';
import { Check, Clock, AlertTriangle, AlertCircle, User, Award, ShieldAlert, DollarSign } from 'lucide-react';

export interface TimelineNode {
    id: string;
    stage: string;
    role: string;
    operator: string;
    timestamp?: string;
    duration?: string;
    slaHours: number;
    remarks?: string;
    status: 'complete' | 'current' | 'upcoming' | 'breached';
}

interface TimelineEngineProps {
    nodes: TimelineNode[];
}

export function TimelineEngine({ nodes }: TimelineEngineProps) {
    return (
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {nodes.map((node, idx) => {
                    const isLast = idx === nodes.length - 1;
                    
                    // Assign icon based on stage name
                    let NodeIcon = Clock;
                    if (node.status === 'complete') NodeIcon = Check;
                    else if (node.status === 'breached') NodeIcon = AlertTriangle;

                    const statusColorMap = {
                        complete: 'bg-emerald-500 text-white ring-emerald-100',
                        current: 'bg-indigo-600 text-white ring-indigo-100 animate-pulse',
                        upcoming: 'bg-gray-100 text-gray-400 ring-gray-50',
                        breached: 'bg-rose-500 text-white ring-rose-100'
                    };

                    return (
                        <li key={node.id}>
                            <div className="relative pb-8">
                                {!isLast && (
                                    <span
                                        className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-muted"
                                        aria-hidden="true"
                                    />
                                )}
                                <div className="relative flex items-start space-x-3">
                                    {/* Icon */}
                                    <div className="relative shrink-0">
                                        <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ${statusColorMap[node.status]}`}>
                                            <NodeIcon className="w-5 h-5" aria-hidden="true" />
                                        </span>
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 min-w-0 bg-white dark:bg-muted/5 p-4 rounded-2xl border border-gray-100 dark:border-border/40 shadow-sm space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                            <div>
                                                <h3 className="text-xs font-black text-gray-900 dark:text-gray-100">{node.stage}</h3>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    <span>{node.role} • {node.operator || 'System'}</span>
                                                </div>
                                            </div>

                                            {/* SLA / Time indicator */}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {node.duration && (
                                                    <span className="px-2 py-0.5 rounded bg-gray-50 dark:bg-muted/20 text-[10px] font-bold text-gray-500">
                                                        Duration: {node.duration}
                                                    </span>
                                                )}
                                                {node.status === 'breached' ? (
                                                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wide flex items-center gap-1 border border-rose-100">
                                                        <ShieldAlert className="w-3 h-3" /> SLA Breach
                                                    </span>
                                                ) : node.status === 'complete' ? (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wide flex items-center gap-0.5 border border-emerald-100">
                                                        Within SLA
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>

                                        {node.remarks && (
                                            <p className="text-xs text-gray-500 leading-relaxed font-medium bg-gray-50/50 dark:bg-muted/10 p-2.5 rounded-xl border border-solid border-gray-100/40">
                                                "{node.remarks}"
                                            </p>
                                        )}

                                        {node.timestamp && (
                                            <div className="text-[10px] text-gray-400 font-semibold text-right">
                                                Completed: {node.timestamp}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

// Generate nodes based on application audit log events
export const generateTimelineNodes = (status: string, auditLogs: any[] = []): TimelineNode[] => {
    const stagesConfig = [
        { stage: 'Inquiry Registered', key: 'inquiry', role: 'Receptionist', sla: 2 },
        { stage: 'Lead Assigned', key: 'lead', role: 'Counselor', sla: 4 },
        { stage: 'Application Submitted', key: 'submitted', role: 'Parent', sla: 24 },
        { stage: 'Documents Verification', key: 'docs_verified', role: 'Admission Officer', sla: 24 },
        { stage: 'Entrance Exam Finished', key: 'exam', role: 'Exam Cell', sla: 72 },
        { stage: 'Merit List Compiled', key: 'merit', role: 'Exam Cell', sla: 24 },
        { stage: 'Admissions Offer Sent', key: 'offer', role: 'Principal', sla: 24 },
        { stage: 'Fee Payment Verified', key: 'payment', role: 'Finance Officer', sla: 24 },
        { stage: 'SIS Student Enrolled', key: 'enrolled', role: 'Admission Officer', sla: 12 }
    ];

    const currentIdx = stagesConfig.findIndex(s => status.toLowerCase().includes(s.key));

    return stagesConfig.map((cfg, idx) => {
        const matchingLog = auditLogs.find(l => l.action.toLowerCase().includes(cfg.key));
        const timestamp = matchingLog ? new Date(matchingLog.created_at).toLocaleString() : undefined;
        
        let nodeStatus: TimelineNode['status'] = 'upcoming';
        let duration = matchingLog?.metadata?.duration || undefined;
        let isBreached = matchingLog?.metadata?.is_sla_breach || false;

        if (idx < currentIdx || status.toLowerCase() === 'enrolled') {
            nodeStatus = isBreached ? 'breached' : 'complete';
        } else if (idx === currentIdx) {
            nodeStatus = 'current';
        }

        return {
            id: cfg.key,
            stage: cfg.stage,
            role: cfg.role,
            operator: matchingLog?.operator_name || 'System',
            timestamp,
            duration,
            slaHours: cfg.sla,
            remarks: matchingLog?.remarks || undefined,
            status: nodeStatus
        };
    });
};
