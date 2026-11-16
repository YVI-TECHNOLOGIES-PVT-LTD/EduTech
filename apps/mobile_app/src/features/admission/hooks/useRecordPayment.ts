import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feesApi } from '../../../api/fees.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { RecordPaymentRequest } from '../../../types/admission.types';

export interface RecordPaymentMutationParams {
  applicationId: string;
  payload: RecordPaymentRequest;
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, RecordPaymentMutationParams>({
    mutationFn: ({ applicationId, payload }) => feesApi.recordPayment(applicationId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.fees.summary(variables.applicationId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.fees.receipt(variables.applicationId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.applications.detail(variables.applicationId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.timeline.byApplication(variables.applicationId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.applications.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.applications.mine(),
      });
    },
  });
}
