import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { TokenManager } from '../core/auth/token-manager';

const AuthContext = createContext({
  isInitialized: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Attempt token retrieval on app cold start
    TokenManager.getAccessToken().catch(() => {});
  }, []);

  return <AuthContext.Provider value={{ isInitialized: true }}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
