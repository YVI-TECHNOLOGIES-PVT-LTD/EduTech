import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  cols = 5,
  className,
  showHeader = true,
}) => {
  return (
    <div className={cn('w-full space-y-3', className)}>
      {showHeader && (
        <div className="flex items-center justify-between gap-4 py-3 px-4 bg-muted/40 rounded-lg border border-border">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={`th-${j}`}
              className={cn(
                'h-4 rounded',
                j === 0 ? 'w-16' : j === 1 ? 'w-32' : j === cols - 1 ? 'w-20 ml-auto' : 'w-24',
              )}
            />
          ))}
        </div>
      )}
      <div className="divide-y divide-border/60 rounded-lg border border-border bg-card">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`row-${i}`} className="flex items-center justify-between gap-4 py-3.5 px-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton
                key={`cell-${i}-${j}`}
                className={cn(
                  'h-4 rounded',
                  j === 0
                    ? 'w-12'
                    : j === 1
                      ? 'w-40'
                      : j === 2
                        ? 'w-28'
                        : j === cols - 1
                          ? 'w-16 ml-auto'
                          : 'w-24',
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
