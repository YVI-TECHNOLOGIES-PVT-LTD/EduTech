import { useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { setSelectedChildId } from '@/shared/store/parentPortalSlice';
import { ParentChildDto, useGetParentChildrenQuery } from '@/shared/api/parentPortal.api';

export function useParentSelectedChild() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlChildId = searchParams.get('childId');
  const reduxChildId = useAppSelector((state) => state.parentPortal.selectedChildId);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetParentChildrenQuery();

  const children: ParentChildDto[] = useMemo(() => data?.children || [], [data?.children]);

  const effectiveChild = useMemo<ParentChildDto | null>(() => {
    if (children.length === 0) return null;
    if (urlChildId) {
      const fromUrl = children.find((c) => c.student_id === urlChildId);
      if (fromUrl) return fromUrl;
    }
    if (reduxChildId) {
      const fromRedux = children.find((c) => c.student_id === reduxChildId);
      if (fromRedux) return fromRedux;
    }
    return children[0];
  }, [children, urlChildId, reduxChildId]);

  const selectedChildId = effectiveChild?.student_id || null;

  useEffect(() => {
    if (selectedChildId && selectedChildId !== reduxChildId) {
      dispatch(setSelectedChildId(selectedChildId));
    }
  }, [selectedChildId, reduxChildId, dispatch]);

  const selectChild = useCallback(
    (childId: string) => {
      dispatch(setSelectedChildId(childId));
      const next = new URLSearchParams(searchParams);
      next.set('childId', childId);
      setSearchParams(next, { replace: true });
    },
    [dispatch, searchParams, setSearchParams],
  );

  return {
    children,
    selectedChild: effectiveChild,
    selectedChildId,
    selectChild,
    organization: data?.organization || null,
    currentAcademicYear: data?.current_academic_year || null,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
