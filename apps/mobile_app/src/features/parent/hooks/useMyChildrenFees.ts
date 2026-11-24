import { useQuery } from '@tanstack/react-query';
import { feesApi } from '../../../api/fees.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { ParentChildrenFeesResponse, ChildFeeOverview } from '../../../types/admission.types';
import { useAuthStore } from '../../../stores/auth.store';

export function useMyChildrenFees() {
  const { isAuthenticated } = useAuthStore();
  const query = useQuery<ParentChildrenFeesResponse, Error>({
    queryKey: QUERY_KEYS.fees.myChildren(),
    queryFn: () => feesApi.getMyChildrenFees(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: Boolean(isAuthenticated),
  });

  const children: ChildFeeOverview[] = query.data?.children || query.data?.data || [];

  return {
    ...query,
    children,
    childrenCount: query.data?.children_count ?? children.length,
    parentName: query.data?.parent_name ?? null,
  };
}

export function useChildFeeDetails(studentId: string) {
  return useQuery<ChildFeeOverview, Error>({
    queryKey: QUERY_KEYS.fees.childDetails(studentId),
    queryFn: () => feesApi.getChildFeeDetails(studentId),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 2,
  });
}
