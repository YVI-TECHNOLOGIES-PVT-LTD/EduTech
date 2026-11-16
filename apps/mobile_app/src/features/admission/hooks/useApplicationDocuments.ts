import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '../../../api/documents.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { AdmissionDocument } from '../../../types/admission.types';

export function useApplicationDocuments(applicationId: string) {
  return useQuery<AdmissionDocument[], Error>({
    queryKey: QUERY_KEYS.documents.list(applicationId),
    queryFn: () => documentsApi.listByApplication(applicationId),
    enabled: Boolean(applicationId),
    staleTime: 1000 * 60 * 2,
  });
}
