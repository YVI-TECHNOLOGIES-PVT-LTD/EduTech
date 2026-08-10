import {
  useGetStudentsQuery,
  useRegisterStudentMutation,
  useUpdateStudentProfileMutation,
  useUpdateStudentParentsMutation,
} from '@/shared/api/student.api';

export function useStudents(params?: any) {
  const query = useGetStudentsQuery(params);

  const [registerTrigger, registerState] = useRegisterStudentMutation();
  const [updateProfileTrigger, updateProfileState] = useUpdateStudentProfileMutation();
  const [updateParentsTrigger, updateParentsState] = useUpdateStudentParentsMutation();

  const registerStudent = async (data: any) => {
    return registerTrigger(data).unwrap();
  };

  const updateProfile = async ({ id, data }: { id: string; data: any }) => {
    return updateProfileTrigger({ id, data }).unwrap();
  };

  const updateParents = async ({ id, data }: { id: string; data: any }) => {
    return updateParentsTrigger({ id, data }).unwrap();
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    registerStudent,
    isRegistering: registerState.isLoading,
    updateProfile,
    isUpdatingProfile: updateProfileState.isLoading,
    updateParents,
    isUpdatingParents: updateParentsState.isLoading,
  };
}
