import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { ROUTES } from '../src/constants/routes';
import { Loader } from '../src/components/ui/atoms/Loader';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isHydrating } = useAuthStore();

  useEffect(() => {
    if (isHydrating) return;

    if (isAuthenticated) {
      router.replace(ROUTES.PARENT.DASHBOARD as any);
    } else {
      router.replace(ROUTES.AUTH.LOGIN as any);
    }
  }, [isAuthenticated, isHydrating, router]);

  return <Loader type="page" message="Loading EduTrack ERP..." />;
}
