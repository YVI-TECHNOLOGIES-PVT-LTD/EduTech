import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { Toaster } from '@/components/ui/sonner';
import { WorkspaceProvider } from '@/modules/common/workspace/WorkspaceProvider';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Provider store={store}>
      <WorkspaceProvider>
        {children}
        <Toaster position="top-right" richColors />
      </WorkspaceProvider>
    </Provider>
  );
};
