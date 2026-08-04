import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FEATURE_FLAGS_CONFIG } from '../../config/featureFlags';
import { AccessDenied } from './AccessDenied';

interface GuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface PermissionGuardProps extends GuardProps {
    permission: string;
}

export const PermissionGuard = ({
    permission,
    children,
    fallback = <AccessDenied />,
}: PermissionGuardProps) => {
    const { hasPermission } = useAuth();
    if (!hasPermission || !hasPermission(permission)) {
        return <>{fallback}</>;
    }
    return <>{children}</>;
};

interface RoleGuardProps extends GuardProps {
    allowedRoles: string[];
}

export const RoleGuard = ({
    allowedRoles,
    children,
    fallback = <AccessDenied />,
}: RoleGuardProps) => {
    const { hasRole } = useAuth();
    const matches = allowedRoles.some(role => hasRole(role));
    if (!matches) {
        return <>{fallback}</>;
    }
    return <>{children}</>;
};

interface FeatureFlagGuardProps extends GuardProps {
    flag: string;
}

export const FeatureFlagGuard = ({ flag, children, fallback = null }: FeatureFlagGuardProps) => {
    const isEnabled = FEATURE_FLAGS_CONFIG[flag] ?? false;
    if (!isEnabled) {
        return <>{fallback}</>;
    }
    return <>{children}</>;
};
