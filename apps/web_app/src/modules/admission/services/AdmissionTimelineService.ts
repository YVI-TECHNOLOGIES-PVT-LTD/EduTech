export interface TimelineNode {
    id: string;
    title: string;
    description: string;
    remarks?: string;
    actor: string;
    timestamp: string;
    type: 'transition' | 'audit' | 'creation';
}

export class AdmissionTimelineService {
    /**
     * Merges history transitions and audit records into chronological order
     */
    public static buildTimeline(historyEntries: any[], auditLogs: any[], createdAt: string): TimelineNode[] {
        const nodes: TimelineNode[] = [];

        // 1. Log initial creation
        nodes.push({
            id: 'creation-event',
            title: 'Application Form Initiated',
            description: 'Candidate record created in admissions pipeline.',
            actor: 'System Portal',
            timestamp: createdAt,
            type: 'creation',
        });

        // 2. Map status transition logs
        if (historyEntries) {
            historyEntries.forEach((h, idx) => {
                nodes.push({
                    id: `transition-${idx}-${h.id || idx}`,
                    title: `Workflow Stage: Transitioned to ${h.new_status?.replace(/_/g, ' ')}`,
                    description: `Moved from ${h.old_status || 'INIT'} state.`,
                    remarks: h.reason || undefined,
                    actor: h.changed_by || 'Staff Coordinator',
                    timestamp: h.created_at,
                    type: 'transition',
                });
            });
        }

        // 3. Map general audit logs
        if (auditLogs) {
            auditLogs.forEach((a, idx) => {
                nodes.push({
                    id: `audit-${idx}-${a.id || idx}`,
                    title: `Audit Log: ${a.action?.replace(/_/g, ' ')}`,
                    description: a.remarks || 'Process audit update.',
                    actor: a.performed_by || a.user_id || 'System Auditor',
                    timestamp: a.created_at,
                    type: 'audit',
                });
            });
        }

        // 4. Sort chronologically (oldest first or newest first? Let's do newest first for top-stepper rendering)
        return nodes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
}
