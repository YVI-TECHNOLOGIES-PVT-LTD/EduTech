import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading module data...' }) => {
  return (
    <div className="flex h-96 w-full flex-col items-center justify-center space-y-3">
      <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
};
