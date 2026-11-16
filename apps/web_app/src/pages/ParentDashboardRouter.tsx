import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
const ParentDashboard = React.lazy(() =>
  import('../modules/dashboard/pages/ParentDashboard').then((m) => ({
    default: m.ParentDashboard,
  })),
);
const ParentDashboardPage = React.lazy(() =>
  import('../modules/admission/pages/parent/ParentDashboardPage').then((m) => ({
    default: m.ParentDashboardPage,
  })),
);
import { ParentDashboardService } from '../modules/dashboard/services/ParentDashboardService';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';

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
    return (
      <Suspense fallback={<PageSkeleton />}>
        <ParentDashboard />
      </Suspense>
    );
  }

  if (checkingOverview && hasEnrolledKids === null) {
    return <PageSkeleton />;
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <ParentDashboardPage />
    </Suspense>
  );
};

export default ParentDashboardRouter;
