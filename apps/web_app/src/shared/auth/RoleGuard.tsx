import React from 'react';
import { usePermission } from './usePermission';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

interface RoleGuardProps {
  role?: string;
  roles?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  role,
  roles,
  fallback = <Navigate to={ROUTES.APP.UNAUTHORIZED} replace />,
  children,
}) => {
  const { hasRole, userRole, isSuperAdmin } = usePermission();

  if (isSuperAdmin) {
    return <>{children}</>;
  }

  let isAllowed = false;
  if (role) {
    isAllowed = hasRole(role);
  } else if (roles && roles.length > 0) {
    isAllowed = roles.includes(userRole);
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
