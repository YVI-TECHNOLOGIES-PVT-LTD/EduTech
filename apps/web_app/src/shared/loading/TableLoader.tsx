import React from 'react';
import { TableSkeleton } from '@/components/edutrack/TableSkeleton';

export interface TableLoaderProps {
  rows?: number;
  columns?: number;
}

export const TableLoader: React.FC<TableLoaderProps> = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="w-full p-4">
      <TableSkeleton rows={rows} cols={columns} />
    </div>
  );
};

export default TableLoader;
