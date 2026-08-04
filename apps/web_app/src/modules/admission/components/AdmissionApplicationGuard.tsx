import { useAuth } from '../../../context/AuthContext';
import { AccessDenied } from '../../../components/auth/AccessDenied';
import { AdmissionPermissions } from '../core/AdmissionPermissions';

interface AdmissionApplicationGuardProps {
    children: React.ReactNode;
}

/** Route guard for Applicant360 — admission.application.view / view_own / counselor role. */
export function AdmissionApplicationGuard({ children }: AdmissionApplicationGuardProps) {
    const { user, hasPermission, hasRole } = useAuth();

    if (!user) {
        return <AccessDenied title="Session Required" message="Please sign in to view this application." />;
    }

    const ctx = {
        roles: user.roles ?? [],
        hasPermission,
        hasRole,
    };

    if (!AdmissionPermissions.canViewApplication(ctx)) {
        return (
            <AccessDenied
                title="Application Access Restricted"
                message="Your role does not include permission to view admission applications. Required: admission.application.view or assigned counselor access."
            />
        );
    }

    return <>{children}</>;
}

export default AdmissionApplicationGuard;
