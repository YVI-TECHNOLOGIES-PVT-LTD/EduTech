import { useQuery } from '@tanstack/react-query';
import { feesApi } from '../../../api/fees.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { FeeSummary } from '../../../types/admission.types';

export function useApplicationFee(applicationId: string) {
  return useQuery<FeeSummary, Error>({
    queryKey: QUERY_KEYS.fees.summary(applicationId),
    queryFn: () => feesApi.getFeeSummary(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 1000 * 60 * 2,
  });
}
