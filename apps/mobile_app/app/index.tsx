import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { ROUTES } from '../src/constants/routes';
import { Loader } from '../src/components/ui/atoms/Loader';

export default function IndexScreen() {
  const { isAuthenticated, isHydrating } = useAuthStore();

  if (isHydrating) {
    return <Loader type="page" message="Loading EduTrack ERP..." />;
  }

  return <Redirect href={(isAuthenticated ? ROUTES.PARENT.DASHBOARD : ROUTES.AUTH.LOGIN) as any} />;
}
