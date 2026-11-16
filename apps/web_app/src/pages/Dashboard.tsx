import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LandingResolver } from '../services/LandingResolver';
import { PageSkeleton } from '../components/common/LoadingSkeleton';

/**
 * Legacy /app/dashboard Resolver
 * MUST NEVER render any dashboard component directly.
 * Resolves the authenticated user's canonical landing route and redirects immediately.
 */
export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const rawRoles =
    user.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const destination = LandingResolver.resolveLandingRoute(rawRoles, [], user);

  return <Navigate to={destination} replace />;
}
