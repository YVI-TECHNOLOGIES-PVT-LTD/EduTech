import { apiSlice } from '@/app/store/apiSlice';

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
  admissions?: any[];
  children?: any[];
  pendingAdmissions?: number;
  students?: number;
  feeCollection?: number;
  totalApplications?: number;
  [key: string]: any;
}

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => '/dashboard/summary',
      providesTags: ['Lead', 'Application', 'Student', 'FeePayment'],
    }),
  }),
});

export const { useGetDashboardSummaryQuery } = dashboardApi;
