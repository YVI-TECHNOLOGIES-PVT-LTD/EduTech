import { AdmissionWorkflowEngine } from '../core/AdmissionWorkflowEngine';

export interface FunnelNode {
    name: string;
    count: number;
}

export interface CounselorLoad {
    name: string;
    count: number;
}

export interface AdmissionMetrics {
    totalReceived: number;
    inProgress: number;
    enrolledCount: number;
    rejectedCount: number;
    conversionRate: number;
    slaBreaches: number;
    funnel: FunnelNode[];
    workload: CounselorLoad[];
}

export class AdmissionAnalyticsService {
    /**
     * Aggregates live numbers to compute metrics reports
     */
    public static computeMetrics(applications: any[]): AdmissionMetrics {
        const totalReceived = applications.length;
        const enrolledCount = applications.filter(a => a.status === 'enrolled').length;
        const rejectedCount = applications.filter(a => a.status === 'rejected').length;
        const inProgress = applications.filter(a => !['draft', 'submitted', 'enrolled', 'rejected', 'cancelled'].includes(a.status)).length;
        
        const conversionRate = totalReceived > 0 ? Math.round((enrolledCount / totalReceived) * 100) : 0;

        // SLA breaches
        const slaBreaches = applications.filter(a => {
            if (['enrolled', 'rejected', 'cancelled'].includes(a.status)) return false;
            const sla = AdmissionWorkflowEngine.calculateSLA(a.created_at, a.status, a.submitted_at);
            return sla.status === 'breached';
        }).length;

        // Funnel stages counts
        const funnel: FunnelNode[] = [
            { name: 'Received', count: totalReceived },
            { name: 'Under Review', count: applications.filter(a => a.status === 'under_review').length },
            { name: 'Doc Verify', count: applications.filter(a => ['docs_pending', 'document_verified'].includes(a.status)).length },
            { name: 'Exam/Int', count: applications.filter(a => ['exam', 'interview'].includes(a.status)).length },
            { name: 'Merit', count: applications.filter(a => a.status === 'recommended').length },
            { name: 'Offer', count: applications.filter(a => a.status === 'approved').length },
            { name: 'Fee', count: applications.filter(a => a.status === 'payment_pending').length },
            { name: 'Enrolled', count: enrolledCount }
        ];

        // Counselor load counts
        const counts: Record<string, number> = {};
        applications.forEach(a => {
            const name = a.parent_name || 'Unassigned';
            counts[name] = (counts[name] || 0) + 1;
        });
        const workload: CounselorLoad[] = Object.entries(counts).map(([name, count]) => ({ name, count }));

        return {
            totalReceived,
            inProgress,
            enrolledCount,
            rejectedCount,
            conversionRate,
            slaBreaches,
            funnel,
            workload
        };
    }
}
