import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CapabilityEngine, UserCapabilityContext } from '@edutrack/types';
import { SchoolOperationsWorkspace } from './SchoolOperationsWorkspace';
import { ParentPortal } from './ParentPortal';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const capabilityContext: UserCapabilityContext = {
    permissions: user.permissions || [],
    roles: user.roles || [],
    isSuperAdmin: user.roles?.includes('SUPER_ADMIN'),
  };

  const isParent =
    CapabilityEngine.hasPermission(capabilityContext.permissions, 'DASHBOARD_VIEW_PARENT') ||
    CapabilityEngine.hasPermission(capabilityContext.permissions, 'parent.dashboard.view') ||
    user.roles?.includes('PARENT');

  if (isParent) {
    return <ParentPortal />;
  }

  return <SchoolOperationsWorkspace />;
}
