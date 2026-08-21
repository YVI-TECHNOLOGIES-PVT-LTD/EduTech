import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { TableSkeleton as EduTableSkeleton } from '@/components/edutrack/TableSkeleton';

export const LoadingOverlay = ({ message = 'Loading ERP session...' }: { message?: string }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="xl" className="text-primary" />
        <p className="text-sm font-bold text-foreground font-sans tracking-wide">{message}</p>
      </div>
    </div>
  );
};

export const ButtonSpinner = ({ label = 'Saving...' }: { label?: string }) => {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner size="sm" className="text-current" />
      {label}
    </span>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
  return <EduTableSkeleton rows={rows} cols={cols} />;
};

export const PageLoader = () => {
  return (
    <div className="h-[50vh] w-full flex items-center justify-center">
      <Spinner size="xl" className="text-primary" />
    </div>
  );
};
