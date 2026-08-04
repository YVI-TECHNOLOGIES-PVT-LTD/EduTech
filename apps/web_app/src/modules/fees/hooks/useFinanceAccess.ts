import { useAuth } from '../../../context/AuthContext';

export function useFinanceAccess() {
    const { isAuthenticated, hasPermission } = useAuth();

    const canViewStructures = isAuthenticated && (
        hasPermission('fees.structure.view') ||
        hasPermission('fees.structure.manage')
    );

    const canManageStructures = isAuthenticated && (
        hasPermission('fees.structure.manage')
    );

    const canViewLedger = isAuthenticated && (
        hasPermission('fees.view') ||
        hasPermission('fees.demand.view')
    );

    const canCollectPayment = isAuthenticated && (
        hasPermission('fees.payment.collect')
    );

    const canGenerateReceipt = isAuthenticated && (
        hasPermission('fees.receipt.generate')
    );

    const canRefund = isAuthenticated && (
        hasPermission('fees.refund.process')
    );

    return {
        canViewStructures,
        canManageStructures,
        canViewLedger,
        canCollectPayment,
        canGenerateReceipt,
        canRefund,
    };
}
