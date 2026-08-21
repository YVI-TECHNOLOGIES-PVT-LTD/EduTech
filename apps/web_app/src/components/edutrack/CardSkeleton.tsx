import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 4, className }) => {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <Card
          key={idx}
          className="min-h-[92px] p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between"
        >
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg shrink-0 ml-3" />
        </Card>
      ))}
    </div>
  );
};
