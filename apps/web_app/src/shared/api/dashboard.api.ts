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

export interface AdminOverviewStats {
  students: number;
  classes: number;
  exams: number;
  pendingAdmissions: number;
  totalApplications: number;
  feeCollection: number;
  attendanceRate: string;
}

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => '/dashboard/summary',
      providesTags: ['Lead', 'Application', 'Student', 'FeePayment'],
    }),
    getAdminOverview: builder.query<AdminOverviewStats, void>({
      query: () => '/dashboard/admin/overview',
      providesTags: ['Student', 'Application', 'FeePayment'],
    }),
  }),
});

export const { useGetDashboardSummaryQuery, useGetAdminOverviewQuery } = dashboardApi;
