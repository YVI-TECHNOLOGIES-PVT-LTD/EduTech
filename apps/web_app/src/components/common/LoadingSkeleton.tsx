import React from 'react';

export const PageSkeleton = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);
