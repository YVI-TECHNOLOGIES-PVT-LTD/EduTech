import React, { createContext, useContext } from 'react';
import { PermissionEngine } from '../core/permissions/permission-engine';

const PermissionContext = createContext({
  can: PermissionEngine.can,
  hasRole: PermissionEngine.hasRole,
});

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PermissionContext.Provider value={{ can: PermissionEngine.can, hasRole: PermissionEngine.hasRole }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissionContext = () => useContext(PermissionContext);
