import React from 'react';
import { Spinner } from '@/components/ui/spinner';

export interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading module data...' }) => {
  return (
    <div className="flex h-96 w-full flex-col items-center justify-center space-y-3">
      <Spinner size="xl" className="text-primary" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
};

export default PageLoader;
