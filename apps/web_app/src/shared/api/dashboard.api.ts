import { apiSlice } from '@/app/store/apiSlice';
import { ApiBuilder } from '@/types/rtk-query';

export interface DashboardSummary {
  kpis: {
    totalLeads: number;
    activeApplications: number;
    studentsEnrolled: number;
    pendingAssessments: number;
    feeCollectionTotal: number;
    conversionRate: number;
  };
  funnel: {
    stage: string;
    count: number;
  }[];
  recentActivities: {
    id: string;
    action: string;
    description: string;
    user: string;
    timestamp: string;
  }[];
  pendingTasks: {
    id: string;
    title: string;
    type: string;
    dueDate: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
}

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder: ApiBuilder) => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => '/dashboard/summary',
      providesTags: ['Lead', 'Application', 'Student', 'FeePayment'],
    }),
  }),
});

export const { useGetDashboardSummaryQuery } = dashboardApi;
