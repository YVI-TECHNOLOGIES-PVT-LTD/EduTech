import { useQuery } from '@tanstack/react-query';
import { feesApi } from '../../../api/fees.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { FeeReceipt } from '../../../types/admission.types';

export function useApplicationReceipt(applicationId: string) {
  return useQuery<FeeReceipt, Error>({
    queryKey: QUERY_KEYS.fees.receipt(applicationId),
    queryFn: () => feesApi.getReceipt(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 1000 * 60 * 5,
  });
}
