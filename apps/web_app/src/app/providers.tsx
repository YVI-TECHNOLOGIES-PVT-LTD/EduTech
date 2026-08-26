import React from 'react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { store } from './store';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { MasterDataProvider } from '@/modules/admission/context/MasterDataContext';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WorkspaceProvider } from '@/modules/common/workspace/WorkspaceProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <MasterDataProvider>
                  <WorkspaceProvider>
                    <TooltipProvider delay={0}>
                      {children}
                      <Toaster position="top-right" richColors />
                    </TooltipProvider>
                  </WorkspaceProvider>
                </MasterDataProvider>
              </AuthProvider>
            </QueryClientProvider>
          </Provider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

