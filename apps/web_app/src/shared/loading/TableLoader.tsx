import React from 'react';
import { Skeleton } from './Skeleton';

interface TableLoaderProps {
  rows?: number;
  columns?: number;
}

export const TableLoader: React.FC<TableLoaderProps> = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="w-full space-y-3 p-4">
      <div className="flex items-center justify-between space-x-4 pb-2">
        <Skeleton className="h-9 w-64" />
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="rounded-md border border-slate-200 p-2 dark:border-slate-800">
        <div className="mb-2 flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="my-2 flex space-x-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-10 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
