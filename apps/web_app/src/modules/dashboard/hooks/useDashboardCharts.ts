import { useGetDashboardSummaryQuery } from '@/shared/api/dashboard.api';
import { DashboardFilter, DashboardChart } from '../types/dashboard.types';

export function useDashboardCharts(role: string, filters?: DashboardFilter, refreshSignal?: number) {
  const { data, isLoading, error, refetch } = useGetDashboardSummaryQuery();

  const charts: DashboardChart[] = data?.funnel
    ? [
        {
          id: 'admin.chart.funnel',
          type: 'area',
          title: 'Admissions Conversion Funnel',
          data: data.funnel.map((item) => ({ name: item.stage, value: item.count })),
          series: [{ key: 'value', label: 'Applicants' }],
        },
      ]
    : [];

  return {
    data: charts,
    isLoading,
    error,
    refetch,
  };
}

export default useDashboardCharts;
