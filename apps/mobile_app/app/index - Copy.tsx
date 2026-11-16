import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { ROUTES } from '../src/constants/routes';
import { Loader } from '../src/components/ui/atoms/Loader';

export default function IndexScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace(ROUTES.TABS.DASHBOARD as any);
      } else {
        router.replace(ROUTES.AUTH.SPLASH as any);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  return <Loader type="page" message="Loading EduTrack ERP..." />;
}
