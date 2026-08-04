import { useDashboardContext } from '../core/DashboardContext';
import { useDashboardKPIs } from './useDashboardKPIs';
import { useDashboardActivities } from './useDashboardActivities';
import { useDashboardNotifications } from './useDashboardNotifications';
import { useDashboardTasks } from './useDashboardTasks';
import { useDashboardCharts } from './useDashboardCharts';
import { DashboardRegistry } from '../core/DashboardRegistry';

export function useDashboard() {
    const { filters, activeRole, refreshSignal, triggerGlobalRefresh } = useDashboardContext();

    // Check layouts registry to see what sub-widgets are registered for this role
    const config = DashboardRegistry.getConfig(activeRole);
    const registeredWidgets = config?.widgets || [];

    const hasKPIs = registeredWidgets.some(w => w.includes('.kpi.'));
    const hasActivities = registeredWidgets.some(w => w.includes('.activity') || w.includes('.list.'));
    const hasCharts = registeredWidgets.some(w => w.includes('.chart.'));
    const hasNotifications = registeredWidgets.some(w => w.includes('.notification') || w.includes('announcement'));
    const hasTasks = registeredWidgets.some(w => w.includes('.task') || w.includes('.queue.'));

    // Queries load conditionally depending on layouts mapping definition
    const kpiQuery = useDashboardKPIs(activeRole, filters, refreshSignal);
    
    const activitiesQuery = useDashboardActivities(activeRole, filters, refreshSignal);
    
    const notificationsQuery = useDashboardNotifications(activeRole, refreshSignal);
    
    const tasksQuery = useDashboardTasks(activeRole, refreshSignal);
    
    const chartsQuery = useDashboardCharts(activeRole, filters, refreshSignal);

    const loading =
        (hasKPIs && kpiQuery.isLoading) ||
        (hasActivities && activitiesQuery.isLoading) ||
        (hasCharts && chartsQuery.isLoading) ||
        (hasNotifications && notificationsQuery.isLoading) ||
        (hasTasks && tasksQuery.isLoading);

    const error =
        kpiQuery.error ||
        activitiesQuery.error ||
        chartsQuery.error ||
        notificationsQuery.error ||
        tasksQuery.error ||
        null;

    const refetch = () => {
        triggerGlobalRefresh();
        kpiQuery.refetch();
        activitiesQuery.refetch();
        notificationsQuery.refetch();
        tasksQuery.refetch();
        chartsQuery.refetch();
    };

    return {
        loading,
        error,
        kpis: kpiQuery.data || [],
        activities: activitiesQuery.data || [],
        charts: chartsQuery.data || [],
        notifications: notificationsQuery.data || [],
        tasks: tasksQuery.data || [],
        refetch
    };
}

export default useDashboard;
