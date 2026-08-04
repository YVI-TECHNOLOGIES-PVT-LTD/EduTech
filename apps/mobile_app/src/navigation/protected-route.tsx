import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import { ROUTES } from '../constants/routes';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href={ROUTES.AUTH.LOGIN as any} />;
  }

  return <>{children}</>;
};
