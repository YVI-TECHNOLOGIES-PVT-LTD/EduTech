import React, { Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';

const MyFees = React.lazy(() =>
  import('../modules/fees/pages/MyFees').then((m) => ({ default: m.MyFees })),
);
const ParentFeePaymentPage = React.lazy(() =>
  import('../modules/admission/pages/parent/ParentFeePaymentPage').then((m) => ({
    default: m.ParentFeePaymentPage,
  })),
);

/**
 * Parent Fees Lifecycle Router
 * Selects between Post-Admission Student Fee Ledger (<MyFees />) and Pre-Admission Application Fee (<ParentFeePaymentPage />).
 */
export const ParentFeesRouter: React.FC = () => {
  const { user } = useAuth();

  const userRoles =
    user?.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const isPostAdmission = Boolean(
    (user as any)?.hasEnrolledStudent ||
    (user as any)?.isPostAdmission ||
    userRoles.includes('ENROLLED_PARENT'),
  );

  if (isPostAdmission) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <MyFees />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <ParentFeePaymentPage />
    </Suspense>
  );
};

export default ParentFeesRouter;
