import { useGetDashboardSummaryQuery } from '@/shared/api/dashboard.api';
import { DashboardFilter, DashboardCard } from '../types/dashboard.types';

export function useDashboardKPIs(role: string, filters?: DashboardFilter, refreshSignal?: number) {
  const { data, isLoading, error, refetch } = useGetDashboardSummaryQuery();

  const kpis: DashboardCard[] = data?.kpis
    ? [
        { id: '1', label: 'Total Leads', value: data.kpis.totalLeads },
        { id: '2', label: 'Active Applications', value: data.kpis.activeApplications },
        { id: '3', label: 'Students Enrolled', value: data.kpis.studentsEnrolled },
        { id: '4', label: 'Pending Assessments', value: data.kpis.pendingAssessments },
      ]
    : [];

  return {
    data: kpis,
    isLoading,
    error,
    refetch,
  };
}

export default useDashboardKPIs;
