import { useQuery } from '@tanstack/react-query';
import { timelineApi } from '../../../api/timeline.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { ApplicationTimelineDto } from '../../../types/admission.types';

export function useApplicationTimeline(applicationId: string) {
  return useQuery<ApplicationTimelineDto, Error>({
    queryKey: QUERY_KEYS.timeline.byApplication(applicationId),
    queryFn: () => timelineApi.getTimeline(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 1000 * 60 * 2,
  });
}
