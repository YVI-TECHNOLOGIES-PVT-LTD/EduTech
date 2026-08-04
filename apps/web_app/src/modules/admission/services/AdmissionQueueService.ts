import { AdmissionWorkflowEngine } from '../core/AdmissionWorkflowEngine';

export interface QueueSummary {
    id: string;
    label: string;
    count: number;
}

export class AdmissionQueueService {
    /**
     * Filters list of applications by active queue selection
     */
    public static filterQueue(applications: any[], queueId: string, officerEmail?: string): any[] {
        const today = new Date().toDateString();
        
        return applications.filter(app => {
            const stage = AdmissionWorkflowEngine.resolveCurrentStage(app.status);
            const sla = AdmissionWorkflowEngine.calculateSLA(app.created_at, app.status, app.submitted_at);

            switch (queueId) {
                case 'My Queue':
                    return !app.parent_name || app.parent_name === officerEmail;
                case 'Due Today':
                    return sla.status === 'critical' || sla.status === 'warning';
                case 'Over SLA':
                    return sla.status === 'breached';
                case 'Waiting Parents':
                    return ['draft', 'docs_pending'].includes(app.status);
                case 'Waiting Finance':
                    return ['fee_pending', 'payment_submitted'].includes(app.status);
                case 'Waiting Principal':
                    return ['recommended', 'merit', 'review_pending'].includes(app.status);
                case 'Completed Today':
                    return app.status === 'enrolled' && new Date(app.updated_at).toDateString() === today;
                case 'Escalated':
                    return app.status === 'payment_correction' || sla.status === 'breached';
                case 'Rejected':
                    return app.status === 'rejected';
                default:
                    return true;
            }
        });
    }

    /**
     * Gathers counts of each operational queue
     */
    public static getQueueSummaries(applications: any[], officerEmail?: string): QueueSummary[] {
        const queues = [
            'My Queue',
            'Due Today',
            'Over SLA',
            'Waiting Parents',
            'Waiting Finance',
            'Waiting Principal',
            'Completed Today',
            'Escalated',
            'Rejected'
        ];

        return queues.map(q => ({
            id: q,
            label: q,
            count: this.filterQueue(applications, q, officerEmail).length
        }));
    }
}
