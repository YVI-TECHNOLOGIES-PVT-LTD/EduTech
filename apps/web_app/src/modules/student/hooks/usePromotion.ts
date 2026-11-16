import {
  usePromoteStudentMutation,
  useBulkPromoteStudentsMutation,
} from '@/shared/api/student.api';

export function usePromotion() {
  const [promoteTrigger, promoteState] = usePromoteStudentMutation();
  const [bulkPromoteTrigger, bulkPromoteState] = useBulkPromoteStudentsMutation();

  const promoteStudent = async ({ id, data }: { id: string; data: any }) => {
    return promoteTrigger({ id, data }).unwrap();
  };

  const bulkPromote = async (data: any) => {
    return bulkPromoteTrigger(data).unwrap();
  };

  return {
    promoteStudent,
    isPromoting: promoteState.isLoading,
    bulkPromote,
    isBulkPromoting: bulkPromoteState.isLoading,
  };
}
