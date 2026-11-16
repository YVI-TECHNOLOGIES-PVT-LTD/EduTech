import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { SecureStorage } from '../storage/secure-store';

interface AuthContextType {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isInitialized: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setHydrating = useAuthStore((state) => state.setHydrating);

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      try {
        setHydrating(true);
        const accessToken = await SecureStorage.getAccessToken();
        const refreshToken = await SecureStorage.getRefreshToken();

        if (accessToken && isMounted) {
          setTokens({
            accessToken,
            refreshToken: refreshToken || '',
          });
        }
      } catch (error) {
        console.warn('[AuthProvider] Failed to hydrate secure session:', error);
      } finally {
        if (isMounted) {
          setHydrating(false);
          setIsInitialized(true);
        }
      }
    }

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [setTokens, setHydrating]);

  return <AuthContext.Provider value={{ isInitialized }}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
