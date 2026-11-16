import React from 'react';
import { Spinner } from '@/components/ui/spinner';

export const Loading = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 space-y-3 animate-fade-in">
    <Spinner size="xl" className="text-primary" />
    <p className="text-xs font-semibold text-muted-foreground tracking-wide">{message}</p>
  </div>
);

export default Loading;
