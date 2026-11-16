import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi, UploadDocumentParams } from '../../../api/documents.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { AdmissionDocument } from '../../../types/admission.types';

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<AdmissionDocument, Error, UploadDocumentParams>({
    mutationFn: (params: UploadDocumentParams) => documentsApi.upload(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.documents.list(variables.applicationId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.applications.detail(variables.applicationId),
      });
    },
  });
}
