import { useGetStudentByIdQuery } from '@/shared/api/student.api';

export function useStudent(id: string) {
  const query = useGetStudentByIdQuery(id, { skip: !id });

  return {
    student: query.data,
    isLoadingStudent: query.isLoading,
    timeline: [],
    isLoadingTimeline: false,
    history: [],
    isLoadingHistory: false,
    allocateClass: async (_payload?: any) => {},
    isAllocating: false,
    refetchAll: () => {
      query.refetch();
    },
  };
}
