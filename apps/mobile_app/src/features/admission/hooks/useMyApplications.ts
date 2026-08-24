import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '../../../api/applications.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { AdmissionApplication } from '../../../types/admission.types';

export function useMyApplications() {
  return useQuery<AdmissionApplication[], Error>({
    queryKey: QUERY_KEYS.applications.mine(),
    queryFn: () => applicationsApi.listMine(),
    staleTime: 1000 * 60 * 2, // 2 minutes fresh cache
  });
}
