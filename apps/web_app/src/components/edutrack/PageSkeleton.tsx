import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface PageSkeletonProps {
  className?: string;
  hasCards?: boolean;
  cardsCount?: number;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  className,
  hasCards = true,
  cardsCount = 4,
}) => {
  return (
    <div className={cn('p-6 space-y-6 max-w-[1600px] mx-auto w-full animate-fade-in', className)}>
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      {hasCards && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: cardsCount }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between min-h-[92px]"
            >
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-7 w-16 rounded" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Main Content / Table Skeleton */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/60">
          <Skeleton className="h-9 w-72 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-4 py-2 border-b border-border/40"
            >
              <Skeleton className="h-5 w-1/4 rounded" />
              <Skeleton className="h-5 w-1/3 rounded" />
              <Skeleton className="h-5 w-1/6 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
