import React from 'react';
import { View, Text } from 'react-native';
import { PermissionAction, PermissionResource } from '../types/role.types';
import { PermissionEngine } from '../core/permissions/permission-engine';

export interface PermissionGuardProps {
  action: PermissionAction;
  resource: PermissionResource;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  action,
  resource,
  children,
  fallback,
}) => {
  const hasPermission = PermissionEngine.can(action, resource);

  if (!hasPermission) {
    if (fallback) return <>{fallback}</>;
    return (
      <View className="flex-1 items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <Text className="text-xl font-bold text-amber-600 mb-2">Insufficient Permissions</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Action `{action}` on resource `{resource}` is restricted.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};
