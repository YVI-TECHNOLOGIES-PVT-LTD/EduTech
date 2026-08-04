import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConnectivityService } from '../core/network/connectivity';
import { SyncManager } from '../core/network/sync-manager';
import { OfflineBanner } from '../components/common/OfflineBanner';

const NetworkContext = createContext({
  isOnline: true,
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    ConnectivityService.setNetworkStatus(true);
    SyncManager.processOfflineQueue().catch(() => {});
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      <OfflineBanner isOnline={isOnline} />
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetworkContext = () => useContext(NetworkContext);
