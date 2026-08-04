import { useAuth } from '../../../context/AuthContext';
import { AccessDenied } from '../../../components/auth/AccessDenied';
import { AdmissionPermissions } from '../core/AdmissionPermissions';

interface AdmissionInquiryGuardProps {
    children: React.ReactNode;
}

/** Route guard for inquiry workspace — allows CRM roles, not only admission.review. */
export function AdmissionInquiryGuard({ children }: AdmissionInquiryGuardProps) {
    const { user, hasPermission, hasRole } = useAuth();

    if (!user) {
        return <AccessDenied title="Session Required" message="Please sign in to access the inquiry workspace." />;
    }

    const ctx = {
        roles: user.roles ?? [],
        hasPermission,
        hasRole,
    };

    if (!AdmissionPermissions.canAccessInquiryWorkspace(ctx)) {
        return (
            <AccessDenied
                title="Inquiry Workspace Restricted"
                message="Your role does not include access to the inquiry CRM. Required: receptionist, counselor, or admission staff permissions."
            />
        );
    }

    return <>{children}</>;
}

export default AdmissionInquiryGuard;
