import React from 'react';
import { useAuth } from '../context/AuthContext';

interface PermissionGateProps {
    children: React.ReactNode;
    permission: string;
    fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ children, permission, fallback = null }) => {
    const { hasPermission } = useAuth();

    if (!hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
