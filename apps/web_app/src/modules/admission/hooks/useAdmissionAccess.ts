import { useAuth } from '../../../context/AuthContext';

export function useAdmissionAccess() {
    const { user, isAuthenticated, hasPermission, hasRole } = useAuth();

    // Map roles to standard lowercase / uppercase comparison
    const role = user?.roles?.[0] || null;
    const permissions = user?.permissions || [];

    const canViewCRM = isAuthenticated && (
        hasPermission('admission.enquiry.view') ||
        hasPermission('admission.review') ||
        hasRole('ADMISSION_OFFICER') ||
        hasRole('COUNSELOR') ||
        hasRole('RECEPTIONIST')
    );

    const canManageCRM = isAuthenticated && (
        hasPermission('admission.leads.manage') ||
        hasPermission('admission.review') ||
        hasRole('ADMISSION_OFFICER')
    );

    const canReview = isAuthenticated && hasPermission('admission.review');
    const canApprove = isAuthenticated && hasPermission('admission.approve');
    
    const canAssignCounselor = isAuthenticated && (
        hasPermission('admission.leads.manage') ||
        hasRole('ADMISSION_OFFICER')
    );
    
    const canCollectFees = isAuthenticated && (
        hasRole('FINANCE') ||
        hasRole('FINANCE_OFFICER') ||
        hasPermission('admission.review')
    );

    const canViewApplications = isAuthenticated && (
        hasPermission('admission.view_all') ||
        hasPermission('admission.view_own')
    );

    return {
        role,
        permissions,
        canViewCRM,
        canManageCRM,
        canAssignCounselor,
        canReview,
        canApprove,
        canCollectFees,
        canViewApplications
    };
}
