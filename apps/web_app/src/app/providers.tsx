import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { Toaster } from '@/components/ui/sonner';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Provider store={store}>
      {children}
      <Toaster position="top-right" richColors />
    </Provider>
  );
};
