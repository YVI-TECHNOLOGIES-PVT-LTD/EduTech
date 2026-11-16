import { useQuery } from '@tanstack/react-query';
import { assessmentApi } from '../../../api/assessment.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { AssessmentResult } from '../../../types/admission.types';

export function useApplicationAssessment(applicationId: string) {
  return useQuery<AssessmentResult | null, Error>({
    queryKey: QUERY_KEYS.assessment.byApplication(applicationId),
    queryFn: () => assessmentApi.getByApplicationId(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 1000 * 60 * 2,
  });
}
