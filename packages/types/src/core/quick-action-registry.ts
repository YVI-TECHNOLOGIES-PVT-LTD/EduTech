/**
 * EduTrack ERP — Quick Actions Registry
 * Central metadata registry for permission-driven quick actions.
 */

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  targetRoute: string;
  icon: string;
  permission?: string;
  permissions?: string[];
  featurePackage?: string;
  badge?: string;
  category: 'admission' | 'finance' | 'people' | 'system';
}

export const SYSTEM_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'qa_new_lead',
    title: 'New Lead',
    description: 'Log an incoming inquiry or front desk walk-in visitor.',
    targetRoute: '/app/admissions/inquiries?action=new',
    icon: 'MessageSquare',
    permission: 'admission.enquiry.create',
    featurePackage: 'ADMISSIONS',
    category: 'admission',
  },
  {
    id: 'qa_new_application',
    title: 'New Application',
    description: 'Create a new student admission application form.',
    targetRoute: '/app/admissions/wizard',
    icon: 'FileText',
    permission: 'admission.create',
    featurePackage: 'ADMISSIONS',
    category: 'admission',
  },
  {
    id: 'qa_collect_fee',
    title: 'Collect Fee',
    description: 'Process an admission deposit or fee voucher payment.',
    targetRoute: '/app/admissions/fees',
    icon: 'Coins',
    permission: 'fees.payment.collect',
    featurePackage: 'ADMISSIONS',
    category: 'finance',
  },
  {
    id: 'qa_enroll_student',
    title: 'Enroll Student',
    description: 'Complete student onboarding & generate roll number.',
    targetRoute: '/app/admissions/enrollment',
    icon: 'GraduationCap',
    permission: 'admission.enrol',
    featurePackage: 'ADMISSIONS',
    category: 'admission',
  },
  {
    id: 'qa_add_parent',
    title: 'Add Parent',
    description: 'Register a new guardian profile in the system.',
    targetRoute: '/app/people/parents?action=new',
    icon: 'Users',
    permission: 'STUDENT_CREATE',
    featurePackage: 'PEOPLE',
    category: 'people',
  },
  {
    id: 'qa_create_user',
    title: 'Create User',
    description: 'Provision a staff or administrative user account.',
    targetRoute: '/app/settings?cat=security&action=create_user',
    icon: 'UserPlus',
    permission: 'manage_users',
    featurePackage: 'ADMINISTRATION',
    category: 'system',
  },
];
