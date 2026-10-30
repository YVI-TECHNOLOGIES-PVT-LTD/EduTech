import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ParentDashboard } from '../modules/dashboard/pages/ParentDashboard';
import { ParentDashboardPage } from '../modules/admission/pages/parent/ParentDashboardPage';
import { ParentDashboardService } from '../modules/dashboard/services/ParentDashboardService';

/**
 * Parent Dashboard Lifecycle Router
 * Canonical component for /app/parent/dashboard
 * Selects between Post-Admission Parent Portal Dashboard and Pre-Admission Self-Service Admission Dashboard.
 */
export const ParentDashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const [checkingOverview, setCheckingOverview] = useState<boolean>(false);
  const [hasEnrolledKids, setHasEnrolledKids] = useState<boolean | null>(null);

  const userRoles =
    user?.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const isPostAdmission = Boolean(
    (user as any)?.hasEnrolledStudent ||
    (user as any)?.isPostAdmission ||
    userRoles.includes('ENROLLED_PARENT') ||
    hasEnrolledKids === true,
  );

  useEffect(() => {
    if (isPostAdmission || hasEnrolledKids !== null) return;

    let isMounted = true;
    setCheckingOverview(true);
    ParentDashboardService.getOverview()
      .then((data) => {
        if (!isMounted) return;
        const hasChildren = Array.isArray(data?.children) && data.children.length > 0;
        setHasEnrolledKids(hasChildren);
      })
      .catch(() => {
        if (isMounted) setHasEnrolledKids(false);
      })
      .finally(() => {
        if (isMounted) setCheckingOverview(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, isPostAdmission, hasEnrolledKids]);

  if (isPostAdmission) {
    return <ParentDashboard />;
  }

  if (checkingOverview && hasEnrolledKids === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          Resolving Student Profile...
        </p>
      </div>
    );
  }

  return <ParentDashboardPage />;
};

export default ParentDashboardRouter;
