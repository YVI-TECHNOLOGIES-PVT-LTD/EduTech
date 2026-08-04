import React from 'react';
import { View, Text } from 'react-native';
import { UserRole } from '../types/role.types';
import { PermissionEngine } from '../core/permissions/permission-engine';

export interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
}) => {
  const hasAccess = PermissionEngine.hasRole(allowedRoles);

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    return (
      <View className="flex-1 items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <Text className="text-xl font-bold text-red-600 mb-2">Access Denied</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
          You do not have permission to view this section.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};
