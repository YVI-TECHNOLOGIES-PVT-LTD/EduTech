/**
 * EduTrack ERP — Operational Inbox Dashboard Registry
 * Dashboard widgets strictly function as an Operational Inbox: Metric Card -> Work Queue -> Action.
 * Zero dead statistics widgets.
 */

import { DashboardWidget, WidgetRegistry } from './widget-types';

export const TASK_DRIVEN_WORKSPACE_WIDGETS: DashboardWidget[] = [
  {
    id: 'widget_new_leads',
    title: 'New Inquiries & Leads',
    description: '12 new leads requiring immediate telephone/email follow-up.',
    category: 'leads',
    actionRoute: '/app/admissions/inquiries?filter=new',
    actionLabel: 'Open Inquiries Queue',
    permission: 'admission.enquiry.view',
    featurePackage: 'ADMISSIONS',
    icon: 'MessageSquare',
    badgeColor: 'blue',
    defaultMetric: {
      count: 12,
      label: 'Unassigned Leads',
      urgentCount: 4,
    },
  },
  {
    id: 'widget_pending_applications',
    title: 'Pending Applications',
    description: 'Submitted application forms awaiting eligibility verification & document audit.',
    category: 'applications',
    actionRoute: '/app/admissions/dashboard?tab=submitted',
    actionLabel: 'Review Applications Queue',
    permission: 'admission.review',
    featurePackage: 'ADMISSIONS',
    icon: 'FileText',
    badgeColor: 'amber',
    defaultMetric: {
      count: 18,
      label: 'Submitted Apps',
      urgentCount: 5,
    },
  },
  {
    id: 'widget_pending_documents',
    title: 'Pending Documents',
    description: 'Applicant uploads requiring compliance audit and identity verification.',
    category: 'documents',
    actionRoute: '/app/admissions/verification',
    actionLabel: 'Open Verification Queue',
    permission: 'admission.review',
    featurePackage: 'ADMISSIONS',
    icon: 'ShieldCheck',
    badgeColor: 'purple',
    defaultMetric: {
      count: 14,
      label: 'Files Pending Audit',
      urgentCount: 3,
    },
  },
  {
    id: 'widget_pending_payments',
    title: 'Pending Payments',
    description:
      'Admitted candidates with outstanding fee vouchers or initial registration deposits.',
    category: 'payments',
    actionRoute: '/app/admissions/fees',
    actionLabel: 'Open Fee Collection Desk',
    permission: 'fees.payment.collect',
    featurePackage: 'ADMISSIONS',
    icon: 'Coins',
    badgeColor: 'emerald',
    defaultMetric: {
      count: 15,
      label: 'Fee Collections Due',
      urgentCount: 6,
    },
  },
  {
    id: 'widget_ready_enrollment',
    title: 'Ready for Enrollment',
    description:
      'Verified applicants with cleared payments awaiting final section assignment & ID creation.',
    category: 'enrollment',
    actionRoute: '/app/admissions/enrollment',
    actionLabel: 'Open Enrollment Desk',
    permission: 'admission.enrol',
    featurePackage: 'ADMISSIONS',
    icon: 'GraduationCap',
    badgeColor: 'indigo',
    defaultMetric: {
      count: 9,
      label: 'Candidates Ready',
      urgentCount: 2,
    },
  },
  {
    id: 'widget_todays_followups',
    title: "Today's Scheduled Followups",
    description:
      'Promising leads scheduled for campus visits, counseling calls, or fee reminders today.',
    category: 'followups',
    actionRoute: '/app/admissions/inquiries?filter=followup_today',
    actionLabel: 'View Schedule Queue',
    permission: 'admission.leads.manage',
    featurePackage: 'ADMISSIONS',
    icon: 'Clock',
    badgeColor: 'red',
    defaultMetric: {
      count: 8,
      label: 'Scheduled Visits Today',
      urgentCount: 3,
    },
  },
];

export const TASK_DRIVEN_PARENT_WIDGETS: DashboardWidget[] = [
  {
    id: 'parent_widget_app_status',
    title: 'Application Progress',
    description: 'Track real-time evaluation and document verification status for your child.',
    category: 'parent',
    actionRoute: '/app/parent/applications',
    actionLabel: 'Track Application Status',
    permission: 'admission.view_own',
    featurePackage: 'CORE_PLATFORM',
    icon: 'FileText',
    badgeColor: 'blue',
    defaultMetric: {
      count: 1,
      label: 'Active Application',
    },
  },
  {
    id: 'parent_widget_documents',
    title: 'Document Submissions',
    description: 'Upload required birth certificates, marksheets, and medical records.',
    category: 'parent',
    actionRoute: '/app/parent/documents',
    actionLabel: 'Upload Documents',
    permission: 'admission.view_own',
    featurePackage: 'CORE_PLATFORM',
    icon: 'ShieldCheck',
    badgeColor: 'amber',
    defaultMetric: {
      count: 2,
      label: 'Required Uploads',
    },
  },
  {
    id: 'parent_widget_my_child',
    title: 'Child Overview',
    description: 'View enrollment status, section assignment, and school notifications.',
    category: 'parent',
    actionRoute: '/app/parent/my-child',
    actionLabel: 'View Child Details',
    permission: 'DASHBOARD_VIEW_PARENT',
    featurePackage: 'CORE_PLATFORM',
    icon: 'GraduationCap',
    badgeColor: 'emerald',
    defaultMetric: {
      count: 1,
      label: 'Enrolled Child Profile',
    },
  },
];

export const SYSTEM_DASHBOARD_REGISTRY: WidgetRegistry = {
  workspaceWidgets: TASK_DRIVEN_WORKSPACE_WIDGETS,
  parentWidgets: TASK_DRIVEN_PARENT_WIDGETS,
};
