import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalErrorBoundary } from '../core/errors/error-boundary';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { TenantProvider } from './TenantProvider';
import { PermissionProvider } from './PermissionProvider';
import { NetworkProvider } from './NetworkProvider';
import { NotificationProvider } from './NotificationProvider';
import { ToastProvider } from './ToastProvider';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <TenantProvider>
                <PermissionProvider>
                  <NetworkProvider>
                    <NotificationProvider>
                      <ToastProvider>{children}</ToastProvider>
                    </NotificationProvider>
                  </NetworkProvider>
                </PermissionProvider>
              </TenantProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
};
