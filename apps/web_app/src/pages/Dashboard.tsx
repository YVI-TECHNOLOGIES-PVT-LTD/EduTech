import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LandingResolver } from '../services/LandingResolver';
import { SchoolOperationsWorkspace } from './SchoolOperationsWorkspace';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRoles =
    user.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const destination = LandingResolver.resolveLandingRoute(userRoles, [], user);

  if (
    destination !== '/app/dashboard' &&
    destination !== '/app' &&
    destination !== '/app/workspace'
  ) {
    return <Navigate to={destination} replace />;
  }

  return <SchoolOperationsWorkspace />;
}
