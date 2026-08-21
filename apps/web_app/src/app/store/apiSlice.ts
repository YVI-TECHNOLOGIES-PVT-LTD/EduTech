import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Role',
    'Organization',
    'Department',
    'Designation',
    'Staff',
    'AcademicYear',
    'Grade',
    'Section',
    'Lead',
    'LeadActivity',
    'CampusVisit',
    'Application',
    'Assessment',
    'FeePayment',
    'Student',
    'Parent',
    'Enrollment',
    'Setting',
    'AuditLog',
    'ChatbotSession',
    'Notification',
    'NotificationCount',
  ],
  endpoints: () => ({}),
});
