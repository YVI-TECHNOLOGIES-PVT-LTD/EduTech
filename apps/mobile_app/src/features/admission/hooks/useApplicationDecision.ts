import { useQuery } from '@tanstack/react-query';
import { decisionApi } from '../../../api/decision.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { AdmissionDecision } from '../../../types/admission.types';

export function useApplicationDecision(applicationId: string) {
  return useQuery<AdmissionDecision | null, Error>({
    queryKey: QUERY_KEYS.decision.byApplication(applicationId),
    queryFn: () => decisionApi.getByApplicationId(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 1000 * 60 * 2,
  });
}
