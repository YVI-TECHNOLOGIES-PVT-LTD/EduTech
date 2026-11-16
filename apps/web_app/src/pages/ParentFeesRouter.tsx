import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MyFees } from '../modules/fees/pages/MyFees';
import { ParentFeePaymentPage } from '../modules/admission/pages/parent/ParentFeePaymentPage';

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
    return <MyFees />;
  }

  return <ParentFeePaymentPage />;
};

export default ParentFeesRouter;
