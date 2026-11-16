import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const NotificationLoadingState: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="divide-y divide-border/40 p-1">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 p-3.5 animate-pulse">
          <Skeleton className="w-9 h-9 rounded-full shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-32 rounded-md" />
              <Skeleton className="h-2.5 w-12 rounded-md" />
            </div>
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-3/4 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};
