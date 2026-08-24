import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import { ROUTES } from '../constants/routes';
import { Loader } from '../components/ui/atoms/Loader';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isHydrating } = useAuthStore();

  if (isHydrating) {
    return <Loader type="page" message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href={ROUTES.AUTH.LOGIN as any} />;
  }

  return <>{children}</>;
};
