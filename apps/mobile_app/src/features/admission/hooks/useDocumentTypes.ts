import { useQuery } from '@tanstack/react-query';
import { metadataApi } from '../../../api/metadata.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { DocumentType } from '../../../types/admission.types';

export function useDocumentTypes() {
  return useQuery<DocumentType[], Error>({
    queryKey: QUERY_KEYS.metadata.documentTypes,
    queryFn: () => metadataApi.getDocumentTypes(),
    staleTime: 1000 * 60 * 15,
  });
}
