import {
  useRequestStudentTransferMutation,
  useApproveStudentTransferMutation,
} from '@/shared/api/student.api';

export function useTransfer() {
  const [requestTrigger, requestState] = useRequestStudentTransferMutation();
  const [approveTrigger, approveState] = useApproveStudentTransferMutation();

  const requestTransfer = async ({ id, data }: { id: string; data: any }) => {
    return requestTrigger({ id, data }).unwrap();
  };

  const approveTransfer = async (requestId: string) => {
    return approveTrigger(requestId).unwrap();
  };

  return {
    requestTransfer,
    isRequesting: requestState.isLoading,
    approveTransfer,
    isApproving: approveState.isLoading,
  };
}
