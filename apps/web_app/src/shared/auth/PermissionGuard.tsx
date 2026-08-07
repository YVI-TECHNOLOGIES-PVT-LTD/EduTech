import React from 'react';
import { usePermission } from './usePermission';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  requireAll = false,
  fallback = <Navigate to={ROUTES.APP.UNAUTHORIZED} replace />,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  let isAllowed = true;

  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    isAllowed = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
