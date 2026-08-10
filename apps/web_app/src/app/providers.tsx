import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { WorkspaceProvider } from '@/modules/common/workspace/WorkspaceProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AuthProvider>
          <WorkspaceProvider>
            {children}
            <Toaster position="top-right" richColors />
          </WorkspaceProvider>
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  );
};
