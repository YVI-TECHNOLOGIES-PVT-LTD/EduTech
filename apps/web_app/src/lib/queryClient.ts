import { QueryClient } from '@tanstack/react-query';

/**
 * Canonical singleton QueryClient for TanStack React Query.
 * Exported so that auth lifecycle, session reset, and UI providers
 * share the exact same client instance.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});
