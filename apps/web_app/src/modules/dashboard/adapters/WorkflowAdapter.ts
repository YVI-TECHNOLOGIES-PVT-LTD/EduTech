import { DashboardCard } from '../types/dashboard.types';
import { DashboardMapper } from '../utils/dashboard.mapper';

export class WorkflowAdapter {
    public static mapAnalyticsToKPIs(data: any): DashboardCard[] {
        const counts = data?.counts || {};
        const active = DashboardMapper.safeNumber(counts.running);
        const waiting = DashboardMapper.safeNumber(counts.waiting);
        const sla = DashboardMapper.safeNumber(data?.slaCompliancePercent ?? 100);
        const failed = DashboardMapper.safeNumber(counts.failed);

        return [
            {
                id: 'workflow.kpi.active',
                label: 'Active Runs',
                value: active,
                format: 'number',
                subtext: 'Ongoing orchestrations'
            },
            {
                id: 'workflow.kpi.waiting',
                label: 'Pending Approvals',
                value: waiting,
                format: 'number',
                subtext: 'Awaiting transition decision'
            },
            {
                id: 'workflow.kpi.sla',
                label: 'SLA Compliance',
                value: sla,
                format: 'percentage',
                subtext: 'Target 95%+'
            },
            {
                id: 'workflow.kpi.errors',
                label: 'System Errors / DLQ',
                value: failed,
                format: 'number',
                subtext: 'Requires manual restart'
            }
        ];
    }
}

export default WorkflowAdapter;
