import React from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { MyApplications } from '../MyApplications';
import ReceptionistDashboard from './ReceptionistDashboard';
import CounselorDashboard from './CounselorDashboard';
import AdmissionOfficerDashboard from './AdmissionOfficerDashboard';
import ExamCellDashboard from './ExamCellDashboard';
import PrincipalDashboard from './PrincipalDashboard';
import FinanceDashboard from './FinanceDashboard';
import { AlertCircle } from 'lucide-react';

export function WorkspaceDashboard() {
  const { hasPermission, hasRole } = useAuth();

  // 1. Staff permission profiles prioritized
  if (
    hasPermission('admission.enquiry.create') ||
    hasRole('FRONT_OFFICE') ||
    hasRole('FO') ||
    hasRole('FRONT_OFFICE_STAFF')
  ) {
    return <ReceptionistDashboard />;
  }
  if (hasPermission('admission.leads.manage') && !hasPermission('admission.review')) {
    return <CounselorDashboard />;
  }
  if (hasPermission('admission.review') && hasPermission('admission.approve')) {
    return <AdmissionOfficerDashboard />;
  }
  if (hasPermission('exam.dashboard.view') || hasRole('EXAM_CELL_ADMIN')) {
    return <ExamCellDashboard />;
  }
  if (hasPermission('admin.dashboard.view') || hasRole('ADMIN') || hasRole('SUPER_ADMIN')) {
    return <PrincipalDashboard />;
  }
  if (hasPermission('fees.dashboard.view') || hasRole('FINANCE')) {
    return <FinanceDashboard />;
  }

  // 2. Pre-admission applicant persona fallback
  if (hasRole('PARENT') || hasRole('GUARDIAN')) {
    return <MyApplications />;
  }

  return (
    <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-white border rounded-2xl shadow-sm mt-12">
      <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
      <h3 className="text-sm font-black uppercase text-gray-800">Generic Admissions Portal</h3>
      <p className="text-xs text-gray-500 font-medium leading-relaxed">
        Your account does not have a specialized admissions role assigned. Please contact the school
        system administrator to map your permissions.
      </p>
    </div>
  );
}

export default WorkspaceDashboard;
