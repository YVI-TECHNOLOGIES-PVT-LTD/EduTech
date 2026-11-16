import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ParentDashboard } from '../modules/dashboard/pages/ParentDashboard';
import { ParentDashboardPage } from '../modules/admission/pages/parent/ParentDashboardPage';

/**
 * Parent Dashboard Lifecycle Router
 * Canonical component for /app/parent/dashboard
 * Selects between Post-Admission Parent Portal Dashboard and Pre-Admission Self-Service Admission Dashboard.
 */
export const ParentDashboardRouter: React.FC = () => {
  const { user } = useAuth();

  const userRoles =
    user?.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const isPostAdmission = Boolean(
    (user as any)?.hasEnrolledStudent ||
    (user as any)?.isPostAdmission ||
    userRoles.includes('ENROLLED_PARENT'),
  );

  if (isPostAdmission) {
    return <ParentDashboard />;
  }

  return <ParentDashboardPage />;
};

export default ParentDashboardRouter;
