import React, { createContext, useContext } from 'react';

const NotificationContext = createContext({
  hasPermission: true,
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NotificationContext.Provider value={{ hasPermission: true }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
