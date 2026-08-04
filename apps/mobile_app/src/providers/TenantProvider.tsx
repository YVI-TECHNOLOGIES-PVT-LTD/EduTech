import React, { createContext, useContext, useEffect } from 'react';
import { TenantService } from '../core/tenant/tenant.service';

const TenantContext = createContext({
  isTenantReady: true,
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    TenantService.loadStoredTenant().catch(() => {});
  }, []);

  return <TenantContext.Provider value={{ isTenantReady: true }}>{children}</TenantContext.Provider>;
};

export const useTenantContext = () => useContext(TenantContext);
