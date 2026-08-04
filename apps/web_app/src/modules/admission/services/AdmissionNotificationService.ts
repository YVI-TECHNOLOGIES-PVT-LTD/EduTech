import { AdmissionWorkflowEngine } from '../core/AdmissionWorkflowEngine';

export interface AdmissionAlert {
    type: 'critical' | 'warning' | 'normal';
    message: string;
    actionLabel: string;
    target: string;
}

export class AdmissionNotificationService {
    /**
     * Inspects active applications to generate prioritized action alerts
     */
    public static generateAlerts(applications: any[]): AdmissionAlert[] {
        const alerts: AdmissionAlert[] = [];

        // 1. Check for SLA breached cases
        const breachedCount = applications.filter(a => {
            if (['enrolled', 'rejected', 'cancelled'].includes(a.status)) return false;
            const sla = AdmissionWorkflowEngine.calculateSLA(a.created_at, a.status, a.submitted_at);
            return sla.status === 'breached';
        }).length;

        if (breachedCount > 0) {
            alerts.push({
                type: 'critical',
                message: `${breachedCount} candidate applications have exceeded processing SLA timelines!`,
                actionLabel: 'Open SLA Queue',
                target: 'QUEUES'
            });
        }

        // 2. Check for pending document checks
        const docPendingCount = applications.filter(a => a.status === 'docs_pending').length;
        if (docPendingCount > 0) {
            alerts.push({
                type: 'warning',
                message: `${docPendingCount} application(s) are awaiting file verification checklist checks.`,
                actionLabel: 'Verify Documents',
                target: 'DOCUMENTS'
            });
        }

        // 3. Check for pending billing payments
        const feePendingCount = applications.filter(a => ['fee_pending', 'payment_submitted'].includes(a.status)).length;
        if (feePendingCount > 0) {
            alerts.push({
                type: 'normal',
                message: `${feePendingCount} candidate billing fee structure collections require reconciliation.`,
                actionLabel: 'Collect Fees',
                target: 'FINANCE'
            });
        }

        // 4. Check for interview evaluation scorecards
        const interviewCount = applications.filter(a => a.status === 'interview').length;
        if (interviewCount > 0) {
            alerts.push({
                type: 'normal',
                message: `${interviewCount} scheduled candidate interviews are awaiting score evaluations.`,
                actionLabel: 'Open Interview Center',
                target: 'INTERVIEWS'
            });
        }

        return alerts;
    }
}
