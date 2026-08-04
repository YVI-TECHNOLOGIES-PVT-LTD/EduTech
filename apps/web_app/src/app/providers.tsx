import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from '../components/ui/sonner';
import { WorkspaceProvider } from '../modules/common/workspace/WorkspaceProvider';
import { MasterDataProvider } from '../modules/admission/context/MasterDataContext';
import { GlobalErrorBoundary } from '../components/common/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WorkspaceProvider>
            <MasterDataProvider>
              {children}
              <Toaster position="top-right" richColors />
            </MasterDataProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};
