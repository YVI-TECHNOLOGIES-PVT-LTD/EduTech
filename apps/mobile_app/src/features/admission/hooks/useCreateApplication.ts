import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../../../api/applications.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { CreateApplicationRequest, AdmissionApplication } from '../../../types/admission.types';

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation<AdmissionApplication, Error, CreateApplicationRequest>({
    mutationFn: (payload: CreateApplicationRequest) => applicationsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications.mine() });
    },
  });
}
