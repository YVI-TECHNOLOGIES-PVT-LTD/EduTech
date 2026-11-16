import { useQuery } from '@tanstack/react-query';
import { financeApi, ChildFeeLedger } from '../../../api/finance.api';
import { QUERY_KEYS } from '../../../api/query-keys';

/**
 * On-demand query hook for child fee ledger
 */
export function useChildFeeLedger(studentId?: string) {
  return useQuery<ChildFeeLedger | null, Error>({
    queryKey: QUERY_KEYS.finance.childLedger(studentId || ''),
    queryFn: () => financeApi.getChildFeeDetails(studentId!),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });
}
