import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '../api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      retry: (failureCount, error) => {
        // Do not retry on client errors (401, 403, 404, 422)
        if (error instanceof ApiError) {
          if ([400, 401, 403, 404, 422].includes(error.status)) {
            return false;
          }
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // RULE 20: Do NOT automatically retry POST/PATCH/DELETE mutations to prevent duplicates
      retry: false,
    },
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
